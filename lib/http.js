/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const Http = require('http');
const Express = require('express');
const Flv = require('./http/flv');
const Logger = require('./logger');
const colors = require('colors');
const context = require('./ctx');
const ip = require('ip');

class HTTPServer {
  constructor() {
    this.port = 8000;

    var app = Express();
    app.set('view engine', 'ejs');

    app.get('/watch/*', (req, res) => {
      var cutted = req.url.split('/')[req.url.split('/').length - 1];
      res.render('play', { stream: cutted });
    });

    app.get('/flv.min.js', (req, res) => {
      res.sendFile(__dirname + '/flv.min.js');
    });

    app.get('/favicon.ico', (req, res) => {
      res.sendFile(__dirname + '/favicon.ico');
    });

    app.get('*.flv', (req, res, next) => {
      var session = new Flv(req, res);
      session.run();
    });

    this.httpServer = Http.createServer(app);
  }

  run() {
    this.httpServer.listen(this.port, () => {
      Logger.log(`HTTP Server started on: ${colors.yellow('http://' + ip.address() + ':' + this.port)}`);
    });

    this.httpServer.on('error', (e) => {
      Logger.error(`HTTP Server caught ${colors.red('exception')}: ${e}`);
    });

    this.httpServer.on('close', () => {
      Logger.log('Shutting down HTTP Server');
    });

    context.nodeEvent.on('postPlay', (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on('postPublish', (id, args) => {
      context.stat.accepted++;
    });

    context.nodeEvent.on('doneConnect', (id, args) => {
      var session = context.sessions.get(id);
      var socket = session instanceof Flv ? session.req.socket : session.socket;
      context.stat.inbytes += socket.bytesRead;
      context.stat.outbytes += socket.bytesWritten;
    });
  }

  stop() {
    this.httpServer.close();
    context.sessions.forEach((session, id) => {
      if (session instanceof Flv) {
        session.req.destroy();
        context.sessions.delete(id);
      }
    });
  }
}

module.exports = HTTPServer;
