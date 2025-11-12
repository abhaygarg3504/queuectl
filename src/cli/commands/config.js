// src/cli/commands/config.js
const chalk = require('chalk');
const ora = require('ora');
const database = require('../../storage/db');
const configManager = require('../../services/configmanager');

module.exports = (program) => {
  const config = program.command('config').description('Manage configuration');

  config
    .command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key, value) => {
      const spinner = ora('Setting config...').start();

      try {
        await database.connect();
        const parsedValue = isNaN(value) ? value : parseFloat(value);
        await configManager.set(key, parsedValue);
        spinner.succeed(chalk.green(`Config ${key} set to ${parsedValue}`));
        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to set config: ${error.message}`));
        process.exit(1);
      }
    });

  config
    .command('list')
    .description('List all configuration')
    .action(async () => {
      const spinner = ora('Fetching config...').start();

      try {
        await database.connect();

        const configs = await configManager.list();
        spinner.stop();

        if (configs.length === 0) {
          console.log(chalk.yellow('No configuration found'));
        } else {
          console.log(chalk.bold('\n⚙️  Configuration:\n'));
          configs.forEach(cfg => {
            console.log(`${chalk.cyan(cfg.key)}: ${cfg.value}`);
          });
        }

        await database.disconnect();
      } catch (error) {
        spinner.fail(chalk.red(`Failed to list config: ${error.message}`));
        process.exit(1);
      }
    });
};