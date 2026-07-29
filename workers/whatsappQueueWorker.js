/**
 * WhatsApp Queue Worker
 * Standalone worker process for sending messages
 * Run separately: node workers/whatsappQueueWorker.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import services
const whatsappQueueService = require('../services/whatsappQueueService');

// Connect to MongoDB
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bliss');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Main worker initialization
async function initializeWorker() {
  try {
    await connectMongoDB();

    console.log('🚀 WhatsApp Queue Worker started');

    const worker = await whatsappQueueService.getMessageWorker();
    if (!worker) {
      console.warn('⚠️ Redis unavailable, WhatsApp queue worker disabled. Message processing will be skipped.');
    } else {
      console.log('📊 Processing messages with concurrency: 10');
    }

    // Process queue every 5 seconds
    setInterval(async () => {
      await whatsappQueueService.processQueue();
    }, 5000);

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`⛔ ${signal} received, shutting down gracefully...`);
      const workerInstance = await whatsappQueueService.getMessageWorker();
      if (workerInstance && typeof workerInstance.close === 'function') {
        try {
          await workerInstance.close();
        } catch (error) {
          console.warn('⚠️ Error closing WhatsApp worker during shutdown:', error.message);
        }
      }
      await mongoose.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    console.log('✅ Worker ready to process messages');
  } catch (error) {
    console.error('❌ Worker initialization error:', error);
    process.exit(1);
  }
}

// Start worker
initializeWorker();
