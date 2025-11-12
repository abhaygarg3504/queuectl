// scripts/retry-all-dlq.js
// Retry all jobs from Dead Letter Queue
// Usage: node scripts/retry-all-dlq.js

require('dotenv').config();
const database = require('../src/storage/db');
const jobManager = require('../src/services/jobmanager');
const chalk = require('chalk');
const ora = require('ora');

async function retryAllDLQ() {
  const spinner = ora('Fetching DLQ jobs...').start();

  try {
    await database.connect();

    // Get all DLQ jobs
    const dlqJobs = await jobManager.listDLQ();

    if (dlqJobs.length === 0) {
      spinner.info(chalk.yellow('No jobs found in DLQ'));
      await database.disconnect();
      process.exit(0);
    }

    spinner.succeed(chalk.green(`Found ${dlqJobs.length} jobs in DLQ`));
    console.log(chalk.bold('\n🔄 Retrying all DLQ jobs...\n'));

    let successCount = 0;
    let failCount = 0;

    for (const job of dlqJobs) {
      try {
        await jobManager.retryDLQJob(job.id);
        console.log(chalk.green(`✓ Retried: ${job.id} - ${job.command}`));
        successCount++;
      } catch (error) {
        console.log(chalk.red(`✗ Failed: ${job.id} - ${error.message}`));
        failCount++;
      }
    }

    console.log(chalk.bold('\n📊 Results:\n'));
    console.log(`${chalk.green('Success:')} ${successCount}`);
    console.log(`${chalk.red('Failed:')}  ${failCount}\n`);

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    await database.disconnect();
    process.exit(1);
  }
}

retryAllDLQ();