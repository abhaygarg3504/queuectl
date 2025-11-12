// src/cli/commands/worker.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const workerManager = require('../../services/workermanager');

module.exports = (program) => {
  const worker = program.command('worker').description('Manage workers');

  worker
    .command('start')
    .option('-c, --count <number>', 'Number of workers to start', '1')
    .description('Start worker processes')
    .action(async (options) => {
      const spinner = ora('Starting workers...').start();

      try {
        await database.connect();
        
        const count = parseInt(options.count);
        const workers = await workerManager.startWorkers(count);

        spinner.succeed(chalk.green(`Started ${workers.length} worker(s)`));
        console.log('Worker IDs:', workers);

        // Keep process alive
        process.stdin.resume();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to start workers: ${error.message}`));
        await database.disconnect();
        process.exit(1);
      }
    });

  worker
    .command('stop')
    .description('Stop all workers')
    .action(async () => {
      const spinner = ora('Stopping workers...').start();

      try {
        await database.connect();
        await workerManager.stopWorkers();
        
        spinner.succeed(chalk.green('All workers stopped'));
        await database.disconnect();
        process.exit(0);
      } catch (error) {
        spinner.fail(chalk.red(`Failed to stop workers: ${error.message}`));
        process.exit(1);
      }
    });
};