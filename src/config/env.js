/**
 * Environment Configuration Module
 * Loads and validates environment variables with sensible defaults
 */

// Load environment variables from .env file if present
require('dotenv').config();

/**
 * Validates that required environment variables are present
 * @param {string} varName - Name of the environment variable
 * @param {string} value - Value of the environment variable
 * @throws {Error} If required variable is missing or empty
 */
function validateRequired(varName, value) {
  if (!value || value.trim() === '') {
    throw new Error(`Required environment variable ${varName} is missing or empty`);
  }
}

/**
 * Converts string to number with validation
 * @param {string} value - String value to convert
 * @param {number} defaultValue - Default value if conversion fails
 * @returns {number} Converted number or default
 */
function toNumber(value, defaultValue) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

const MONGO_URI = process.env.MONGO_URI;
const BASE_URL = process.env.BASE_URL;

validateRequired('MONGO_URI', MONGO_URI);
validateRequired('BASE_URL', BASE_URL);

const PORT = toNumber(process.env.PORT, 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';

const RATE_LIMIT_MAX = toNumber(process.env.RATE_LIMIT_MAX, 100);
const RATE_LIMIT_TIME_WINDOW = toNumber(process.env.RATE_LIMIT_TIME_WINDOW, 900000); // 15 min in ms

try {
  new URL(BASE_URL);
} catch (error) {
  throw new Error(`BASE_URL must be a valid URL format. Received: ${BASE_URL}`);
}

if (PORT < 1 || PORT > 65535) {
  throw new Error(`PORT must be between 1 and 65535. Received: ${PORT}`);
}

const validEnvironments = ['development', 'production', 'test'];
if (!validEnvironments.includes(NODE_ENV)) {
  console.warn(`Warning: NODE_ENV '${NODE_ENV}' is not a standard environment. Expected: ${validEnvironments.join(', ')}`);
}

/**
 * Environment configuration object
 * @type {Object}
 */
const config = {
  port: PORT,
  nodeEnv: NODE_ENV,
  mongoUri: MONGO_URI,
  baseUrl: BASE_URL,
  rateLimitMax: RATE_LIMIT_MAX,
  rateLimitTimeWindow: RATE_LIMIT_TIME_WINDOW,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
  isTest: NODE_ENV === 'test'
};

if (config.isDevelopment) {
  console.log('Environment Configuration:', {
    port: config.port,
    nodeEnv: config.nodeEnv,
    baseUrl: config.baseUrl,
    mongoUri: config.mongoUri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
    rateLimitMax: config.rateLimitMax,
    rateLimitTimeWindow: config.rateLimitTimeWindow
  });
}

module.exports = config;