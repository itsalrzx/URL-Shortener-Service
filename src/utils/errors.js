/**
 * Custom error classes for the URL Shortener Service
 * Each error class includes statusCode and message properties for consistent error handling
 */

/**
 * Error thrown when a requested resource is not found
 * Maps to HTTP 404 status code
 */
class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    
    // only available on V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

/**
 * Error thrown when input validation fails
 * Maps to HTTP 400 status code
 */
class ValidationError extends Error {
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Error thrown when database operations fail
 * Maps to HTTP 500 status code
 */
class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

module.exports = {
  NotFoundError,
  ValidationError,
  DatabaseError
};