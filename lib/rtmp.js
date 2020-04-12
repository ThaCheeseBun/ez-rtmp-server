/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const Logger = require('./logger');
const Net = require('net');
const RTMPSession = require('./rtmp/session');
const colors = require('colors');
const ip = require('ip');
const context = require('./ctx');

class RTMPServer {
  constructor() {
    this.port = 1935;
    this.tcpServer = Net.createServer((socket) => {
      var session = new RTMPSession(socket);
      session.run();
    });
  }

  run() {
    this.tcpServer.listen(this.port, () => {
      Logger.log(`RTMP Server started on: ${colors.yellow('rtmp://' + ip.address())}`);
    });

    this.tcpServer.on('error', (e) => {
      Logger.error(`RTMP Server caught ${colors.red('exception')}: ${e}`);
    });

    this.tcpServer.on('close', () => {
      Logger.log('Shutting down RTMP Server');
    });
  }

  stop() {
    this.tcpServer.close();
    context.sessions.forEach((session, id) => {
      if (session instanceof RTMPSession) session.stop();
    });
  }
}

module.exports = RTMPServer;
