// src/services/JobManager.js
const { v4: uuidv4 } = require('uuid');
const jobRepo = require('../storage/jobRepo');
const configManager = require('./configmanager');
const logger = require('../utils/logger');

class JobManager {
  async enqueueJob(jobData) {
    const maxRetries = await configManager.get('max-retries', 3);
    
    const job = {
      id: jobData.id || uuidv4(),
      command: jobData.command,
      state: 'pending',
      attempts: 0,
      max_retries: jobData.max_retries || maxRetries,
      locked_by: null,
      locked_at: null,
      last_error: null,
      next_retry_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await jobRepo.create(job);
    logger.info(`Job ${job.id} enqueued`);
    
    return job;
  }

  async getJobStatus(jobId) {
    return await jobRepo.findById(jobId);
  }

  async listJobs(state = null) {
    if (state) {
      return await jobRepo.listByState(state);
    }
    return await jobRepo.listByState('pending');
  }

  async getStatistics() {
    return await jobRepo.getStatistics();
  }

  async listDLQ() {
    return await jobRepo.listByState('dead');
  }

  async retryDLQJob(jobId) {
    const job = await jobRepo.findById(jobId);
    
    if (!job || job.state !== 'dead') {
      throw new Error('Job not found in DLQ');
    }

    await jobRepo.updateJobState(jobId, 'pending', {
      attempts: 0,
      last_error: null,
      next_retry_at: null
    });

    logger.info(`Job ${jobId} moved from DLQ back to pending`);
  }
}

module.exports = new JobManager();