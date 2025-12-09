/**
 * URL Routes
 * Route definitions with JSON Schema validation for URL shortening API
 */

const urlController = require('../controllers/urlController');

const schemas = {
  // POST /shorten request schema
  createShortUrlRequest: {
    body: {
      type: 'object',
      required: ['originalUrl'],
      properties: {
        originalUrl: {
          type: 'string',
          format: 'uri',
          description: 'The original URL to be shortened'
        }
      },
      additionalProperties: false
    }
  },

  // POST /shorten response schema
  createShortUrlResponse: {
    201: {
      type: 'object',
      properties: {
        shortId: {
          type: 'string',
          description: 'The unique identifier for the shortened URL'
        },
        shortUrl: {
          type: 'string',
          format: 'uri',
          description: 'The complete shortened URL'
        },
        originalUrl: {
          type: 'string',
          format: 'uri',
          description: 'The original URL that was shortened'
        }
      }
    }
  },

  // GET /:shortId parameter schema
  shortIdParams: {
    params: {
      type: 'object',
      required: ['shortId'],
      properties: {
        shortId: {
          type: 'string',
          minLength: 1,
          description: 'The short ID to look up'
        }
      }
    }
  },

  // GET /analytics/:shortId response schema
  analyticsResponse: {
    200: {
      type: 'object',
      properties: {
        shortId: {
          type: 'string',
          description: 'The unique identifier for the shortened URL'
        },
        originalUrl: {
          type: 'string',
          format: 'uri',
          description: 'The original URL'
        },
        clickCount: {
          type: 'number',
          description: 'Number of times the shortened URL has been accessed'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Timestamp when the URL was created'
        }
      }
    }
  },

  errorResponse: {
    400: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    429: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
};

/**
 * Register URL routes with Fastify instance
 * 
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Route options
 */
async function urlRoutes(fastify, options) {
  
  // POST /shorten - Create shortened URL (with rate limiting)
  fastify.post('/shorten', {
    config: {
      rateLimit: fastify.rateLimitConfig.shorten
    },
    schema: {
      description: 'Create a shortened URL from a long URL',
      tags: ['URLs'],
      summary: 'Shorten URL',
      ...schemas.createShortUrlRequest,
      response: {
        ...schemas.createShortUrlResponse,
        ...schemas.errorResponse
      }
    }
  }, urlController.createShortUrl);

  // GET /:shortId - Redirect to original URL
  fastify.get('/:shortId', {
    schema: {
      description: 'Redirect to the original URL using the short ID',
      tags: ['URLs'],
      summary: 'Redirect to original URL',
      ...schemas.shortIdParams,
      response: {
        302: {
          description: 'Redirect to original URL',
          type: 'null'
        },
        ...schemas.errorResponse
      }
    }
  }, urlController.redirectToUrl);

  // GET /analytics/:shortId - Get URL analytics
  fastify.get('/analytics/:shortId', {
    schema: {
      description: 'Get analytics data for a shortened URL',
      tags: ['Analytics'],
      summary: 'Get URL analytics',
      ...schemas.shortIdParams,
      response: {
        ...schemas.analyticsResponse,
        ...schemas.errorResponse
      }
    }
  }, urlController.getAnalytics);
}

module.exports = urlRoutes;