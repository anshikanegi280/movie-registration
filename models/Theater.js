const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  row: {
    type: String,
    required: [true, 'Seat row is required'],
    match: [/^[A-Z]$/, 'Row must be a single uppercase letter']
  },
  number: {
    type: Number,
    required: [true, 'Seat number is required'],
    min: [1, 'Seat number must be at least 1'],
    max: [50, 'Seat number cannot exceed 50']
  },
  type: {
    type: String,
    enum: ['regular', 'premium', 'vip'],
    default: 'regular'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Theater name is required'],
    trim: true,
    maxlength: [100, 'Theater name cannot exceed 100 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
      match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid zip code']
    },
    coordinates: {
      lat: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Theater capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [1000, 'Capacity cannot exceed 1000']
  },
  seats: [seatSchema],
  amenities: [{
    type: String,
    enum: ['3D', 'IMAX', 'Dolby Atmos', 'Reclining Seats', 'Food Service', 'Wheelchair Accessible', 'Parking Available']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priceMultiplier: {
    regular: {
      type: Number,
      default: 1.0,
      min: [0.1, 'Price multiplier must be at least 0.1']
    },
    premium: {
      type: Number,
      default: 1.5,
      min: [0.1, 'Price multiplier must be at least 0.1']
    },
    vip: {
      type: Number,
      default: 2.0,
      min: [0.1, 'Price multiplier must be at least 0.1']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full address
theaterSchema.virtual('fullAddress').get(function() {
  return `${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zipCode}`;
});

// Virtual for available seats count
theaterSchema.virtual('availableSeats').get(function() {
  return this.seats.filter(seat => seat.isActive).length;
});

// Virtual for seat type counts
theaterSchema.virtual('seatTypeCounts').get(function() {
  const counts = { regular: 0, premium: 0, vip: 0 };
  this.seats.filter(seat => seat.isActive).forEach(seat => {
    counts[seat.type]++;
  });
  return counts;
});

// Indexes for better query performance
theaterSchema.index({ name: 1 });
theaterSchema.index({ 'location.city': 1 });
theaterSchema.index({ 'location.state': 1 });
theaterSchema.index({ isActive: 1 });
theaterSchema.index({ 'location.coordinates': '2dsphere' });

// Pre-save middleware to generate seats if not provided
theaterSchema.pre('save', function(next) {
  if (this.seats.length === 0 && this.capacity > 0) {
    this.generateSeats();
  }
  next();
});

// Method to generate seats based on capacity
theaterSchema.methods.generateSeats = function() {
  const seats = [];
  const seatsPerRow = 10;
  const rows = Math.ceil(this.capacity / seatsPerRow);
  
  for (let i = 0; i < rows; i++) {
    const row = String.fromCharCode(65 + i); // A, B, C, etc.
    const seatsInThisRow = Math.min(seatsPerRow, this.capacity - (i * seatsPerRow));
    
    for (let j = 1; j <= seatsInThisRow; j++) {
      let seatType = 'regular';
      if (i < 2) seatType = 'premium'; // First two rows are premium
      if (i === 0 && j >= 4 && j <= 7) seatType = 'vip'; // Middle seats in first row are VIP
      
      seats.push({
        row: row,
        number: j,
        type: seatType,
        isActive: true
      });
    }
  }
  
  this.seats = seats;
};

// Method to get seat by row and number
theaterSchema.methods.getSeat = function(row, number) {
  return this.seats.find(seat => seat.row === row && seat.number === number);
};

module.exports = mongoose.model('Theater', theaterSchema);
