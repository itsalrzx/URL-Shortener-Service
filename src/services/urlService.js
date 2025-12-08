/**
 * URL Service
 * Business logic for URL shortening operations
 */

const Url = require('../models/Url');
const config = require('../config/env');
const { ValidationError, DatabaseError, NotFoundError } = require('../utils/errors');

// Dynamic import for nanoid (ES module)
let nanoid;
const getNanoid = async () => {
  if (!nanoid) {
    const { nanoid: importedNanoid } = await import('nanoid');
    nanoid = importedNanoid;
  }
  return nanoid;
};

class UrlService {
  /**
   * Create a shortened URL
   * @param {string} originalUrl - The URL to shorten
   * @returns {Promise<Object>} - { shortId, shortUrl, originalUrl }
   * @throws {ValidationError} If URL format is invalid
   * @throws {DatabaseError} If database operation fails
   */
  async createShortUrl(originalUrl) {
    if (!originalUrl || typeof originalUrl !== 'string') {
      throw new ValidationError('Original URL is required and must be a string');
    }
    originalUrl = originalUrl.trim();

    try {
      new URL(originalUrl);
    } catch (error) {
      throw new ValidationError('Please provide a valid URL format');
    }

    let shortId;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const nanoidFn = await getNanoid();
      shortId = nanoidFn(8);
      
      try {
        const existingUrl = await Url.findByShortId(shortId);
        
        if (!existingUrl) {
          break;
        }
        
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new DatabaseError('Failed to generate unique Short ID after maximum attempts');
        }
      } catch (error) {
        if (error instanceof DatabaseError) {
          throw error;
        }
        throw new DatabaseError('Database error while checking Short ID uniqueness');
      }
    }

    try {
      const urlDocument = new Url({
        originalUrl,
        shortId,
        clickCount: 0
      });

      const savedUrl = await urlDocument.save();
      const shortUrl = `${config.baseUrl}/${shortId}`;
      return {
        shortId: savedUrl.shortId,
        shortUrl,
        originalUrl: savedUrl.originalUrl
      };

    } catch (error) {
      if (error.code === 11000) {
        if (attempts < maxAttempts) {
          return this.createShortUrl(originalUrl);
        } else {
          throw new DatabaseError('Failed to create unique Short ID due to high collision rate');
        }
      }

      if (error.name === 'ValidationError') {
        throw new ValidationError(error.message);
      }

      throw new DatabaseError('Failed to save URL to database');
    }
  }

  /**
   * Get original URL and increment click count
   * @param {string} shortId - The short ID
   * @returns {Promise<string>} - Original URL
   * @throws {NotFoundError} If shortId doesn't exist
   * @throws {DatabaseError} If database operation fails
   */
  async getOriginalUrl(shortId) {
    if (!shortId || typeof shortId !== 'string') {
      throw new ValidationError('Short ID is required and must be a string');
    }

    try {
      const urlDocument = await Url.findOneAndUpdate(
        { shortId: shortId.trim() },
        { $inc: { clickCount: 1 } },
        { new: true }
      );

      if (!urlDocument) {
        throw new NotFoundError('Short URL not found');
      }

      return urlDocument.originalUrl;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to retrieve URL from database');
    }
  }

  /**
   * Get analytics for a short URL
   * @param {string} shortId - The short ID
   * @returns {Promise<Object>} - { shortId, originalUrl, clickCount, createdAt }
   * @throws {NotFoundError} If shortId doesn't exist
   * @throws {DatabaseError} If database operation fails
   */
  async getAnalytics(shortId) {
    if (!shortId || typeof shortId !== 'string') {
      throw new ValidationError('Short ID is required and must be a string');
    }

    try {
      const urlDocument = await Url.findOne({ shortId: shortId.trim() });

      if (!urlDocument) {
        throw new NotFoundError('Short URL not found');
      }

      return {
        shortId: urlDocument.shortId,
        originalUrl: urlDocument.originalUrl,
        clickCount: urlDocument.clickCount,
        createdAt: urlDocument.createdAt
      };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new DatabaseError('Failed to retrieve analytics from database');
    }
  }
}

module.exports = new UrlService();