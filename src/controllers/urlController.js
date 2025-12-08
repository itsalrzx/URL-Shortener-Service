/**
 * URL Controller
 * HTTP request handlers for URL shortening operations
 */

const urlService = require('../services/urlService');

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
}

module.exports = new UrlController();