/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const colors = require('colors');

LOG_TYPES = { NONE: 0, ERROR: 1, NORMAL: 2, DEBUG: 3 };

var logType = LOG_TYPES.NORMAL;

const logTime = () => {
  return `[${new Date().toLocaleTimeString()}]`;
};

const log = (...args) => {
  if (logType < LOG_TYPES.NORMAL) return;
  console.log(logTime(), colors.bold.green('[INFO]'), ...args);
};

const error = (...args) => {
  if (logType < LOG_TYPES.ERROR) return;
  console.log(logTime(), colors.bold.red('[ERROR]'), ...args);
};

const debug = (...args) => {
  if (logType < LOG_TYPES.DEBUG) return;
  console.log(logTime(), colors.bold.blue('[DEBUG]'), ...args);
};

module.exports = { LOG_TYPES, log, error, debug }
