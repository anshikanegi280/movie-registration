const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');

// Get all showtimes
const getAllShowtimes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    // Filter by active status (default to true)
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    } else {
      query.isActive = true;
    }

    // Filter by movie
    if (req.query.movie) {
      query.movie = req.query.movie;
    }

    // Filter by theater
    if (req.query.theater) {
      query.theater = req.query.theater;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.startTime = {};
      if (req.query.startDate) {
        query.startTime.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.startTime.$lte = new Date(req.query.endDate);
      }
    } else {
      // Default: only show future showtimes
      query.startTime = { $gt: new Date() };
    }

    const showtimes = await Showtime.find(query)
      .populate('movie', 'title genre duration rating poster')
      .populate('theater', 'name location capacity')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Showtime.countDocuments(query);

    res.json({
      message: 'Showtimes retrieved successfully',
      showtimes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalShowtimes: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get all showtimes error:', error);
    res.status(500).json({
      error: 'Failed to retrieve showtimes',
      message: 'Internal server error'
    });
  }
};

// Get showtime by ID
const getShowtimeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const showtime = await Showtime.findById(id)
      .populate('movie')
      .populate('theater');

    if (!showtime) {
      return res.status(404).json({
        error: 'Showtime not found',
        message: 'The requested showtime does not exist'
      });
    }

    // Only return active showtimes to regular users
    if (!showtime.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        error: 'Showtime not found',
        message: 'The requested showtime does not exist'
      });
    }

    res.json({
      message: 'Showtime retrieved successfully',
      showtime
    });
  } catch (error) {
    console.error('Get showtime by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve showtime',
      message: 'Internal server error'
    });
  }
};

