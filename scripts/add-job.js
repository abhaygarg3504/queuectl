// scripts/add-job.js
// Easy way to add jobs without JSON escaping issues
// Usage: node scripts/add-job.js "your command here"
// Or with JSON: node scripts/add-job.js '{"command":"echo test","max_retries":5}'

require('dotenv').config();
const database = require('../src/storage/db');
const jobManager = require('../src/services/jobmanager');
const chalk = require('chalk');
const ora = require('ora');

async function addJob() {
  const input = process.argv.slice(2).join(' ');

  if (!input) {
    console.log(chalk.red('❌ Please provide a command'));
    console.log(chalk.yellow('\nUsage Options:'));
    console.log(chalk.cyan('  1. Simple command:'));
    console.log(chalk.white('     node scripts/add-job.js "echo Hello World"'));
    console.log(chalk.cyan('\n  2. With JSON:'));
    console.log(chalk.white('     node scripts/add-job.js \'{"command":"echo test","max_retries":5}\''));
    process.exit(1);
  }

  const spinner = ora('Adding job to queue...').start();

  try {
    await database.connect();

    let jobData;
    
    // Check if input is JSON or plain command
    if (input.trim().startsWith('{')) {
      jobData = JSON.parse(input);
    } else {
      jobData = { command: input };
    }

    if (!jobData.command) {
      throw new Error('Job must have a "command" field');
    }

    const job = await jobManager.enqueueJob(jobData);

    spinner.succeed(chalk.green('Job enqueued successfully!'));

    console.log(chalk.green('✅ Job enqueued successfully!'));
    console.log(chalk.bold('\n📋 Job Details:\n'));
    console.log(`${chalk.cyan('ID:')}      ${job.id}`);
    console.log(`${chalk.cyan('Command:')} ${job.command}`);
    console.log(`${chalk.cyan('State:')}   ${job.state}`);
    console.log(`${chalk.cyan('Retries:')} ${job.attempts}/${job.max_retries}\n`);

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    await database.disconnect();
    process.exit(1);
  }
}

addJob();