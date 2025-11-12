// src/services/WorkerManager.js
const { fork } = require('child_process');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const workerRepo = require('../storage/workerRepo');
const logger = require('../utils/logger');

class WorkerManager {
  constructor() {
    this.workers = new Map();
  }

  async startWorkers(count = 1) {
    const started = [];

    for (let i = 0; i < count; i++) {
      const workerId = uuidv4();
      const workerProcess = fork(path.join(__dirname, '../worker/worker-process.js'), [workerId]);

      this.workers.set(workerId, workerProcess);

      await workerRepo.create({
        id: workerId,
        pid: workerProcess.pid,
        status: 'active',
        current_job: null,
        started_at: new Date(),
        last_heartbeat: new Date()
      });

      logger.info(`Worker ${workerId} started (PID: ${workerProcess.pid})`);
      started.push(workerId);

      workerProcess.on('exit', async (code) => {
        logger.info(`Worker ${workerId} exited with code ${code}`);
        this.workers.delete(workerId);
        await workerRepo.stop(workerId);
      });
    }

    return started;
  }

  async stopWorkers() {
    await workerRepo.stopAll();

    for (const [workerId, process] of this.workers) {
      process.kill('SIGTERM');
      logger.info(`Stopping worker ${workerId}`);
    }

    this.workers.clear();
  }

  async getActiveWorkers() {
    return await workerRepo.listActive();
  }
}

module.exports = new WorkerManager();