const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Movie description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  director: {
    type: String,
    required: [true, 'Director name is required'],
    trim: true,
    maxlength: [100, 'Director name cannot exceed 100 characters']
  },
  cast: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      trim: true
    }
  }],
  genre: [{
    type: String,
    required: true,
    enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy']
  }],
  duration: {
    type: Number,
    required: [true, 'Movie duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  rating: {
    type: String,
    required: [true, 'Movie rating is required'],
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17']
  },
  language: {
    type: String,
    required: [true, 'Movie language is required'],
    default: 'English'
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  poster: {
    type: String,
    required: [true, 'Poster URL is required'],
    match: [/^https?:\/\/.+/, 'Please enter a valid URL for poster']
  },
  trailer: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL for trailer']
  },
  imdbRating: {
    type: Number,
    min: [0, 'IMDB rating cannot be less than 0'],
    max: [10, 'IMDB rating cannot exceed 10']
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative']
  },
  boxOffice: {
    type: Number,
    min: [0, 'Box office cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted duration
movieSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual to check if movie is new (released within last 30 days)
movieSchema.virtual('isNew').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.releaseDate > thirtyDaysAgo;
});

// Indexes for better query performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isActive: 1 });
movieSchema.index({ 'cast.name': 1 });
movieSchema.index({ director: 1 });

// Pre-save middleware to ensure cast is not empty
movieSchema.pre('save', function(next) {
  if (this.cast && this.cast.length === 0) {
    this.cast = undefined;
  }
  next();
});

module.exports = mongoose.model('Movie', movieSchema);
