/**
 * Error Handler Plugin
 * Provides centralized error handling for the Fastify application
 * Logs errors with context and returns consistent JSON error responses
 */

const { logError } = require('../utils/logger');
const { NotFoundError, ValidationError, DatabaseError } = require('../utils/errors');
const config = require('../config/env');

/**
 * Maps custom error classes to HTTP status codes
 * @param {Error} error - The error object
 * @returns {number} HTTP status code
 */
function getStatusCode(error) {
  // (custom errors)
  if (error.statusCode && typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  if (error instanceof NotFoundError) {
    return 404;
  }
  
  if (error instanceof ValidationError) {
    return 400;
  }
  
  if (error instanceof DatabaseError) {
    return 500;
  }

  if (error.validation) {
    return 400;
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return 429;
  }

  return 500;
}

/**
 * Gets appropriate error name for response
 * @param {number} statusCode - HTTP status code
 * @returns {string} Error name
 */
function getErrorName(statusCode) {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 404:
      return 'Not Found';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Error';
  }
}

/**
 * Sanitizes error message for production environment
 * @param {Error} error - The error object
 * @param {number} statusCode - HTTP status code
 * @returns {string} Sanitized error message
 */
function sanitizeErrorMessage(error, statusCode) {
  // In production, don't expose internal error details for 5xx errors
  if (config.isProduction && statusCode >= 500) {
    return 'Internal Server Error';
  }

  if (error.validation) {
    const validationIssues = error.validation.map(issue => 
      `${issue.instancePath || 'root'}: ${issue.message}`
    ).join(', ');
    return `Validation failed: ${validationIssues}`;
  }

  return error.message || getErrorName(statusCode);
}

/**
 * Creates error context for logging
 * @param {Object} request - Fastify request object
 * @param {Error} error - The error object
 * @returns {Object} Error context
 */
function createErrorContext(request, error) {
  const context = {
    timestamp: new Date().toISOString(),
    requestId: request.id,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    errorName: error.name,
    errorMessage: error.message
  };

  if (config.isDevelopment && error.stack) {
    context.stack = error.stack;
  }

  if (error.validation) {
    context.validation = error.validation;
  }

  return context;
}

/**
 * Error handler plugin for Fastify
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function errorHandlerPlugin(fastify, options) {
  // Register the error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    const statusCode = getStatusCode(error);
    const errorName = getErrorName(statusCode);
    const sanitizedMessage = sanitizeErrorMessage(error, statusCode);
    
    const errorContext = createErrorContext(request, error);
    
    logError(error, errorContext);
    
    const errorResponse = {
      statusCode,
      error: errorName,
      message: sanitizedMessage
    };

    if (request.id) {
      errorResponse.requestId = request.id;
    }

    if (error.validation && !(config.isProduction && statusCode >= 500)) {
      errorResponse.validation = error.validation;
    }

    reply.status(statusCode).send(errorResponse);
  });

  if (config.isDevelopment) {
    fastify.addHook('onResponse', async (request, reply) => {
      if (reply.statusCode < 400) {
        const context = {
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          responseTime: reply.getResponseTime()
        };
        
        fastify.log.info(context, 'Request completed successfully');
      }
    });
  }
}

const fp = require('fastify-plugin');

module.exports = fp(errorHandlerPlugin, {
  name: 'errorHandler',
  fastify: '4.x'
});