const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie is required']
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: [true, 'Theater is required']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  availableSeats: [{
    row: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['regular', 'premium', 'vip'],
      default: 'regular'
    },
    price: {
      type: Number,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  reservedSeats: [{
    row: {
      type: String,
      required: true
    },
    number: {
      type: Number,
      required: true
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reservedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  specialOffers: [{
    type: {
      type: String,
      enum: ['early_bird', 'student', 'senior', 'group'],
      required: true
    },
    discount: {
      type: Number,
      required: true,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    description: {
      type: String,
      required: true
    },
    validUntil: {
      type: Date
    }
  }],
  language: {
    type: String,
    default: 'English'
  },
  subtitles: [{
    type: String
  }],
  format: {
    type: String,
    enum: ['2D', '3D', 'IMAX', 'Dolby Atmos'],
    default: '2D'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for duration in minutes
showtimeSchema.virtual('duration').get(function() {
  return Math.ceil((this.endTime - this.startTime) / (1000 * 60));
});

// Virtual for available seats count
showtimeSchema.virtual('availableSeatsCount').get(function() {
  return this.availableSeats.filter(seat => seat.isAvailable).length;
});

// Virtual for reserved seats count
showtimeSchema.virtual('reservedSeatsCount').get(function() {
  return this.reservedSeats.length;
});

// Virtual for total capacity
showtimeSchema.virtual('totalCapacity').get(function() {
  return this.availableSeats.length;
});

// Virtual for occupancy percentage
showtimeSchema.virtual('occupancyPercentage').get(function() {
  if (this.totalCapacity === 0) return 0;
  return Math.round((this.reservedSeatsCount / this.totalCapacity) * 100);
});

// Virtual to check if showtime is in the past
showtimeSchema.virtual('isPast').get(function() {
  return this.startTime < new Date();
});

// Virtual to check if showtime is starting soon (within 30 minutes)
showtimeSchema.virtual('isStartingSoon').get(function() {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  return this.startTime <= thirtyMinutesFromNow && this.startTime > now;
});

// Indexes for better query performance
showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ theater: 1, startTime: 1 });
showtimeSchema.index({ startTime: 1 });
showtimeSchema.index({ isActive: 1 });
showtimeSchema.index({ 'availableSeats.isAvailable': 1 });

// Compound index for common queries
showtimeSchema.index({ movie: 1, theater: 1, startTime: 1 });

// Pre-save middleware to validate start and end times
showtimeSchema.pre('save', function(next) {
  if (this.endTime <= this.startTime) {
    return next(new Error('End time must be after start time'));
  }
  
  // Don't allow showtimes to be created in the past
  if (this.isNew && this.startTime < new Date()) {
    return next(new Error('Cannot create showtime in the past'));
  }
  
  next();
});

// Method to reserve seats
showtimeSchema.methods.reserveSeats = function(seats, userId) {
  const reservedSeats = [];
  
  for (const seatRequest of seats) {
    const seat = this.availableSeats.find(s => 
      s.row === seatRequest.row && 
      s.number === seatRequest.number && 
      s.isAvailable
    );
    
    if (!seat) {
      throw new Error(`Seat ${seatRequest.row}${seatRequest.number} is not available`);
    }
    
    // Mark seat as unavailable
    seat.isAvailable = false;
    
    // Add to reserved seats
    reservedSeats.push({
      row: seat.row,
      number: seat.number,
      reservedBy: userId,
      reservedAt: new Date()
    });
  }
  
  this.reservedSeats.push(...reservedSeats);
  return reservedSeats;
};

// Method to release seats (for cancellation)
showtimeSchema.methods.releaseSeats = function(seats) {
  for (const seatToRelease of seats) {
    // Remove from reserved seats
    this.reservedSeats = this.reservedSeats.filter(seat => 
      !(seat.row === seatToRelease.row && seat.number === seatToRelease.number)
    );
    
    // Mark as available
    const availableSeat = this.availableSeats.find(seat => 
      seat.row === seatToRelease.row && seat.number === seatToRelease.number
    );
    if (availableSeat) {
      availableSeat.isAvailable = true;
    }
  }
};

// Method to get price for a seat
showtimeSchema.methods.getSeatPrice = function(row, number) {
  const seat = this.availableSeats.find(s => s.row === row && s.number === number);
  return seat ? seat.price : null;
};

// Method to calculate total price for multiple seats
showtimeSchema.methods.calculateTotalPrice = function(seats) {
  return seats.reduce((total, seat) => {
    const price = this.getSeatPrice(seat.row, seat.number);
    return total + (price || 0);
  }, 0);
};

module.exports = mongoose.model('Showtime', showtimeSchema);
