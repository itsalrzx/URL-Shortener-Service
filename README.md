# URL Shortener Service

A high-performance URL shortener service built with Fastify and MongoDB. This service provides a RESTful API for creating shortened URLs, redirecting users to original URLs, and tracking analytics for each shortened link.

## Features

- **URL Shortening**: Convert long URLs into short, shareable links
- **Automatic Redirection**: Seamlessly redirect users from short URLs to original destinations
- **Click Analytics**: Track and retrieve click statistics for shortened URLs
- **Rate Limiting**: Built-in protection against abuse and excessive requests
- **Input Validation**: Comprehensive request validation using JSON Schema
- **API Documentation**: Auto-generated Swagger/OpenAPI documentation
- **Error Handling**: Centralized error handling with detailed logging
- **Environment Configuration**: Flexible configuration through environment variables
- **Production Ready**: Clean architecture with proper separation of concerns

## Architecture Overview

The service follows clean architecture principles with clear separation of concerns:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Requests
       ▼
┌─────────────────────────────────────┐
│         Fastify Server              │
│  ┌───────────────────────────────┐  │
│  │  Plugins Layer                │  │
│  │  - Rate Limiter               │  │
│  │  - Swagger Documentation      │  │
│  │  - Error Handler              │  │
│  │  - MongoDB Connection         │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Routes → Controllers         │  │
│  │  → Services → Models          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   MongoDB   │
└─────────────┘
```

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **MongoDB**: Version 4.4 or higher (local installation or MongoDB Atlas)
- **npm**: Comes with Node.js

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd url-shortener
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration (see [Environment Configuration](#environment-configuration) section).

4. **Start MongoDB** (if running locally):
   ```bash
   # Using MongoDB Community Edition
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/url-shortener` |
| `BASE_URL` | Base URL for generating short URLs | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Server port | `3000` | `8080` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `RATE_LIMIT_MAX` | Max requests per time window | `100` | `200` |
| `RATE_LIMIT_TIME_WINDOW` | Rate limit time window (ms) | `900000` | `600000` |

### Example .env file:
```env
# Server Configuration
PORT=3000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/url-shortener

# Application Configuration
BASE_URL=http://localhost:3000
NODE_ENV=development

# Rate Limiting Configuration (optional)
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=900000
```

## API Endpoints

### 1. Create Short URL

**POST** `/shorten`

Create a shortened URL from a long URL.

**Request Body**:
```json
{
  "originalUrl": "https://example.com/very/long/url/path"
}
```

**Response** (201 Created):
```json
{
  "shortId": "abc12345",
  "shortUrl": "http://localhost:3000/abc12345",
  "originalUrl": "https://example.com/very/long/url/path"
}
```

### 2. Redirect to Original URL

**GET** `/:shortId`

Redirect to the original URL and increment click count.

**Response**: HTTP 302 redirect to original URL

### 3. Get Analytics

**GET** `/analytics/:shortId`

Retrieve analytics data for a shortened URL.

**Response** (200 OK):
```json
{
  "shortId": "abc12345",
  "originalUrl": "https://example.com/very/long/url/path",
  "clickCount": 42,
  "createdAt": "2025-12-09T10:30:00.000Z"
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Short URL not found"
}
```

Common status codes:
- `400`: Bad Request (invalid input)
- `404`: Not Found (short URL doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Usage Examples

### Using curl

1. **Create a short URL**:
   ```bash
   curl -X POST http://localhost:3000/shorten \
     -H "Content-Type: application/json" \
     -d '{"originalUrl": "https://example.com/very/long/url"}'
   ```

2. **Access a short URL** (in browser or curl):
   ```bash
   curl -L http://localhost:3000/abc12345
   ```

3. **Get analytics**:
   ```bash
   curl http://localhost:3000/analytics/abc12345
   ```

### Using JavaScript (fetch)

```javascript
// Create short URL
const response = await fetch('http://localhost:3000/shorten', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ originalUrl: 'https://example.com/long-url' })
});
const data = await response.json();
console.log(data.shortUrl); // http://localhost:3000/abc12345

// Get analytics
const analytics = await fetch(`http://localhost:3000/analytics/${data.shortId}`);
const stats = await analytics.json();
console.log(`Clicks: ${stats.clickCount}`);
```

## Running the Application

### Development Mode

Start the server with automatic restart on file changes:

```bash
npm run dev
```

The server will start on the configured port (default: 3000) and automatically restart when you make changes to the code.

### Production Mode

Start the server in production mode:

```bash
npm start
```

For production deployment, consider using a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name url-shortener

# View logs
pm2 logs url-shortener

# Stop the application
pm2 stop url-shortener
```

### Using Docker

```bash
# Build the image
docker build -t url-shortener .

# Run the container
docker run -p 3000:3000 --env-file .env url-shortener
```

## API Documentation

Once the server is running, you can access the interactive API documentation at:

**http://localhost:3000/documentation**

The documentation is automatically generated from the route schemas and includes:
- Request/response schemas
- Parameter descriptions
- Example requests and responses
- Try-it-out functionality

## Project Structure

```
url-shortener/
├── src/
│   ├── config/
│   │   └── env.js              # Environment variable configuration
│   ├── models/
│   │   └── Url.js              # Mongoose URL model
│   ├── services/
│   │   └── urlService.js       # Business logic for URL operations
│   ├── controllers/
│   │   └── urlController.js    # HTTP request handlers
│   ├── routes/
│   │   └── urlRoutes.js        # Route definitions with schemas
│   ├── plugins/
│   │   ├── mongodb.js          # MongoDB connection plugin
│   │   ├── swagger.js          # Swagger documentation plugin
│   │   ├── rateLimiter.js      # Rate limiting plugin
│   │   └── errorHandler.js     # Centralized error handling
│   ├── utils/
│   │   ├── logger.js           # Logging utility
│   │   └── errors.js           # Custom error classes
│   ├── app.js                  # Fastify app configuration
│   └── server.js               # Server entry point
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

### Key Components

- **config/**: Environment configuration and validation
- **models/**: MongoDB schemas and data models
- **services/**: Business logic layer (framework-independent)
- **controllers/**: HTTP request/response handling
- **routes/**: API endpoint definitions with validation schemas
- **plugins/**: Fastify plugins for cross-cutting concerns
- **utils/**: Utility functions and custom error classes

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Ensure code follows the existing style
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your branch: `git push origin feature/your-feature-name`
8. Create a Pull Request

### Code Style

- Use ES6+ features
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused
- Use meaningful variable names

### Testing

Before submitting a PR:
1. Ensure all existing functionality works
2. Test your new features manually
3. Verify API documentation is updated if needed

### Commit Messages

Use clear, descriptive commit messages:
- `feat: add user authentication`
- `fix: handle duplicate short IDs correctly`
- `docs: update API documentation`
- `refactor: improve error handling`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [API Documentation](http://localhost:3000/documentation) when the server is running
2. Review this README for configuration and usage examples
3. Check the MongoDB connection and ensure the database is running
4. Verify environment variables are set correctly

## Changelog

### Version 1.0.0
- Initial release
- URL shortening functionality
- Click analytics
- Rate limiting
- Swagger documentation
- MongoDB integration
- Clean architecture implementation

---

**Author**: Alireza Baghiban (itsalrzx)  
**License**: MIT  
**Node.js**: >=18.0.0 required