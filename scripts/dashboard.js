// scripts/dashboard.js
// Live monitoring dashboard for QueueCTL
// Usage: node scripts/dashboard.js

require('dotenv').config();
const database = require('../src/storage/db');
const jobManager = require('../src/services/jobmanager');
const workerManager = require('../src/services/workermanager');
const chalk = require('chalk');

let isRunning = true;

async function clearScreen() {
  console.clear();
  console.log('\x1Bc'); // Alternative clear method
}

async function showDashboard() {
  try {
    await database.connect();

    while (isRunning) {
      clearScreen();
      
      console.log(chalk.bold.blue('╔════════════════════════════════════════════╗'));
      console.log(chalk.bold.blue('║        QueueCTL Live Dashboard         ║'));
      console.log(chalk.bold.blue('╚════════════════════════════════════════════╝\n'));

      // Get statistics
      const stats = await jobManager.getStatistics();
      const workers = await workerManager.getActiveWorkers();

      // Queue Stats
      console.log(chalk.bold('📊 Queue Statistics:\n'));
      console.log(`  ${chalk.blue('●')} Pending:     ${chalk.white(stats.pending.toString().padEnd(5))} ${getBar(stats.pending, 20)}`);
      console.log(`  ${chalk.yellow('●')} Processing:  ${chalk.white(stats.processing.toString().padEnd(5))} ${getBar(stats.processing, 20)}`);
      console.log(`  ${chalk.green('●')} Completed:   ${chalk.white(stats.completed.toString().padEnd(5))} ${getBar(stats.completed, 20)}`);
      console.log(`  ${chalk.red('●')} Failed:      ${chalk.white(stats.failed.toString().padEnd(5))} ${getBar(stats.failed, 20)}`);
      console.log(`  ${chalk.magenta('●')} Dead (DLQ):  ${chalk.white(stats.dead.toString().padEnd(5))} ${getBar(stats.dead, 20)}`);

      // Workers Info
      console.log(chalk.bold('\n\n👷 Active Workers:\n'));
      if (workers.length === 0) {
        console.log(chalk.yellow('  No active workers'));
      } else {
        workers.forEach((worker, idx) => {
          const status = worker.current_job ? chalk.yellow('BUSY') : chalk.green('IDLE');
          console.log(`  ${idx + 1}. ${chalk.cyan(worker.id.substring(0, 8))}... [${status}]`);
          if (worker.current_job) {
            console.log(`     Processing: ${chalk.white(worker.current_job)}`);
          }
        });
      }

      // Recent Pending Jobs
      const pendingJobs = await jobManager.listJobs('pending');
      console.log(chalk.bold('\n\n📋 Pending Jobs:\n'));
      if (pendingJobs.length === 0) {
        console.log(chalk.gray('  No pending jobs'));
      } else {
        const displayCount = Math.min(pendingJobs.length, 5);
        for (let i = 0; i < displayCount; i++) {
          const job = pendingJobs[i];
          const cmd = job.command.length > 50 
            ? job.command.substring(0, 47) + '...' 
            : job.command;
          console.log(`  ${chalk.cyan(i + 1)}. ${cmd}`);
        }
        if (pendingJobs.length > 5) {
          console.log(chalk.gray(`  ... and ${pendingJobs.length - 5} more`));
        }
      }

      // Footer
      console.log(chalk.bold.blue('\n\n════════════════════════════════════════════'));
      console.log(chalk.gray('  Press Ctrl+C to exit'));
      console.log(chalk.gray(`  Last updated: ${new Date().toLocaleTimeString()}`));

      // Wait 2 seconds before refresh
      await sleep(2000);
    }

  } catch (error) {
    console.log(chalk.red(`\n❌ Dashboard error: ${error.message}`));
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

function getBar(value, maxLength) {
  const length = Math.min(value, maxLength);
  return chalk.blue('█'.repeat(length)) + chalk.gray('░'.repeat(maxLength - length));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  isRunning = false;
  console.log(chalk.yellow('\n\n👋 Shutting down dashboard...'));
});

// Start dashboard
showDashboard();