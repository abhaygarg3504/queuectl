// src/utils/retry.js
const logger = require('./logger');
// src/utils/retry.js
class RetryManager {
  shouldRetry(attempts, maxRetries) {
    return attempts < maxRetries;
  }

  getNextRetryTime(attempts, backoffBase = 2) {
    const delaySeconds = Math.pow(backoffBase, attempts);
    return new Date(Date.now() + delaySeconds * 1000);
  }
}

module.exports = new RetryManager();