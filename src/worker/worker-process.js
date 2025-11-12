// src/worker/worker-process.js
const database = require('../storage/db');
const jobRepo = require('../storage/jobRepo');
const workerRepo = require('../storage/workerRepo');
const executor = require('../services/executor');
const retryManager = require('../utils/retry');
const configManager = require('../services/configmanager');
const logger = require('../utils/logger');

const workerId = process.argv[2];
let isRunning = true;

async function processJobs() {
  await database.connect();

  logger.info(`Worker ${workerId} started processing`);

  // Heartbeat interval
  const heartbeatInterval = setInterval(async () => {
    try {
      await workerRepo.updateHeartbeat(workerId);
    } catch (error) {
      logger.error('Heartbeat failed:', error);
    }
  }, 30000); // Every 30 seconds

  while (isRunning) {
    try {
      // Check if worker should stop
      const worker = await workerRepo.findById(workerId);
      if (!worker || worker.status === 'stopped') {
        logger.info(`Worker ${workerId} received stop signal`);
        break;
      }

      // Release stale jobs
      await jobRepo.releaseStaleJobs(10);

      // Find and lock a job
      const jobs = await jobRepo.findPendingJobs(1);
      
      if (jobs.length === 0) {
        await sleep(2000); // Wait 2 seconds before checking again
        continue;
      }

      const job = jobs[0];
      const lockedJob = await jobRepo.lockJob(job.id, workerId);

      if (!lockedJob) {
        continue; // Job was locked by another worker
      }

      // Update heartbeat with current job
      await workerRepo.updateHeartbeat(workerId, job.id);

      // Execute the job
      const result = await executor.executeCommand(job.command, job.id);

      if (result.success) {
        // Job succeeded
        await jobRepo.updateJobState(job.id, 'completed', {
          locked_by: null,
          locked_at: null
        });
        logger.info(`Job ${job.id} completed`);
      } else {
        // Job failed
        const newAttempts = job.attempts + 1;
        const maxRetries = job.max_retries;

        if (retryManager.shouldRetry(newAttempts, maxRetries)) {
          // Retry with backoff
          const backoffBase = await configManager.get('backoff-base', 2);
          const nextRetryAt = retryManager.getNextRetryTime(newAttempts, backoffBase);
          
          await jobRepo.incrementAttempts(job.id, result.error, nextRetryAt);
          logger.warn(`Job ${job.id} failed (attempt ${newAttempts}/${maxRetries}), will retry at ${nextRetryAt}`);
        } else {
          // Move to DLQ
          await jobRepo.moveToDLQ(job.id, result.error);
          logger.error(`Job ${job.id} moved to DLQ after ${newAttempts} attempts`);
        }
      }

      // Clear current job from worker
      await workerRepo.updateHeartbeat(workerId, null);

    } catch (error) {
      logger.error(`Worker ${workerId} error:`, error);
      await sleep(5000);
    }
  }

  clearInterval(heartbeatInterval);
  await database.disconnect();
  process.exit(0);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info(`Worker ${workerId} received SIGTERM, finishing current job...`);
  isRunning = false;
});

process.on('SIGINT', () => {
  logger.info(`Worker ${workerId} received SIGINT, finishing current job...`);
  isRunning = false;
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start processing
processJobs().catch(error => {
  logger.error('Worker process failed:', error);
  process.exit(1);
});