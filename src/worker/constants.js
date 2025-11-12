// src/worker/constants.js
module.exports = {
  WORKER_HEARTBEAT_INTERVAL: 30000, // 30 seconds
  JOB_POLL_INTERVAL: 2000, // 2 seconds
  STALE_JOB_TIMEOUT: 10, // 10 minutes
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_BACKOFF_BASE: 2
};