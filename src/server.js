/**
 * Server Entry Point
 * Bootstraps the URL Shortener application and starts the HTTP server
 */

require('dotenv').config();

const buildApp = require('./app');
const config = require('./config/env');

/**
 * Graceful shutdown handler
 * @param {string} signal - The signal that triggered shutdown
 * @param {Object} app - Fastify instance
 */
async function gracefulShutdown(signal, app) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    await app.close();
    console.log('Server closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function startServer() {
  let app;
  
  try {
    console.log('Building Fastify application...');
    app = await buildApp();
    
    const address = await app.listen({
      port: config.port,
      host: '0.0.0.0' // Listen on all interfaces for Docker compatibility
    });
    
    console.log('URL Shortener Service started successfully!');
    console.log(`Server listening at: ${address}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`API Documentation: ${config.baseUrl}/documentation`);
    console.log(` Health Check: ${config.baseUrl}/health`);
    
    if (config.isDevelopment) {
      console.log('\n Available endpoints:');
      console.log(`  POST   ${config.baseUrl}/shorten`);
      console.log(`  GET    ${config.baseUrl}/:shortId`);
      console.log(`  GET    ${config.baseUrl}/analytics/:shortId`);
      console.log(`  GET    ${config.baseUrl}/health`);
      console.log(`  GET    ${config.baseUrl}/documentation`);
    }
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM', app));
    process.on('SIGINT', () => gracefulShutdown('SIGINT', app));
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION', app);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION', app);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    
    if (config.isDevelopment) {
      console.error('Full error details:', error);
    }
    
    if (app) {
      try {
        await app.close();
      } catch (closeError) {
        console.error('Error closing app during startup failure:', closeError);
      }
    }
    
    process.exit(1);
  }
}

startServer();