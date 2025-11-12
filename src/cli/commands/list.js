// src/cli/commands/list.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const jobManager = require('../../services/jobmanager');

module.exports = (program) => {
  program
    .command('list')
    .option('-s, --state <state>', 'Filter by state')
    .description('List jobs')
    .action(async (options) => {
      const spinner = ora('Fetching jobs...').start();

      try {
        await database.connect();

        const jobs = await jobManager.listJobs(options.state);
        spinner.stop();

        if (jobs.length === 0) {
          console.log(chalk.yellow('No jobs found'));
        } else {
          console.log(chalk.bold(`\nFound ${jobs.length} job(s):\n`));
          jobs.forEach(job => {
            console.log(`${chalk.cyan(job.id)} - ${job.state} - ${job.command}`);
          });
        }

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list jobs: ${error.message}`));
        process.exit(1);
      }
    });
};