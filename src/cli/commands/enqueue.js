// src/cli/commands/enqueue.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const jobManager = require('../../services/jobmanager');

module.exports = (program) => {
  program
    .command('enqueue [job...]')
    .description('Enqueue a new job (accepts JSON or command string)')
    .action(async (jobParts) => {
      if (!jobParts || jobParts.length === 0) {
        console.log(chalk.red('❌ Please provide job data'));
        console.log(chalk.yellow('\nUsage:'));
        console.log(chalk.white('  queuectl enqueue "echo Hello"'));
        console.log(chalk.white('  queuectl enqueue \'{"command":"echo test"}\''));
        process.exit(1);
      }

      const spinner = ora('Enqueuing job...').start();

      try {
        await database.connect();
        
        // Join all parts back together
        const input = jobParts.join(' ');
        let jobData;
        
        // Try to parse as JSON first
        try {
          // Clean the input
          let cleanInput = input.trim();
          
          // Remove outer quotes if present
          if ((cleanInput.startsWith('"') && cleanInput.endsWith('"')) ||
              (cleanInput.startsWith("'") && cleanInput.endsWith("'"))) {
            cleanInput = cleanInput.slice(1, -1);
          }
          
          // Replace escaped quotes
          cleanInput = cleanInput.replace(/\\"/g, '"');
          
          // Try parsing as JSON
          jobData = JSON.parse(cleanInput);
          
          if (!jobData.command) {
            throw new Error('JSON must have a "command" field');
          }
        } catch (jsonError) {
          // If JSON parsing fails, treat entire input as command
          jobData = { command: input };
        }
        
        const job = await jobManager.enqueueJob(jobData);

        spinner.succeed(chalk.green('Job enqueued successfully!'));
        console.log(chalk.bold('\n📋 Job Details:\n'));
        console.log(`${chalk.cyan('ID:')}      ${job.id}`);
        console.log(`${chalk.cyan('Command:')} ${job.command}`);
        console.log(`${chalk.cyan('State:')}   ${job.state}`);
        console.log(`${chalk.cyan('Retries:')} ${job.attempts}/${job.max_retries}\n`);

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to enqueue job: ${error.message}`));
        console.log(chalk.yellow('\n💡 Tip: Use the helper script for easier job creation:'));
        console.log(chalk.white('   node scripts/add-job.js "your command here"'));
        await database.disconnect();
        process.exit(1);
      }
    });
};