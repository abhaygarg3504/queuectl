// src/storage/Database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect(retries = 3) {
    if (this.isConnected) return;

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/queuectl';
    
    // Check if URI exists
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    logger.info(`Attempting to connect to MongoDB...`);
    logger.info(`Connection URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`); // Hide password in logs

    for (let i = 0; i < retries; i++) {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000, // 10 seconds instead of 5
          socketTimeoutMS: 45000,
          family: 4 // Force IPv4
        });
        
        this.isConnected = true;
        logger.info('MongoDB connected successfully');
        await this.setupIndexes();
        return;
      } catch (error) {
        logger.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
        
        if (i < retries - 1) {
          const delay = 2000 * (i + 1); // Exponential backoff
          logger.info(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error('Failed to connect to MongoDB after multiple attempts');
  }

  async setupIndexes() {
    const Job = require('../models/job.js');
    await Job.collection.createIndex({ state: 1, next_retry_at: 1 });
    await Job.collection.createIndex({ locked_by: 1, locked_at: 1 });
  }

  async disconnect() {
    if (!this.isConnected) return;
    await mongoose.disconnect();
    this.isConnected = false;
    logger.info('MongoDB disconnected');
  }

  async healthCheck() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();