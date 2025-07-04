const Movie = require('../models/Movie');

// Get all movies
const getAllMovies = async (req, res) => {
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

    // Filter by genre
    if (req.query.genre) {
      query.genre = { $in: req.query.genre.split(',') };
    }

    // Filter by rating
    if (req.query.rating) {
      query.rating = { $in: req.query.rating.split(',') };
    }

    // Filter by release date range
    if (req.query.startDate || req.query.endDate) {
      query.releaseDate = {};
      if (req.query.startDate) {
        query.releaseDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.releaseDate.$lte = new Date(req.query.endDate);
      }
    }

    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Sort options
    let sortBy = { createdAt: -1 };
    if (req.query.sortBy) {
      switch (req.query.sortBy) {
        case 'title':
          sortBy = { title: 1 };
          break;
        case 'releaseDate':
          sortBy = { releaseDate: -1 };
          break;
        case 'rating':
          sortBy = { imdbRating: -1 };
          break;
        case 'duration':
          sortBy = { duration: -1 };
          break;
        default:
          sortBy = { createdAt: -1 };
      }
    }

    const movies = await Movie.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(limit);

    const total = await Movie.countDocuments(query);

    res.json({
      message: 'Movies retrieved successfully',
      movies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMovies: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get all movies error:', error);
    res.status(500).json({
      error: 'Failed to retrieve movies',
      message: 'Internal server error'
    });
  }
};

// Get movie by ID
const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }

    // Only return active movies to regular users
    if (!movie.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }

    res.json({
      message: 'Movie retrieved successfully',
      movie
    });
  } catch (error) {
    console.error('Get movie by ID error:', error);
    res.status(500).json({
      error: 'Failed to retrieve movie',
      message: 'Internal server error'
    });
  }
};

// Create new movie (Admin only)
const createMovie = async (req, res) => {
  try {
    const movieData = req.body;
    
    // Check if movie with same title already exists
    const existingMovie = await Movie.findOne({ title: movieData.title });
    if (existingMovie) {
      return res.status(400).json({
        error: 'Movie already exists',
        message: 'A movie with this title already exists'
      });
    }

    const movie = new Movie(movieData);
    await movie.save();

    res.status(201).json({
      message: 'Movie created successfully',
      movie
    });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({
      error: 'Failed to create movie',
      message: error.message || 'Internal server error'
    });
  }
};

// Update movie (Admin only)
const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }

    // Check if title is being changed and if new title already exists
    if (updateData.title && updateData.title !== movie.title) {
      const existingMovie = await Movie.findOne({ title: updateData.title });
      if (existingMovie) {
        return res.status(400).json({
          error: 'Movie title already exists',
          message: 'A movie with this title already exists'
        });
      }
    }

    // Update movie
    Object.assign(movie, updateData);
    await movie.save();

    res.json({
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(500).json({
      error: 'Failed to update movie',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete movie (Admin only)
const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        error: 'Movie not found',
        message: 'The requested movie does not exist'
      });
    }

    // Check if movie has active showtimes
    const Showtime = require('../models/Showtime');
    const activeShowtimes = await Showtime.countDocuments({ 
      movie: id, 
      isActive: true,
      startTime: { $gt: new Date() }
    });

    if (activeShowtimes > 0) {
      return res.status(400).json({
        error: 'Cannot delete movie',
        message: 'Movie has active future showtimes. Please deactivate or remove all showtimes first.'
      });
    }

    // Soft delete - mark as inactive instead of removing
    movie.isActive = false;
    await movie.save();

    res.json({
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({
      error: 'Failed to delete movie',
      message: 'Internal server error'
    });
  }
};

// Get movie statistics (Admin only)
const getMovieStats = async (req, res) => {
  try {
    const stats = await Movie.aggregate([
      {
        $group: {
          _id: null,
          totalMovies: { $sum: 1 },
          activeMovies: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgDuration: { $avg: '$duration' },
          avgImdbRating: { $avg: '$imdbRating' },
          genreDistribution: { $push: '$genre' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMovies: 1,
          activeMovies: 1,
          avgDuration: { $round: ['$avgDuration', 2] },
          avgImdbRating: { $round: ['$avgImdbRating', 2] },
          genreDistribution: 1
        }
      }
    ]);

    // Process genre distribution
    const genreCount = {};
    if (stats.length > 0 && stats[0].genreDistribution) {
      stats[0].genreDistribution.forEach(genres => {
        genres.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });
    }

    const result = stats.length > 0 ? stats[0] : {
      totalMovies: 0,
      activeMovies: 0,
      avgDuration: 0,
      avgImdbRating: 0
    };

    result.genreDistribution = genreCount;

    res.json({
      message: 'Movie statistics retrieved successfully',
      stats: result
    });
  } catch (error) {
    console.error('Get movie stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve movie statistics',
      message: 'Internal server error'
    });
  }
};

// Get movies by genre
const getMoviesByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const validGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy'];
    if (!validGenres.includes(genre)) {
      return res.status(400).json({
        error: 'Invalid genre',
        message: 'Please provide a valid genre'
      });
    }

    const movies = await Movie.find({
      genre: genre,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Movie.countDocuments({
      genre: genre,
      isActive: true
    });

    res.json({
      message: `Movies in ${genre} genre retrieved successfully`,
      movies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMovies: total,
        limit
      }
    });
  } catch (error) {
    console.error('Get movies by genre error:', error);
    res.status(500).json({
      error: 'Failed to retrieve movies by genre',
      message: 'Internal server error'
    });
  }
};

// Get featured movies (new releases and high-rated)
const getFeaturedMovies = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get new releases
    const newReleases = await Movie.find({
      releaseDate: { $gte: thirtyDaysAgo },
      isActive: true
    })
      .sort({ releaseDate: -1 })
      .limit(5);

    // Get high-rated movies
    const highRated = await Movie.find({
      imdbRating: { $gte: 7.5 },
      isActive: true
    })
      .sort({ imdbRating: -1 })
      .limit(5);

    // Get popular movies (this could be based on reservation count in a real app)
    const popular = await Movie.find({
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      message: 'Featured movies retrieved successfully',
      featured: {
        newReleases,
        highRated,
        popular
      }
    });
  } catch (error) {
    console.error('Get featured movies error:', error);
    res.status(500).json({
      error: 'Failed to retrieve featured movies',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  getMovieStats,
  getMoviesByGenre,
  getFeaturedMovies
};
