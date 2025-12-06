/**
 * Logger Utility Module
 * Wraps Fastify's pino logger with environment-based configuration
 */

const pino = require('pino');
const config = require('../config/env');

/**
 * Get log level based on NODE_ENV
 * @returns {string} Log level for pino
 */
function getLogLevel() {
  switch (config.nodeEnv) {
    case 'production':
      return 'warn';
    case 'test':
      return 'silent';
    case 'development':
    default:
      return 'info';
  }
}

/**
 * Get pino configuration based on environment
 * @returns {Object} Pino configuration object
 */
function getPinoConfig() {
  const baseConfig = {
    level: getLogLevel(),
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // In production, use structured JSON logging
  if (config.isProduction) {
    return {
      ...baseConfig,
      formatters: {
        level: (label) => {
          return { level: label };
        }
      }
    };
  }
  return baseConfig;
}

/**
 * Create and configure logger instance
 */
const logger = pino(getPinoConfig());

/**
 * Create child logger with additional context
 * @param {Object} context - Additional context to include in logs
 * @returns {Object} Child logger instance
 */
function createChildLogger(context = {}) {
  return logger.child(context);
}

/**
 * Log request information
 * @param {Object} request - Fastify request object
 * @param {string} message - Log message
 */
function logRequest(request, message = 'Request processed') {
  const requestLogger = createChildLogger({
    requestId: request.id,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip
  });
  
  requestLogger.info(message);
}

/**
 * Log error with context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  const errorLogger = createChildLogger(context);
  errorLogger.error({
    err: error,
    message: error.message,
    stack: config.isDevelopment ? error.stack : undefined
  }, 'Error occurred');
}

/**
 * Log application startup information
 * @param {number} port - Server port
 * @param {string} environment - Environment name
 */
function logStartup(port, environment) {
  logger.info({
    port,
    environment,
    nodeVersion: process.version,
    pid: process.pid
  }, 'URL Shortener Service started successfully');
}

/**
 * Log application shutdown
 */
function logShutdown() {
  logger.info('URL Shortener Service shutting down gracefully');
}

module.exports = {
  logger,
  createChildLogger,
  logRequest,
  logError,
  logStartup,
  logShutdown,
  getLogLevel
};