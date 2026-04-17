# Mockmate Backend

This is the backend for the Mockmate interview platform, built with Node.js, Express, and MongoDB.

## Features

- User registration and login
- JWT authentication
- Password hashing with bcrypt

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure MongoDB is running on your system (default: mongodb://localhost:27017)

3. Create a `.env` file in the backend directory with:
   ```
   JWT_SECRET=your-super-secret-jwt-key
   MONGODB_URI=mongodb://localhost:27017/mockmate
   ```

4. Start the server:
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "username": "string", "email": "string", "password": "string" }`

- `POST /api/auth/login` - Login user
  - Body: `{ "email": "string", "password": "string" }`

- `GET /api/auth/profile` - Get user profile (requires authentication)
  - Headers: `Authorization: Bearer <token>`

## Environment Variables

- `JWT_SECRET`: Secret key for JWT signing
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)