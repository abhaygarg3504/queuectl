// src/storage/WorkerRepository.js
const Worker = require('../models/worker');

class WorkerRepository {
  async create(workerData) {
    const worker = new Worker(workerData);
    await worker.save();
    return worker.toObject();
  }

  async findById(id) {
    return await Worker.findOne({ id }).lean();
  }

  async updateHeartbeat(workerId, currentJob = null) {
    await Worker.updateOne(
      { id: workerId },
      {
        $set: {
          last_heartbeat: new Date(),
          current_job: currentJob
        }
      }
    );
  }

  async listActive() {
    return await Worker.find({ status: 'active' }).lean();
  }

  async stop(workerId) {
    await Worker.updateOne(
      { id: workerId },
      { $set: { status: 'stopped' } }
    );
  }

  async stopAll() {
    await Worker.updateMany(
      { status: 'active' },
      { $set: { status: 'stopped' } }
    );
  }

  async removeStaleWorkers(timeoutMinutes = 5) {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    
    const result = await Worker.deleteMany({
      last_heartbeat: { $lt: cutoff }
    });

    return result.deletedCount;
  }
}

module.exports = new WorkerRepository();