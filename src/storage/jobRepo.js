// src/storage/JobRepository.js
const Job = require('../models/job');
const logger = require('../utils/logger');

class JobRepository {
  async create(jobData) {
    const job = new Job(jobData);
    await job.save();
    return job.toObject();
  }

  async findById(id) {
    return await Job.findOne({ id }).lean();
  }

  async findPendingJobs(limit = 10) {
    const now = new Date();
    
    return await Job.find({
      state: { $in: ['pending', 'failed'] },
      locked_by: null,
      $or: [
        { next_retry_at: null },
        { next_retry_at: { $lte: now } }
      ]
    })
    .sort({ created_at: 1 })
    .limit(limit)
    .lean();
  }

  async lockJob(jobId, workerId) {
    const result = await Job.findOneAndUpdate(
      { 
        id: jobId,
        locked_by: null
      },
      {
        $set: {
          locked_by: workerId,
          locked_at: new Date(),
          state: 'processing',
          updated_at: new Date()
        }
      },
      { new: true }
    );

    return result ? result.toObject() : null;
  }

  async unlockJob(jobId) {
    await Job.updateOne(
      { id: jobId },
      {
        $set: {
          locked_by: null,
          locked_at: null,
          updated_at: new Date()
        }
      }
    );
  }

  async updateJobState(jobId, state, additionalData = {}) {
    await Job.updateOne(
      { id: jobId },
      {
        $set: {
          state,
          updated_at: new Date(),
          ...additionalData
        }
      }
    );
  }

  async incrementAttempts(jobId, error, nextRetryAt) {
    await Job.updateOne(
      { id: jobId },
      {
        $inc: { attempts: 1 },
        $set: {
          state: 'failed',
          last_error: error,
          next_retry_at: nextRetryAt,
          locked_by: null,
          locked_at: null,
          updated_at: new Date()
        }
      }
    );
  }

  async moveToDLQ(jobId, error) {
    await Job.updateOne(
      { id: jobId },
      {
        $set: {
          state: 'dead',
          last_error: error,
          locked_by: null,
          locked_at: null,
          updated_at: new Date()
        }
      }
    );
  }

  async listByState(state) {
    return await Job.find({ state }).sort({ created_at: -1 }).lean();
  }

  async getStatistics() {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      dead: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
    });

    return result;
  }

  async releaseStaleJobs(timeoutMinutes = 10) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const result = await Job.updateMany(
      {
        state: 'processing',
        locked_at: { $lt: cutoff }
      },
      {
        $set: {
          state: 'failed',
          locked_by: null,
          locked_at: null,
          last_error: 'Job timed out',
          updated_at: new Date()
        }
      }
    );

    if (result.modifiedCount > 0) {
      logger.warn(`Released ${result.modifiedCount} stale jobs`);
    }
  }
}

module.exports = new JobRepository();