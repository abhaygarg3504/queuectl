// src/cli/index.js
const { program } = require('commander');
const chalk = require('chalk');
const enqueueCommand = require('./commands/enqueue');
const workerCommand = require('./commands/worker');
const statusCommand = require('./commands/status');
const listCommand = require('./commands/list');
const dlqCommand = require('./commands/dlq');
const configCommand = require('./commands/config');

program
  .name('queuectl')
  .description('CLI-based background job queue system')
  .version('1.0.0');

program
  .command('help')
  .description('Show detailed help')
  .action(() => {
    console.log(chalk.bold.blue('\n🚀 QueueCTL - Background Job Queue System\n'));
    console.log(chalk.yellow('Available Commands:\n'));
    console.log(chalk.white('  enqueue <command>     - Add a job to queue'));
    console.log(chalk.white('  worker start [-c N]   - Start N workers (default: 1)'));
    console.log(chalk.white('  worker stop           - Stop all workers'));
    console.log(chalk.white('  status                - Show queue statistics'));
    console.log(chalk.white('  list [-s <state>]     - List jobs by state'));
    console.log(chalk.white('  dlq list              - Show Dead Letter Queue'));
    console.log(chalk.white('  dlq retry <jobId>     - Retry a DLQ job'));
    console.log(chalk.white('  config set <k> <v>    - Set configuration'));
    console.log(chalk.white('  config list           - Show all config\n'));
    
    console.log(chalk.yellow('Helper Scripts:\n'));
    console.log(chalk.white('  node scripts/add-job.js "command"'));
    console.log(chalk.white('  node scripts/dashboard.js'));
    console.log(chalk.white('  node scripts/test-queue.js\n'));
    
    console.log(chalk.cyan('Examples:\n'));
    console.log(chalk.gray('  queuectl enqueue "echo Hello World"'));
    console.log(chalk.gray('  queuectl worker start -c 3'));
    console.log(chalk.gray('  node scripts/dashboard.js\n'));
  });

// Commands
enqueueCommand(program);
workerCommand(program);
statusCommand(program);
listCommand(program);
dlqCommand(program);
configCommand(program);

module.exports = program;