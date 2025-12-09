/**
 * Rate Limiter Plugin
 * Implements rate limiting using @fastify/rate-limit to protect against abuse
 */

const rateLimit = require('@fastify/rate-limit');
const config = require('../config/env');

/**
 * Rate limiter plugin for Fastify
 * Configures rate limiting with environment-based settings
 * 
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function rateLimiterPlugin(fastify, options) {
  await fastify.register(rateLimit, {
    global: false,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow,
    
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    
    errorResponseBuilder: function (request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${context.max} requests per ${Math.floor(context.timeWindow / 60000)} minutes.`,
        retryAfter: Math.round(context.ttl / 1000) // Time until reset in seconds
      };
    },
    
    skip: function (request, key) {
      if (config.isTest) {
        return true;
      }
      return false;
    },
    
    keyGenerator: function (request) {
      return request.ip;
    }
  });

  const shortenRateLimit = {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTimeWindow
  };

  fastify.decorate('rateLimitConfig', {
    shorten: shortenRateLimit
  });

  if (config.isDevelopment) {
    fastify.log.info('Rate limiter configured:', {
      maxRequests: config.rateLimitMax,
      timeWindowMinutes: Math.floor(config.rateLimitTimeWindow / 60000),
      timeWindowMs: config.rateLimitTimeWindow
    });
  }
}

module.exports = rateLimiterPlugin;