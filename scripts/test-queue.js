// scripts/test-queue.js
// Complete test suite for QueueCTL
// Usage: node scripts/test-queue.js

require('dotenv').config();
const database = require('../src/storage/db');
const jobManager = require('../src/services/jobmanager');
const chalk = require('chalk');

async function testQueue() {
  console.log(chalk.bold.blue('\n🧪 QueueCTL Test Suite\n'));

  try {
    await database.connect();

    // Test 1: Simple echo command
    console.log(chalk.cyan('Test 1: Adding simple echo command...'));
    const job1 = await jobManager.enqueueJob({
      command: 'echo Test 1 Passed'
    });
    console.log(chalk.green(`✓ Job created: ${job1.id}\n`));

    // Test 2: Multiple echo commands
    console.log(chalk.cyan('Test 2: Adding multiple commands...'));
    const job2 = await jobManager.enqueueJob({
      command: 'echo Test 2 - Part 1 && echo Test 2 - Part 2'
    });
    console.log(chalk.green(`✓ Job created: ${job2.id}\n`));

    // Test 3: Custom retries
    console.log(chalk.cyan('Test 3: Job with custom retry count...'));
    const job3 = await jobManager.enqueueJob({
      command: 'echo Test 3 with 5 retries',
      max_retries: 5
    });
    console.log(chalk.green(`✓ Job created: ${job3.id} (max_retries: 5)\n`));

    // Test 4: Long running command (sleep equivalent in Windows)
    console.log(chalk.cyan('Test 4: Delayed command...'));
    const job4 = await jobManager.enqueueJob({
      command: 'ping 127.0.0.1 -n 3 > nul && echo Test 4 - Delayed execution'
    });
    console.log(chalk.green(`✓ Job created: ${job4.id}\n`));

    // Test 5: Command that will fail
    console.log(chalk.cyan('Test 5: Intentional failure (for retry testing)...'));
    const job5 = await jobManager.enqueueJob({
      command: 'this-command-does-not-exist',
      max_retries: 2
    });
    console.log(chalk.green(`✓ Job created: ${job5.id} (will fail)\n`));

    // Show statistics
    const stats = await jobManager.getStatistics();
    console.log(chalk.bold('\n📊 Current Queue Statistics:\n'));
    console.log(`${chalk.blue('Pending:')}     ${stats.pending}`);
    console.log(`${chalk.yellow('Processing:')} ${stats.processing}`);
    console.log(`${chalk.green('Completed:')}  ${stats.completed}`);
    console.log(`${chalk.red('Failed:')}     ${stats.failed}`);
    console.log(`${chalk.magenta('Dead (DLQ):')} ${stats.dead}\n`);

    console.log(chalk.bold.green('✅ All tests completed!\n'));
    console.log(chalk.yellow('💡 Tip: Start a worker to process these jobs:'));
    console.log(chalk.white('   node bin/queuectl.js worker start\n'));

    await database.disconnect();
    process.exit(0);
  } catch (error) {
    console.log(chalk.red(`❌ Test failed: ${error.message}`));
    await database.disconnect();
    process.exit(1);
  }
}

testQueue();