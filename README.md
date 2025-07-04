# Movie Reservation System - Backend API

A comprehensive movie reservation system backend built with Node.js, Express.js, and MongoDB. This system provides a complete solution for managing movie theaters, showtimes, user reservations, and generating detailed reports.

## 🎬 Features

### User Management
- User registration and authentication with JWT
- Role-based access control (User/Admin)
- Profile management and password change
- User demographics and preferences

### Movie Management
- CRUD operations for movies
- Movie search and filtering by genre, rating, release date
- Featured movies (new releases, high-rated, popular)
- Movie statistics and analytics

### Theater Management
- Theater creation and management
- Seat configuration and pricing tiers
- Location-based theater search
- Theater performance analytics

### Showtime Management
- Flexible showtime scheduling
- Seat availability management
- Pricing configuration by seat type
- Conflict detection for theater scheduling

### Reservation System
- Seat selection and booking
- Multiple payment methods support
- Reservation status tracking
- Cancellation and refund management
- QR code generation for tickets
- Check-in functionality

### Reporting & Analytics
- Revenue reports with date ranges
- Popular movies analysis
- Theater performance metrics
- User demographics insights
- Reservation status breakdown
- Dashboard analytics

## 🛠️ Technology Stack

- **Backend Framework**: Express.js
- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs
- **Development**: Nodemon for auto-restart

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd movie-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/movie-reservation-system

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d

   # Email Configuration (optional)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # Admin Configuration
   ADMIN_EMAIL=admin@moviereservation.com
   ADMIN_PASSWORD=admin123

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

6. **Verify installation**
   Visit `http://localhost:3000/health` to check if the server is running.

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/deactivate` - Deactivate account

### Movie Endpoints
- `GET /api/movies` - Get all movies
- `GET /api/movies/featured` - Get featured movies
- `GET /api/movies/:id` - Get movie by ID
- `GET /api/movies/genre/:genre` - Get movies by genre
- `POST /api/movies` - Create movie (Admin)
- `PUT /api/movies/:id` - Update movie (Admin)
- `DELETE /api/movies/:id` - Delete movie (Admin)

### Theater Endpoints
- `GET /api/theaters` - Get all theaters
- `GET /api/theaters/:id` - Get theater by ID
- `GET /api/theaters/city/:city` - Get theaters by city
- `POST /api/theaters` - Create theater (Admin)
- `PUT /api/theaters/:id` - Update theater (Admin)
- `DELETE /api/theaters/:id` - Delete theater (Admin)

### Showtime Endpoints
- `GET /api/showtimes` - Get all showtimes
- `GET /api/showtimes/:id` - Get showtime by ID
- `GET /api/showtimes/:id/seats` - Get available seats
- `GET /api/showtimes/movie/:movieId` - Get showtimes by movie
- `POST /api/showtimes` - Create showtime (Admin)
- `PUT /api/showtimes/:id` - Update showtime (Admin)
- `DELETE /api/showtimes/:id` - Delete showtime (Admin)

### Reservation Endpoints
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/my-reservations` - Get user's reservations
- `GET /api/reservations/:id` - Get reservation by ID
- `PUT /api/reservations/:id/cancel` - Cancel reservation
- `PUT /api/reservations/:id/checkin` - Check-in for reservation
- `GET /api/reservations` - Get all reservations (Admin)
- `PUT /api/reservations/:id/status` - Update reservation status (Admin)

### Report Endpoints (Admin only)
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/popular-movies` - Popular movies report
- `GET /api/reports/theater-performance` - Theater performance report
- `GET /api/reports/user-demographics` - User demographics report
- `GET /api/reports/reservation-status` - Reservation status report
- `GET /api/reports/dashboard` - Dashboard analytics

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **User**: Can browse movies, make reservations, manage their profile
- **Admin**: Full access to all endpoints, can manage movies, theaters, and view reports

## 📊 Database Schema

### User Model
- Personal information (name, email, phone, date of birth)
- Authentication details (password, role)
- Preferences (favorite genres, notifications)
- Account status and timestamps

### Movie Model
- Basic information (title, description, director, cast)
- Details (genre, duration, rating, language)
- Media (poster, trailer URLs)
- Ratings and box office information
- Release date and status

### Theater Model
- Theater information (name, location, capacity)
- Seat configuration with pricing tiers
- Amenities and facilities
- Geographic coordinates for location services

### Showtime Model
- Movie and theater references
- Scheduling (start/end times)
- Seat availability and pricing
- Special offers and formats
- Language and subtitle options

### Reservation Model
- User and showtime references
- Seat selection and pricing
- Payment details and status
- Contact information
- Special requests and gift options
- Cancellation and refund information

## 🔧 Development

### Available Scripts
- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with auto-restart
- `npm test` - Run tests (not implemented yet)
- `npm run seed` - Seed the database with sample data (not implemented yet)

### Project Structure
```
movie-system/
├── controllers/           # Route handlers
├── middleware/           # Authentication and validation
├── models/              # Database schemas
├── routes/              # API routes
├── utils/               # Utility functions
├── .env                 # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
├── README.md           # This file
└── server.js           # Main application file
```

## 🛡️ Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration
- Security headers with Helmet
- MongoDB injection protection

## 🎯 API Response Format

All API responses follow a consistent format:

```json
{
  "message": "Success message",
  "data": {}, // Response data
  "pagination": {}, // For paginated responses
  "error": "Error message", // For error responses
  "details": [] // Additional error details
}
```

## 📝 Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01"
  }'
```

### Create Movie Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "showtime": "movie_showtime_id",
    "seats": [
      {"row": "A", "number": 1},
      {"row": "A", "number": 2}
    ],
    "paymentDetails": {
      "method": "credit_card",
      "transactionId": "tx_123456"
    },
    "contactInfo": {
      "email": "john.doe@example.com",
      "phone": "+1234567890"
    }
  }'
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate email)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## 📈 Performance Considerations

- Database indexing for frequently queried fields
- Pagination for large datasets
- Caching strategies for frequently accessed data
- Connection pooling for database connections
- Request rate limiting to prevent abuse

## 🔮 Future Enhancements

- Email notifications for reservations
- SMS reminders for upcoming shows
- Payment gateway integration
- Advanced seat selection UI
- Mobile app API optimizations
- Real-time seat availability updates
- Loyalty program integration
- Multi-language support
- Advanced analytics and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please contact:
- Email: support@moviereservation.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

---

**Built with ❤️ for movie lovers and theater enthusiasts**
