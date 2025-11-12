// src/cli/commands/dlq.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const jobManager = require('../../services/jobmanager');

module.exports = (program) => {
  const dlq = program.command('dlq').description('Manage Dead Letter Queue');

  dlq
    .command('list')
    .description('List jobs in DLQ')
    .action(async () => {
      const spinner = ora('Fetching DLQ jobs...').start();

      try {
        await database.connect();

        const jobs = await jobManager.listDLQ();
        spinner.stop();

        if (jobs.length === 0) {
          console.log(chalk.yellow('No jobs in DLQ'));
        } else {
          console.log(chalk.bold(`\nDLQ contains ${jobs.length} job(s):\n`));
          jobs.forEach(job => {
            console.log(`${chalk.red(job.id)} - ${job.command}`);
            console.log(`  Error: ${job.last_error}\n`);
          });
        }

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list DLQ: ${error.message}`));
        process.exit(1);
      }
    });

  dlq
    .command('retry <jobId>')
    .description('Retry a job from DLQ')
    .action(async (jobId) => {
      const spinner = ora('Retrying job...').start();

      try {
        await database.connect();

        await jobManager.retryDLQJob(jobId);
        spinner.succeed(chalk.green(`Job ${jobId} moved back to pending queue`));

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to retry job: ${error.message}`));
        process.exit(1);
      }
    });
};