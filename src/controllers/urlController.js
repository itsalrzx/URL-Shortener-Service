/**
 * URL Controller
 * HTTP request handlers for URL shortening operations
 */

const urlService = require('../services/urlService');
const { NotFoundError } = require('../utils/errors');

class UrlController {
  /**
   * POST /shorten handler
   * Creates a shortened URL from the provided original URL
   * 
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<Object>} JSON response with shortId, shortUrl, and originalUrl
   */
  async createShortUrl(request, reply) {
    try {
      const { originalUrl } = request.body;
      const result = await urlService.createShortUrl(originalUrl);
    
      return reply.status(201).send(result);
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET /:shortId handler
   * Redirects to the original URL and increments click count
   * 
   * @param {Object} request - Fastify request object
   * @param {Object} reply - Fastify reply object
   * @returns {Promise<void>} HTTP 302 redirect response
   */
  async redirectToUrl(request, reply) {
    try {
      const { shortId } = request.params;
      const originalUrl = await urlService.getOriginalUrl(shortId);
      
      return reply.status(302).redirect(originalUrl);
      
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: error.message
        });
      }
      throw error;
    }
  }
}

module.exports = new UrlController();