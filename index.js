/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const Logger = require('./lib/logger');
const RTMPServer = require('./lib/rtmp');
const HTTPServer = require('./lib/http');
const Package = require("./package.json");

Logger.log(`ez-rtmp-server v${Package.version}`);

this.nrs = new RTMPServer();
this.nrs.run();

this.nhs = new HTTPServer();
this.nhs.run();

process.on('uncaughtException', (err) => {
  Logger.error('uncaughtException', err);
});
