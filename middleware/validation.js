const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 13) {
        throw new Error('You must be at least 13 years old to register');
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('phone')
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth'),
  
  handleValidationErrors
];

// Movie validation rules
const validateMovie = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Movie title must be between 1 and 200 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  
  body('director')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Director name must be between 2 and 100 characters'),
  
  body('genre')
    .isArray({ min: 1 })
    .withMessage('At least one genre must be selected')
    .custom((genres) => {
      const validGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy'];
      const invalid = genres.filter(g => !validGenres.includes(g));
      if (invalid.length > 0) {
        throw new Error(`Invalid genres: ${invalid.join(', ')}`);
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  
  body('rating')
    .isIn(['G', 'PG', 'PG-13', 'R', 'NC-17'])
    .withMessage('Rating must be one of: G, PG, PG-13, R, NC-17'),
  
  body('releaseDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid release date'),
  
  body('poster')
    .isURL()
    .withMessage('Please provide a valid poster URL'),
  
  body('trailer')
    .optional()
    .isURL()
    .withMessage('Please provide a valid trailer URL'),
  
  body('imdbRating')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('IMDB rating must be between 0 and 10'),
  
  handleValidationErrors
];

// Theater validation rules
const validateTheater = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Theater name must be between 2 and 100 characters'),
  
  body('location.address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  
  body('location.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  
  body('location.state')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  
  body('location.zipCode')
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Please provide a valid zip code'),
  
  body('capacity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Capacity must be between 1 and 1000'),
  
  handleValidationErrors
];

// Showtime validation rules
const validateShowtime = [
  body('movie')
    .isMongoId()
    .withMessage('Please provide a valid movie ID'),
  
  body('theater')
    .isMongoId()
    .withMessage('Please provide a valid theater ID'),
  
  body('startTime')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid start time')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start time cannot be in the past');
      }
      return true;
    }),
  
  body('endTime')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid end time')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  
  handleValidationErrors
];

// Reservation validation rules
const validateReservation = [
  body('showtime')
    .isMongoId()
    .withMessage('Please provide a valid showtime ID'),
  
  body('seats')
    .isArray({ min: 1, max: 10 })
    .withMessage('You must select between 1 and 10 seats'),
  
  body('seats.*.row')
    .matches(/^[A-Z]$/)
    .withMessage('Seat row must be a single uppercase letter'),
  
  body('seats.*.number')
    .isInt({ min: 1, max: 50 })
    .withMessage('Seat number must be between 1 and 50'),
  
  body('paymentDetails.method')
    .isIn(['credit_card', 'debit_card', 'paypal', 'cash', 'gift_card'])
    .withMessage('Invalid payment method'),
  
  body('paymentDetails.transactionId')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Transaction ID is required for non-cash payments'),
  
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid contact email'),
  
  body('contactInfo.phone')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please provide a valid contact phone number'),
  
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid start date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateMovie,
  validateTheater,
  validateShowtime,
  validateReservation,
  validateObjectId,
  validatePagination,
  validateDateRange
};
