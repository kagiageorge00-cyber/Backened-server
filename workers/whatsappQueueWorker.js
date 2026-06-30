/**
 * WhatsApp Queue Worker
 * Standalone worker process for sending messages
 * Run separately: node workers/whatsappQueueWorker.js
 */

const mongoose = require('mongoose');
const { Worker } = require('bullmq');
const redis = require('ioredis');
require('dotenv').config();

// Import services
const { messageQueue, messageWorker, processQueue } = require('../services/whatsappQueueService');

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
    console.log('📊 Processing messages with concurrency: 10');

    // Process queue every 5 seconds
    setInterval(async () => {
      await processQueue();
    }, 5000);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('⛔ SIGTERM received, shutting down gracefully...');
      await messageWorker.close();
      await mongoose.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('⛔ SIGINT received, shutting down gracefully...');
      await messageWorker.close();
      await mongoose.disconnect();
      process.exit(0);
    });

    console.log('✅ Worker ready to process messages');
  } catch (error) {
    console.error('❌ Worker initialization error:', error);
    process.exit(1);
  }
}

// Start worker
initializeWorker();
