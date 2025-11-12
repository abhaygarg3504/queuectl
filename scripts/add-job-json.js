// scripts/add-job-json.js
// For adding jobs with custom JSON configuration
// Usage: node scripts/add-job-json.js command max_retries
// Example: node scripts/add-job-json.js "echo test" 5

require('dotenv').config();
const database = require('../src/storage/db');
const jobManager = require('../src/services/jobmanager');
const chalk = require('chalk');
const ora = require('ora');

async function addJob() {
  const command = process.argv[2];
  const maxRetries = parseInt(process.argv[3]) || 3;

  if (!command) {
    console.log(chalk.red('❌ Please provide a command'));
    console.log(chalk.yellow('\nUsage:'));
    console.log(chalk.white('  node scripts/add-job-json.js "command" [max_retries]'));
    console.log(chalk.yellow('\nExamples:'));
    console.log(chalk.white('  node scripts/add-job-json.js "echo Hello"'));
    console.log(chalk.white('  node scripts/add-job-json.js "curl http://api.com" 5'));
    process.exit(1);
  }

  const spinner = ora('Adding job to queue...').start();

  try {
    await database.connect();

    const jobData = {
      command: command,
      max_retries: maxRetries
    };

    const job = await jobManager.enqueueJob(jobData);

    spinner.succeed(chalk.green('Job enqueued successfully!'));
    console.log(chalk.bold('\n📋 Job Details:\n'));
    console.log(`${chalk.cyan('ID:')}          ${job.id}`);
    console.log(`${chalk.cyan('Command:')}     ${job.command}`);
    console.log(`${chalk.cyan('State:')}       ${job.state}`);
    console.log(`${chalk.cyan('Max Retries:')} ${job.max_retries}`);
    console.log(`${chalk.cyan('Attempts:')}    ${job.attempts}/${job.max_retries}\n`);

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    spinner.fail(chalk.red(`Error: ${error.message}`));
    await database.disconnect();
    process.exit(1);
  }
}

addJob();