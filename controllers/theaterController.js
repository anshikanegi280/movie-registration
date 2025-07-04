const Theater = require('../models/Theater');

// Get all theaters
const getAllTheaters = async (req, res) => {
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

    // Filter by city
    if (req.query.city) {
      query['location.city'] = new RegExp(req.query.city, 'i');
    }

    // Filter by state
    if (req.query.state) {
      query['location.state'] = new RegExp(req.query.state, 'i');
    }

    // Filter by amenities
    if (req.query.amenities) {
      const amenities = req.query.amenities.split(',');
      query.amenities = { $in: amenities };
    }

    // Text search by name
    if (req.query.search) {
      query.name = new RegExp(req.query.search, 'i');
    }

    const theaters = await Theater.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Theater.countDocuments(query);

    res.json({
      message: 'Theaters retrieved successfully',
      theaters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTheaters: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get all theaters error:', error);
    res.status(500).json({
      error: 'Failed to retrieve theaters',
      message: 'Internal server error'
    });
  }
};

// Get theater by ID
const getTheaterById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({
        error: 'Theater not found',
        message: 'The requested theater does not exist'
      });
    }

    // Only return active theaters to regular users
    if (!theater.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        error: 'Theater not found',
        message: 'The requested theater does not exist'
      });
    }

    res.json({
      message: 'Theater retrieved successfully',
      theater
    });
  } catch (error) {
    console.error('Get theater by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve theater',
      message: 'Internal server error'
    });
  }
};

// Create new theater (Admin only)
const createTheater = async (req, res) => {
  try {
    const theaterData = req.body;
    
    // Check if theater with same name and location already exists
    const existingTheater = await Theater.findOne({
      name: theaterData.name,
      'location.city': theaterData.location.city,
      'location.state': theaterData.location.state
    });
    
    if (existingTheater) {
      return res.status(400).json({
        error: 'Theater already exists',
        message: 'A theater with this name already exists in this location'
      });
    }

    const theater = new Theater(theaterData);
    await theater.save();

    res.status(201).json({
      message: 'Theater created successfully',
      theater
    });
  } catch (error) {
    console.error('Create theater error:', error);
    res.status(500).json({
      error: 'Failed to create theater',
      message: error.message || 'Internal server error'
    });
  }
};

// Update theater (Admin only)
const updateTheater = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({
        error: 'Theater not found',
        message: 'The requested theater does not exist'
      });
    }

    // Check if name/location is being changed and if new combination already exists
    if (updateData.name || updateData.location) {
      const name = updateData.name || theater.name;
      const location = updateData.location || theater.location;
      
      const existingTheater = await Theater.findOne({
        _id: { $ne: id },
        name: name,
        'location.city': location.city,
        'location.state': location.state
      });
      
      if (existingTheater) {
        return res.status(400).json({
          error: 'Theater already exists',
          message: 'A theater with this name already exists in this location'
        });
      }
    }

    // Update theater
    Object.assign(theater, updateData);
    await theater.save();

    res.json({
      message: 'Theater updated successfully',
      theater
    });
  } catch (error) {
    console.error('Update theater error:', error);
    res.status(500).json({
      error: 'Failed to update theater',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete theater (Admin only)
const deleteTheater = async (req, res) => {
  try {
    const { id } = req.params;

    const theater = await Theater.findById(id);
    if (!theater) {
      return res.status(404).json({
        error: 'Theater not found',
        message: 'The requested theater does not exist'
      });
    }

    // Check if theater has active showtimes
    const Showtime = require('../models/Showtime');
    const activeShowtimes = await Showtime.countDocuments({
      theater: id,
      isActive: true,
      startTime: { $gt: new Date() }
    });

    if (activeShowtimes > 0) {
      return res.status(400).json({
        error: 'Cannot delete theater',
        message: 'Theater has active future showtimes. Please deactivate or remove all showtimes first.'
      });
    }

    // Soft delete - mark as inactive
    theater.isActive = false;
    await theater.save();

    res.json({
      message: 'Theater deleted successfully'
    });
  } catch (error) {
    console.error('Delete theater error:', error);
    res.status(500).json({
      error: 'Failed to delete theater',
      message: 'Internal server error'
    });
  }
};

// Get theaters by city
const getTheatersByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const theaters = await Theater.find({
      'location.city': new RegExp(city, 'i'),
      isActive: true
    })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Theater.countDocuments({
      'location.city': new RegExp(city, 'i'),
      isActive: true
    });

    res.json({
      message: `Theaters in ${city} retrieved successfully`,
      theaters,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalTheaters: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get theaters by city error:', error);
    res.status(500).json({
      error: 'Failed to retrieve theaters by city',
      message: 'Internal server error'
    });
  }
};

// Get theater statistics (Admin only)
const getTheaterStats = async (req, res) => {
  try {
    const stats = await Theater.aggregate([
      {
        $group: {
          _id: null,
          totalTheaters: { $sum: 1 },
          activeTheaters: { $sum: { $cond: ['$isActive', 1, 0] } },
          totalCapacity: { $sum: '$capacity' },
          avgCapacity: { $avg: '$capacity' },
          citiesServed: { $addToSet: '$location.city' }
        }
      },
      {
        $project: {
          _id: 0,
          totalTheaters: 1,
          activeTheaters: 1,
          totalCapacity: 1,
          avgCapacity: { $round: ['$avgCapacity', 2] },
          citiesCount: { $size: '$citiesServed' }
        }
      }
    ]);

    // Get amenities distribution
    const amenitiesStats = await Theater.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $unwind: '$amenities'
      },
      {
        $group: {
          _id: '$amenities',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalTheaters: 0,
      activeTheaters: 0,
      totalCapacity: 0,
      avgCapacity: 0,
      citiesCount: 0
    };

    result.amenitiesDistribution = amenitiesStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      message: 'Theater statistics retrieved successfully',
      stats: result
    });
  } catch (error) {
    console.error('Get theater stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve theater statistics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllTheaters,
  getTheaterById,
  createTheater,
  updateTheater,
  deleteTheater,
  getTheatersByCity,
  getTheaterStats
};
