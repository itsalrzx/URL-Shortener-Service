/**
 * Swagger Documentation Plugin
 * Configures OpenAPI 3.0 specification and Swagger UI
 * Enables automatic schema generation from routes
 */

const config = require('../config/env');

/**
 * Swagger plugin for Fastify
 * Registers @fastify/swagger and @fastify/swagger-ui
 * 
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function swaggerPlugin(fastify, options) {
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'URL Shortener Service',
        description: 'A production-quality URL shortener service built with Fastify and MongoDB. Provides URL shortening functionality with analytics tracking.',
        version: '1.0.0',
        contact: {
          name: 'URL Shortener API Support',
          email: 'support@urlshortener.com'
        }
      },
      servers: [
        {
          url: config.baseUrl,
          description: 'URL Shortener Service'
        }
      ],
      tags: [
        {
          name: 'URLs',
          description: 'URL shortening and management operations'
        },
        {
          name: 'Analytics',
          description: 'URL analytics and statistics'
        }
      ]
    }
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false
    },
    uiHooks: {
      onRequest: function (request, reply, next) { next(); },
      preHandler: function (request, reply, next) { next(); }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, request, reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true
  });

  if (config.isDevelopment) {
    fastify.log.info('Swagger documentation available at /documentation');
  }
}

const fp = require('fastify-plugin');

module.exports = fp(swaggerPlugin, {
  name: 'swagger-plugin',
  fastify: '4.x'
});