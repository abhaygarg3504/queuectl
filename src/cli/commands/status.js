// src/cli/commands/status.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const jobManager = require('../../services/jobmanager');
const workerManager = require('../../services/workermanager');

module.exports = (program) => {
  program
    .command('status')
    .description('Show queue status')
    .action(async () => {
      const spinner = ora('Fetching status...').start();

      try {
        await database.connect();

        const stats = await jobManager.getStatistics();
        const workers = await workerManager.getActiveWorkers();

        spinner.stop();

        console.log(chalk.bold('\n📊 Queue Status\n'));
        console.log(`${chalk.blue('Pending:')}     ${stats.pending}`);
        console.log(`${chalk.yellow('Processing:')} ${stats.processing}`);
        console.log(`${chalk.green('Completed:')}  ${stats.completed}`);
        console.log(`${chalk.red('Failed:')}     ${stats.failed}`);
        console.log(`${chalk.magenta('Dead (DLQ):')} ${stats.dead}`);
        console.log(`\n${chalk.bold('Active Workers:')} ${workers.length}\n`);

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to fetch status: ${error.message}`));
        process.exit(1);
      }
    });
};