// Create new showtime (Admin only)
const createShowtime = async (req, res) => {
  try {
    const { movie, theater, startTime, endTime, basePrice, language, format } = req.body;

    // Verify movie exists
    const movieDoc = await Movie.findById(movie);
    if (!movieDoc || !movieDoc.isActive) {
      return res.status(400).json({
        error: 'Invalid movie',
        message: 'Movie not found or inactive'
      });
    }

    // Verify theater exists
    const theaterDoc = await Theater.findById(theater);
    if (!theaterDoc || !theaterDoc.isActive) {
      return res.status(400).json({
        error: 'Invalid theater',
        message: 'Theater not found or inactive'
      });
    }

    // Check for scheduling conflicts
    const conflictingShowtime = await Showtime.findOne({
      theater: theater,
      isActive: true,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflictingShowtime) {
      return res.status(400).json({
        error: 'Scheduling conflict',
        message: 'Theater is already booked for this time slot'
      });
    }

    // Generate available seats from theater
    const availableSeats = theaterDoc.seats.filter(seat => seat.isActive).map(seat => ({
      row: seat.row,
      number: seat.number,
      type: seat.type,
      price: basePrice * theaterDoc.priceMultiplier[seat.type],
      isAvailable: true
    }));

    const showtime = new Showtime({
      movie,
      theater,
      startTime,
      endTime,
      basePrice,
      availableSeats,
      language: language || movieDoc.language,
      format
    });

    await showtime.save();

    // Populate the response
    await showtime.populate('movie', 'title genre duration rating poster');
    await showtime.populate('theater', 'name location capacity');

    res.status(201).json({
      message: 'Showtime created successfully',
      showtime
    });
  } catch (error) {
    console.error('Create showtime error:', error);
    res.status(500).json({
      error: 'Failed to create showtime',
      message: error.message || 'Internal server error'
    });
  }
};

// Update showtime (Admin only)
const updateShowtime = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({
        error: 'Showtime not found',
        message: 'The requested showtime does not exist'
      });
    }

    // Don't allow updates to showtimes that have already started
    if (showtime.startTime < new Date()) {
      return res.status(400).json({
        error: 'Cannot update past showtime',
        message: 'Cannot update a showtime that has already started'
      });
    }

    // Don't allow updates if there are reservations
    if (showtime.reservedSeats.length > 0) {
      return res.status(400).json({
        error: 'Cannot update showtime with reservations',
        message: 'Cannot update a showtime that has existing reservations'
      });
    }

    // If theater or time is being changed, check for conflicts
    if (updateData.theater || updateData.startTime || updateData.endTime) {
      const theater = updateData.theater || showtime.theater;
      const startTime = updateData.startTime || showtime.startTime;
      const endTime = updateData.endTime || showtime.endTime;

      const conflictingShowtime = await Showtime.findOne({
        _id: { $ne: id },
        theater: theater,
        isActive: true,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ]
      });

      if (conflictingShowtime) {
        return res.status(400).json({
          error: 'Scheduling conflict',
          message: 'Theater is already booked for this time slot'
        });
      }
    }

    // Update showtime
    Object.assign(showtime, updateData);
    await showtime.save();

    await showtime.populate('movie', 'title genre duration rating poster');
    await showtime.populate('theater', 'name location capacity');

    res.json({
      message: 'Showtime updated successfully',
      showtime
    });
  } catch (error) {
    console.error('Update showtime error:', error);
    res.status(500).json({
      error: 'Failed to update showtime',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete showtime (Admin only)
const deleteShowtime = async (req, res) => {
  try {
    const { id } = req.params;

    const showtime = await Showtime.findById(id);
    if (!showtime) {
      return res.status(404).json({
        error: 'Showtime not found',
        message: 'The requested showtime does not exist'
      });
    }

    // Check if showtime has reservations
    const Reservation = require('../models/Reservation');
    const reservationCount = await Reservation.countDocuments({ 
      showtime: id,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (reservationCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete showtime',
        message: 'Showtime has active reservations. Please cancel all reservations first.'
      });
    }

    // Soft delete - mark as inactive
    showtime.isActive = false;
    await showtime.save();

    res.json({
      message: 'Showtime deleted successfully'
    });
  } catch (error) {
    console.error('Delete showtime error:', error);
    res.status(500).json({
      error: 'Failed to delete showtime',
      message: 'Internal server error'
    });
  }
};

// Get showtimes by movie
const getShowtimesByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }

    const query = {
      movie: movieId,
      isActive: true,
      startTime: { $gt: new Date() }
    };

    const showtimes = await Showtime.find(query)
      .populate('theater', 'name location capacity')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Showtime.countDocuments(query);

    res.json({
      message: 'Showtimes retrieved successfully',
      movie: {
        id: movie._id,
        title: movie.title,
        poster: movie.poster,
        duration: movie.duration,
        genre: movie.genre,
        rating: movie.rating
      },
      showtimes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalShowtimes: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get showtimes by movie error:', error);
    res.status(500).json({
      error: 'Failed to retrieve showtimes',
      message: 'Internal server error'
    });
  }
};

// Get available seats for a showtime
const getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const showtime = await Showtime.findById(id)
      .populate('theater', 'name capacity');

    if (!showtime) {
      return res.status(404).json({
        error: 'Showtime not found',
        message: 'The requested showtime does not exist'
      });
    }

    if (!showtime.isActive) {
      return res.status(400).json({
        error: 'Showtime inactive',
        message: 'This showtime is no longer available'
      });
    }

    if (showtime.startTime < new Date()) {
      return res.status(400).json({
        error: 'Showtime has started',
        message: 'Cannot view seats for a showtime that has already started'
      });
    }

    res.json({
      message: 'Available seats retrieved successfully',
      showtime: {
        id: showtime._id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        theater: showtime.theater
      },
      seats: {
        available: showtime.availableSeats.filter(seat => seat.isAvailable),
        reserved: showtime.reservedSeats,
        totalCapacity: showtime.totalCapacity,
        availableCount: showtime.availableSeatsCount,
        reservedCount: showtime.reservedSeatsCount
      }
    });
  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve available seats',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getShowtimesByMovie,
  getAvailableSeats
};
