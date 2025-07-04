const Reservation = require('../models/Reservation');
const Showtime = require('../models/Showtime');
const User = require('../models/User');

// Create new reservation
const createReservation = async (req, res) => {
  try {
    const { showtime, seats, paymentDetails, contactInfo, specialRequests, isGift, giftMessage } = req.body;
    const userId = req.user._id;

    // Verify showtime exists and is active
    const showtimeDoc = await Showtime.findById(showtime);
    if (!showtimeDoc || !showtimeDoc.isActive) {
      return res.status(400).json({
        error: 'Invalid showtime',
        message: 'Showtime not found or inactive'
      });
    }

    // Check if showtime is in the future
    if (showtimeDoc.startTime <= new Date()) {
      return res.status(400).json({
        error: 'Showtime unavailable',
        message: 'Cannot make reservations for past or ongoing showtimes'
      });
    }

    // Check if all requested seats are available
    const requestedSeats = seats.map(seat => ({ row: seat.row, number: seat.number }));
    const unavailableSeats = [];
    
    for (const seat of requestedSeats) {
      const availableSeat = showtimeDoc.availableSeats.find(s => 
        s.row === seat.row && s.number === seat.number && s.isAvailable
      );
      if (!availableSeat) {
        unavailableSeats.push(`${seat.row}${seat.number}`);
      }
    }

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        error: 'Seats unavailable',
        message: `The following seats are not available: ${unavailableSeats.join(', ')}`
      });
    }

    // Calculate total amount
    const reservationSeats = [];
    let totalAmount = 0;

    for (const seat of requestedSeats) {
      const availableSeat = showtimeDoc.availableSeats.find(s => 
        s.row === seat.row && s.number === seat.number
      );
      
      reservationSeats.push({
        row: seat.row,
        number: seat.number,
        type: availableSeat.type,
        price: availableSeat.price
      });
      
      totalAmount += availableSeat.price;
    }

    // Create reservation
    const reservation = new Reservation({
      user: userId,
      showtime,
      seats: reservationSeats,
      totalAmount,
      paymentDetails: {
        ...paymentDetails,
        amount: totalAmount
      },
      contactInfo,
      specialRequests,
      isGift,
      giftMessage
    });

    // Reserve seats in showtime
    try {
      showtimeDoc.reserveSeats(requestedSeats, userId);
      await showtimeDoc.save();
      
      await reservation.save();
      
      // Populate reservation for response
      await reservation.populate('showtime', 'startTime endTime movie theater');
      await reservation.populate('showtime.movie', 'title poster duration genre rating');
      await reservation.populate('showtime.theater', 'name location');

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation
      });
    } catch (error) {
      console.error('Seat reservation error:', error);
      return res.status(400).json({
        error: 'Seat reservation failed',
        message: error.message || 'Failed to reserve seats'
      });
    }
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      error: 'Failed to create reservation',
      message: error.message || 'Internal server error'
    });
  }
};

// Get user's reservations
const getUserReservations = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: userId };
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const reservations = await Reservation.find(query)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration genre rating' },
          { path: 'theater', select: 'name location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      message: 'Reservations retrieved successfully',
      reservations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReservations: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get user reservations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reservations',
      message: 'Internal server error'
    });
  }
};

// Get reservation by ID
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await Reservation.findById(id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration genre rating' },
          { path: 'theater', select: 'name location' }
        ]
      })
      .populate('user', 'firstName lastName email phone');

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
        message: 'The requested reservation does not exist'
      });
    }

    // Check if user can access this reservation
    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own reservations'
      });
    }

    res.json({
      message: 'Reservation retrieved successfully',
      reservation
    });
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reservation',
      message: 'Internal server error'
    });
  }
};

// Cancel reservation
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findById(id)
      .populate('showtime');

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
        message: 'The requested reservation does not exist'
      });
    }

    // Check if user can cancel this reservation
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only cancel your own reservations'
      });
    }

    // Check if reservation can be cancelled
    if (!reservation.isCancellable) {
      return res.status(400).json({
        error: 'Cannot cancel reservation',
        message: 'This reservation cannot be cancelled'
      });
    }

    // Cancel reservation
    reservation.cancel(reason);
    await reservation.save();

    // Release seats in showtime
    const showtime = await Showtime.findById(reservation.showtime._id);
    if (showtime) {
      showtime.releaseSeats(reservation.seats);
      await showtime.save();
    }

    res.json({
      message: 'Reservation cancelled successfully',
      reservation: {
        id: reservation._id,
        status: reservation.status,
        refundAmount: reservation.refundAmount,
        cancellationReason: reservation.cancellationReason,
        cancelledAt: reservation.cancelledAt
      }
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      error: 'Failed to cancel reservation',
      message: error.message || 'Internal server error'
    });
  }
};

// Check-in for reservation
const checkInReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('showtime');

    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
        message: 'The requested reservation does not exist'
      });
    }

    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Invalid reservation status',
        message: 'Only confirmed reservations can be checked in'
      });
    }

    // Check if showtime is starting soon (within 2 hours)
    const now = new Date();
    const showtimeStart = new Date(reservation.showtime.startTime);
    const timeDiff = (showtimeStart - now) / (1000 * 60); // difference in minutes

    if (timeDiff > 120) {
      return res.status(400).json({
        error: 'Too early for check-in',
        message: 'Check-in is only available 2 hours before showtime'
      });
    }

    if (timeDiff < -30) {
      return res.status(400).json({
        error: 'Too late for check-in',
        message: 'Check-in is not available after showtime has started'
      });
    }

    // Check in
    reservation.checkIn();
    await reservation.save();

    res.json({
      message: 'Check-in successful',
      reservation: {
        id: reservation._id,
        checkInTime: reservation.checkInTime,
        seats: reservation.formattedSeats
      }
    });
  } catch (error) {
    console.error('Check-in reservation error:', error);
    res.status(500).json({
      error: 'Failed to check in',
      message: 'Internal server error'
    });
  }
};

// Admin: Get all reservations
const getAllReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const reservations = await Reservation.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration genre rating' },
          { path: 'theater', select: 'name location' }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      message: 'Reservations retrieved successfully',
      reservations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReservations: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve reservations',
      message: 'Internal server error'
    });
  }
};

// Admin: Update reservation status
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({
        error: 'Reservation not found',
        message: 'The requested reservation does not exist'
      });
    }

    // Use appropriate method based on status
    switch (status) {
      case 'confirmed':
        reservation.confirm();
        break;
      case 'completed':
        reservation.complete();
        break;
      case 'no_show':
        reservation.markAsNoShow();
        break;
      default:
        reservation.status = status;
    }

    await reservation.save();

    res.json({
      message: 'Reservation status updated successfully',
      reservation: {
        id: reservation._id,
        status: reservation.status,
        updatedAt: reservation.updatedAt
      }
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      error: 'Failed to update reservation status',
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  createReservation,
  getUserReservations,
  getReservationById,
  cancelReservation,
  checkInReservation,
  getAllReservations,
  updateReservationStatus
};
