/**
 * Fastify Application Configuration
 * Creates and configures the Fastify instance with all plugins and routes
 */

const fastify = require('fastify');
const config = require('./config/env');

/**
 * Creates and configures a Fastify instance
 * @returns {Object} Configured Fastify instance
 */
function createApp() {
  const loggerConfig = {
    level: config.isDevelopment ? 'info' : 'warn'
  };

  if (config.isDevelopment) {
    try {
      require.resolve('pino-pretty');
      loggerConfig.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      };
    } catch (error) {
      console.log('pino-pretty not available, using default logger');
    }
  }

  const app = fastify({
    logger: loggerConfig,
    genReqId: () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    trustProxy: true,
    disableRequestLogging: config.isProduction
  });

  return app;
}

/**
 * Registers all plugins in the correct order
 * @param {Object} app - Fastify instance
 */
async function registerPlugins(app) {
  await app.register(require('./plugins/mongodb'));
  
  await app.register(require('./plugins/errorHandler'));
  
  await app.register(require('./plugins/rateLimiter'));
  
  await app.register(require('./plugins/swagger'));
}

/**
 * Registers all application routes
 * @param {Object} app - Fastify instance
 */
async function registerRoutes(app) {
  // Register URL routes
  await app.register(require('./routes/urlRoutes'));
}

/**
 * Creates and configures the complete Fastify application
 * @returns {Object} Configured Fastify instance ready to start
 */
async function buildApp() {
  const app = createApp();

  try {
    await registerPlugins(app);
    
    await registerRoutes(app);

    app.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['System'],
        summary: 'Check service health',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    });

    if (config.isDevelopment) {
      app.log.info('Fastify application configured successfully');
      app.log.info('Available routes will be logged after server start');
    }

    return app;
    
  } catch (error) {
    app.log.error('Failed to configure Fastify application:', error);
    throw error;
  }
}

module.exports = buildApp;