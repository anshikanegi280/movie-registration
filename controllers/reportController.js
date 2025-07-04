const Reservation = require('../models/Reservation');
const Movie = require('../models/Movie');
const Theater = require('../models/Theater');
const User = require('../models/User');

// Get revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const revenueData = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyRevenue: { $sum: '$totalAmount' },
          reservationCount: { $sum: 1 },
          averageTicketPrice: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const totalRevenue = revenueData.reduce((sum, day) => sum + day.dailyRevenue, 0);
    const totalReservations = revenueData.reduce((sum, day) => sum + day.reservationCount, 0);
    const averageReservationValue = totalReservations > 0 ? totalRevenue / totalReservations : 0;

    res.json({
      message: 'Revenue report generated successfully',
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalReservations,
        averageReservationValue: Math.round(averageReservationValue * 100) / 100
      },
      dailyData: revenueData.map(day => ({
        date: `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`,
        revenue: Math.round(day.dailyRevenue * 100) / 100,
        reservations: day.reservationCount,
        averageTicketPrice: Math.round(day.averageTicketPrice * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      error: 'Failed to generate revenue report',
      message: 'Internal server error'
    });
  }
};

// Get popular movies report
const getPopularMoviesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const popularMovies = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeData'
        }
      },
      {
        $unwind: '$showtimeData'
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'showtimeData.movie',
          foreignField: '_id',
          as: 'movieData'
        }
      },
      {
        $unwind: '$movieData'
      },
      {
        $group: {
          _id: '$movieData._id',
          title: { $first: '$movieData.title' },
          poster: { $first: '$movieData.poster' },
          genre: { $first: '$movieData.genre' },
          rating: { $first: '$movieData.rating' },
          reservationCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalSeats: { $sum: { $size: '$seats' } },
          averageTicketPrice: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { reservationCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      message: 'Popular movies report generated successfully',
      period: {
        startDate: start,
        endDate: end
      },
      popularMovies: popularMovies.map(movie => ({
        id: movie._id,
        title: movie.title,
        poster: movie.poster,
        genre: movie.genre,
        rating: movie.rating,
        reservationCount: movie.reservationCount,
        totalRevenue: Math.round(movie.totalRevenue * 100) / 100,
        totalSeats: movie.totalSeats,
        averageTicketPrice: Math.round(movie.averageTicketPrice * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Get popular movies report error:', error);
    res.status(500).json({
      error: 'Failed to generate popular movies report',
      message: 'Internal server error'
    });
  }
};

// Get theater performance report
const getTheaterPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const theaterPerformance = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'showtimes',
          localField: 'showtime',
          foreignField: '_id',
          as: 'showtimeData'
        }
      },
      {
        $unwind: '$showtimeData'
      },
      {
        $lookup: {
          from: 'theaters',
          localField: 'showtimeData.theater',
          foreignField: '_id',
          as: 'theaterData'
        }
      },
      {
        $unwind: '$theaterData'
      },
      {
        $group: {
          _id: '$theaterData._id',
          name: { $first: '$theaterData.name' },
          location: { $first: '$theaterData.location' },
          capacity: { $first: '$theaterData.capacity' },
          reservationCount: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalSeats: { $sum: { $size: '$seats' } },
          averageTicketPrice: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.json({
      message: 'Theater performance report generated successfully',
      period: {
        startDate: start,
        endDate: end
      },
      theaterPerformance: theaterPerformance.map(theater => ({
        id: theater._id,
        name: theater.name,
        location: theater.location,
        capacity: theater.capacity,
        reservationCount: theater.reservationCount,
        totalRevenue: Math.round(theater.totalRevenue * 100) / 100,
        totalSeats: theater.totalSeats,
        averageTicketPrice: Math.round(theater.averageTicketPrice * 100) / 100,
        occupancyRate: Math.round((theater.totalSeats / theater.capacity) * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Get theater performance report error:', error);
    res.status(500).json({
      error: 'Failed to generate theater performance report',
      message: 'Internal server error'
    });
  }
};

// Get user demographics report
const getUserDemographicsReport = async (req, res) => {
  try {
    const ageGroups = await User.aggregate([
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000
              ]
            }
          }
        }
      },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 18] }, then: 'Under 18' },
                { case: { $lt: ['$age', 25] }, then: '18-24' },
                { case: { $lt: ['$age', 35] }, then: '25-34' },
                { case: { $lt: ['$age', 45] }, then: '35-44' },
                { case: { $lt: ['$age', 55] }, then: '45-54' },
                { case: { $lt: ['$age', 65] }, then: '55-64' }
              ],
              default: '65+'
            }
          }
        }
      },
      {
        $group: {
          _id: '$ageGroup',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const genrePreferences = await User.aggregate([
      {
        $unwind: '$preferences.favoriteGenres'
      },
      {
        $group: {
          _id: '$preferences.favoriteGenres',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    res.json({
      message: 'User demographics report generated successfully',
      summary: {
        totalUsers,
        activeUsers,
        adminUsers,
        inactiveUsers: totalUsers - activeUsers
      },
      ageGroups: ageGroups.map(group => ({
        ageGroup: group._id,
        count: group.count,
        percentage: Math.round((group.count / totalUsers) * 100)
      })),
      genrePreferences: genrePreferences.map(genre => ({
        genre: genre._id,
        count: genre.count,
        percentage: Math.round((genre.count / totalUsers) * 100)
      }))
    });
  } catch (error) {
    console.error('Get user demographics report error:', error);
    res.status(500).json({
      error: 'Failed to generate user demographics report',
      message: 'Internal server error'
    });
  }
};

// Get reservation status report
const getReservationStatusReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const statusReport = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalReservations = statusReport.reduce((sum, status) => sum + status.count, 0);
    const totalRevenue = statusReport.reduce((sum, status) => sum + status.totalAmount, 0);

    res.json({
      message: 'Reservation status report generated successfully',
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalReservations,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      },
      statusBreakdown: statusReport.map(status => ({
        status: status._id,
        count: status.count,
        percentage: Math.round((status.count / totalReservations) * 100),
        totalAmount: Math.round(status.totalAmount * 100) / 100
      }))
    });
  } catch (error) {
    console.error('Get reservation status report error:', error);
    res.status(500).json({
      error: 'Failed to generate reservation status report',
      message: 'Internal server error'
    });
  }
};

// Get dashboard analytics
const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    // Current month metrics
    const monthlyMetrics = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
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

    // This week metrics
    const weeklyMetrics = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfWeek },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalReservations: { $sum: 1 }
        }
      }
    ]);

    // Today's reservations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayReservations = await Reservation.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // Quick stats
    const totalUsers = await User.countDocuments();
    const totalMovies = await Movie.countDocuments({ isActive: true });
    const totalTheaters = await Theater.countDocuments({ isActive: true });

    const monthly = monthlyMetrics.length > 0 ? monthlyMetrics[0] : { totalRevenue: 0, totalReservations: 0, averageReservationValue: 0 };
    const weekly = weeklyMetrics.length > 0 ? weeklyMetrics[0] : { totalRevenue: 0, totalReservations: 0 };

    res.json({
      message: 'Dashboard analytics retrieved successfully',
      analytics: {
        monthly: {
          revenue: Math.round(monthly.totalRevenue * 100) / 100,
          reservations: monthly.totalReservations,
          averageReservationValue: Math.round(monthly.averageReservationValue * 100) / 100
        },
        weekly: {
          revenue: Math.round(weekly.totalRevenue * 100) / 100,
          reservations: weekly.totalReservations
        },
        today: {
          reservations: todayReservations
        },
        totals: {
          users: totalUsers,
          movies: totalMovies,
          theaters: totalTheaters
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard analytics',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getRevenueReport,
  getPopularMoviesReport,
  getTheaterPerformanceReport,
  getUserDemographicsReport,
  getReservationStatusReport,
  getDashboardAnalytics
};
