const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  showtime: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime',
    required: [true, 'Showtime is required']
  },
  seats: [{
    row: {
      type: String,
      required: [true, 'Seat row is required']
    },
    number: {
      type: Number,
      required: [true, 'Seat number is required']
    },
    type: {
      type: String,
      enum: ['regular', 'premium', 'vip'],
      required: [true, 'Seat type is required']
    },
    price: {
      type: Number,
      required: [true, 'Seat price is required'],
      min: [0, 'Price cannot be negative']
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  discountApplied: {
    type: {
      type: String,
      enum: ['early_bird', 'student', 'senior', 'group', 'promo_code']
    },
    amount: {
      type: Number,
      min: [0, 'Discount amount cannot be negative']
    },
    description: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'cash', 'gift_card'],
      required: [true, 'Payment method is required']
    },
    transactionId: {
      type: String,
      required: function() {
        return this.paymentDetails.method !== 'cash';
      }
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  reservationNumber: {
    type: String,
    unique: true,
    required: [true, 'Reservation number is required']
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required']
    }
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  checkInTime: {
    type: Date
  },
  qrCode: {
    type: String // Will store QR code data or URL
  },
  remindersSent: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  isGift: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String,
    maxlength: [200, 'Gift message cannot exceed 200 characters']
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancelledAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative']
  },
  refundProcessed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for seat count
reservationSchema.virtual('seatCount').get(function() {
  return this.seats.length;
});

// Virtual for formatted seat list
reservationSchema.virtual('formattedSeats').get(function() {
  return this.seats.map(seat => `${seat.row}${seat.number}`).join(', ');
});

// Virtual to check if reservation is cancellable
reservationSchema.virtual('isCancellable').get(function() {
  if (this.status === 'cancelled' || this.status === 'completed') {
    return false;
  }
  
  // Can't cancel if showtime is in the past or starting within 2 hours
  if (this.showtime && this.showtime.startTime) {
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return this.showtime.startTime > twoHoursFromNow;
  }
  
  return true;
});

// Virtual to check if reservation is editable
reservationSchema.virtual('isEditable').get(function() {
  if (this.status !== 'confirmed') {
    return false;
  }
  
  // Can't edit if showtime is in the past or starting within 24 hours
  if (this.showtime && this.showtime.startTime) {
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return this.showtime.startTime > twentyFourHoursFromNow;
  }
  
  return true;
});

// Virtual for discount percentage
reservationSchema.virtual('discountPercentage').get(function() {
  if (!this.discountApplied || !this.discountApplied.amount) return 0;
  const baseAmount = this.totalAmount + this.discountApplied.amount;
  return Math.round((this.discountApplied.amount / baseAmount) * 100);
});

// Indexes for better query performance
reservationSchema.index({ user: 1, createdAt: -1 });
reservationSchema.index({ showtime: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ reservationNumber: 1 });
reservationSchema.index({ 'paymentDetails.transactionId': 1 });
reservationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ showtime: 1, status: 1 });

// Pre-save middleware to generate reservation number
reservationSchema.pre('save', function(next) {
  if (this.isNew && !this.reservationNumber) {
    this.reservationNumber = this.generateReservationNumber();
  }
  next();
});

// Pre-save middleware to validate payment amount
reservationSchema.pre('save', function(next) {
  if (this.paymentDetails.amount !== this.totalAmount) {
    return next(new Error('Payment amount must match total amount'));
  }
  next();
});

// Method to generate reservation number
reservationSchema.methods.generateReservationNumber = function() {
  const prefix = 'MR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

// Method to cancel reservation
reservationSchema.methods.cancel = function(reason) {
  if (!this.isCancellable) {
    throw new Error('This reservation cannot be cancelled');
  }
  
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  
  // Calculate refund amount (example: 90% refund if cancelled more than 24 hours before)
  const hoursUntilShowtime = (this.showtime.startTime - new Date()) / (1000 * 60 * 60);
  if (hoursUntilShowtime > 24) {
    this.refundAmount = this.totalAmount * 0.9; // 90% refund
  } else if (hoursUntilShowtime > 2) {
    this.refundAmount = this.totalAmount * 0.5; // 50% refund
  } else {
    this.refundAmount = 0; // No refund
  }
};

// Method to confirm reservation
reservationSchema.methods.confirm = function() {
  this.status = 'confirmed';
};

// Method to complete reservation (after movie is watched)
reservationSchema.methods.complete = function() {
  this.status = 'completed';
};

// Method to mark as no-show
reservationSchema.methods.markAsNoShow = function() {
  this.status = 'no_show';
};

// Method to check in
reservationSchema.methods.checkIn = function() {
  this.checkInTime = new Date();
};

// Static method to get revenue for a date range
reservationSchema.statics.getRevenueForDateRange = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['confirmed', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalReservations: { $sum: 1 },
        averageReservationValue: { $avg: '$totalAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Reservation', reservationSchema);
