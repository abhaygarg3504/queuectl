// bin/queuectl.js
require('dotenv').config();
const program = require('../src/cli');

program.parse(process.argv);