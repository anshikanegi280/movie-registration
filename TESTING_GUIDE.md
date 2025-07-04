# Movie Reservation System API Testing Guide

## Prerequisites

1. **Install Postman**: Download and install Postman from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)

2. **Start the Server**: Make sure your server is running on `http://localhost:3000`
   ```bash
   npm start
   # or
   npm run dev
   ```

3. **Database**: Ensure MongoDB is connected (Atlas or local instance)

## Import Postman Collection

1. **Import Collection**:
   - Open Postman
   - Click "Import" button
   - Select `Movie-Reservation-System-API.postman_collection.json`
   - Click "Import"

2. **Import Environment**:
   - Click "Import" button
   - Select `Movie-Reservation-System-Environment.postman_environment.json`
   - Click "Import"
   - Select the environment from the dropdown (top-right corner)

## Testing Workflow

### 1. Health Check
- **GET /health** - Verify the server is running
- **GET /api** - Get API information and available endpoints

### 2. Authentication Flow

#### Register Users
1. **Register User** - Creates a regular user and stores auth token
2. **Register Admin** - Creates an admin user and stores admin token

#### Login
1. **Login User** - Authenticates regular user
2. **Login Admin** - Authenticates admin user

#### Profile Management
1. **Get User Profile** - View user profile
2. **Update User Profile** - Update user information
3. **Change Password** - Change user password

### 3. Movies Management

#### Public Access
1. **Get All Movies** - List all movies with pagination
2. **Get Featured Movies** - Get new releases, high-rated, and popular movies
3. **Get Movies by Genre** - Filter movies by genre
4. **Search Movies** - Search with filters and sorting

#### Admin Operations
1. **Create Movie** - Add new movie (Admin only)
2. **Update Movie** - Modify movie details (Admin only)
3. **Get Movie Stats** - View movie statistics (Admin only)
4. **Delete Movie** - Remove movie (Admin only)

### 4. Theaters Management

#### Public Access
1. **Get All Theaters** - List all theaters
2. **Get Theater by ID** - View specific theater
3. **Get Theaters by City** - Filter theaters by city

#### Admin Operations
1. **Create Theater** - Add new theater (Admin only)
2. **Update Theater** - Modify theater details (Admin only)
3. **Get Theater Stats** - View theater statistics (Admin only)
4. **Delete Theater** - Remove theater (Admin only)

### 5. Showtimes Management

#### Public Access
1. **Get All Showtimes** - List all showtimes
2. **Get Showtimes by Movie** - Find showtimes for specific movie
3. **Get Available Seats** - View seat availability for showtime

#### Admin Operations
1. **Create Showtime** - Schedule new showtime (Admin only)
2. **Update Showtime** - Modify showtime details (Admin only)
3. **Delete Showtime** - Remove showtime (Admin only)

### 6. Reservations Management

#### User Operations
1. **Create Reservation** - Book seats for a showtime
2. **Get User Reservations** - View user's reservations
3. **Get Reservation by ID** - View specific reservation
4. **Update Reservation** - Modify reservation details
5. **Check-in Reservation** - Check-in for the showtime
6. **Cancel Reservation** - Cancel reservation

#### Admin Operations
1. **Get All Reservations** - View all reservations (Admin only)

### 7. Reports & Analytics (Admin Only)

1. **Revenue Report** - Financial performance data
2. **Occupancy Report** - Theater and showtime occupancy
3. **Popular Movies Report** - Most booked movies
4. **User Analytics Report** - User behavior and preferences
5. **Theater Performance Report** - Theater-specific metrics
6. **Dashboard Summary** - Overall system metrics

### 8. Admin Operations

1. **Get All Users** - View all registered users
2. **Update User Role** - Change user role (user/admin)
3. **Delete Movie** - Remove movie from system
4. **Delete Theater** - Remove theater from system
5. **Delete Showtime** - Remove showtime from system

## Test Data

The collection includes comprehensive test data:

### Sample Movie Data
- **Title**: "Avengers: Endgame"
- **Genre**: Action, Adventure, Drama
- **Duration**: 181 minutes
- **Rating**: PG-13
- **IMDB Rating**: 8.4

### Sample Theater Data
- **Name**: "Grand Cinema Downtown"
- **Location**: New York, NY
- **Capacity**: 150 seats
- **Amenities**: IMAX, Dolby Atmos, Reclining Seats

### Sample Showtime Data
- **Date**: July 5, 2025
- **Time**: 7:00 PM
- **Format**: IMAX
- **Base Price**: $15.00

### Sample Reservation Data
- **Seats**: A5, A6 (2 seats)
- **Payment**: Credit card
- **Special Requests**: Aisle seats preferred

## Testing Tips

1. **Sequential Testing**: Run requests in order as they build upon each other
2. **Variable Storage**: The collection automatically stores IDs in variables
3. **Authentication**: Admin token is required for admin operations
4. **Error Handling**: Test both success and error scenarios
5. **Data Validation**: Verify response structure and data integrity

## Common Test Scenarios

### Successful Flow
1. Register → Login → Create movie → Create theater → Create showtime → Make reservation

### Error Scenarios
1. Invalid authentication tokens
2. Duplicate movie/theater names
3. Invalid showtime scheduling
4. Seat already reserved
5. Authorization failures (user trying admin operations)

## Environment Variables

The environment file contains:
- `baseUrl`: API base URL
- `authToken`: Regular user authentication token
- `adminToken`: Admin user authentication token
- `userId`, `movieId`, `theaterId`, `showtimeId`, `reservationId`: Auto-populated IDs

## Response Formats

All responses follow a consistent format:
```json
{
  "message": "Success message",
  "data": {},
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 100,
    "limit": 10
  }
}
```

## Error Responses
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": []
}
```

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check request headers and body format
5. Verify authentication tokens are valid

Happy Testing! 🎬
