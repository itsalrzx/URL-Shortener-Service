/**
 * MongoDB Connection Plugin for Fastify
 * Establishes Mongoose connection and decorates Fastify instance
 */

const mongoose = require('mongoose');
const fp = require('fastify-plugin');
const config = require('../config/env');

/**
 * MongoDB plugin that establishes connection and decorates Fastify instance
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin options
 */
async function mongodbPlugin(fastify, options) {
  try {
    // Configure mongoose connection options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
    };

    fastify.log.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri, connectionOptions);
    
    fastify.log.info('Successfully connected to MongoDB');

    fastify.decorate('mongoose', mongoose);

    mongoose.connection.on('error', (error) => {
      fastify.log.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      fastify.log.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      fastify.log.info('MongoDB reconnected');
    });

    fastify.addHook('onClose', async (instance) => {
      try {
        fastify.log.info('Closing MongoDB connection...');
        await mongoose.connection.close();
        fastify.log.info('MongoDB connection closed successfully');
      } catch (error) {
        fastify.log.error('Error closing MongoDB connection:', error);
        throw error;
      }
    });

  } catch (error) {
    fastify.log.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

module.exports = fp(mongodbPlugin, {
  name: 'mongodb',
  fastify: '4.x'
});