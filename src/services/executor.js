// src/services/executor.js
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

class Executor {
  async executeCommand(command, jobId) {
    logger.info(`Executing job ${jobId}: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        shell: true
      });

      logger.info(`Job ${jobId} completed successfully`);
      return { 
        success: true, 
        stdout: stdout || '', 
        stderr: stderr || '' 
      };
      
    } catch (error) {
      // Check if it's a timeout
      if (error.killed && error.signal === 'SIGTERM') {
        logger.error(`Job ${jobId} timed out`);
        return { 
          success: false, 
          error: 'Command execution timed out (5 minutes limit)' 
        };
      }

      // Check if it's a non-zero exit code
      if (error.code !== undefined) {
        const errorMsg = error.stderr || error.stdout || error.message;
        logger.error(`Job ${jobId} failed with exit code ${error.code}`);
        return { 
          success: false, 
          error: `Exit code ${error.code}: ${errorMsg}` 
        };
      }

      // Generic error
      logger.error(`Job ${jobId} execution error:`, error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

module.exports = new Executor();