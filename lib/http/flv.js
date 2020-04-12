/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const URL = require("url");
const AMF = require("../core/amf");
const Logger = require("../logger");
const context = require("../ctx");
const colors = require('colors');
const Utils = require("../utils");

const FlvPacket = {
  create: (payload = null, type = 0, time = 0) => {
    return {
      header: {
        length: payload ? payload.length : 0,
        timestamp: time,
        type: type
      },
      payload: payload
    };
  }
};

class Flv {
  constructor(req, res) {
    this.req = req;
    this.res = res;
    this.id = Utils.generateNewSessionID();
    this.ip = this.req.socket.remoteAddress;

    this.playStreamPath = "";
    this.playArgs = null;

    this.isStarting = false;
    this.isPlaying = false;
    this.isIdling = false;

    this.res.cork = this.res.socket.cork.bind(this.res.socket);
    this.res.uncork = this.res.socket.uncork.bind(this.res.socket);
    this.req.socket.on("close", this.onReqClose.bind(this));
    this.req.on("error", this.onReqError.bind(this));

    this.numPlayCache = 0;
    context.sessions.set(this.id, this);
  }

  run() {
    var method = this.req.method;
    var urlInfo = URL.parse(this.req.url, true);
    var streamPath = urlInfo.pathname.split(".")[0];
    this.connectCmdObj = { ip: this.ip, method, streamPath, query: urlInfo.query };
    this.connectTime = new Date();
    this.isStarting = true;
    Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} connected (${colors.cyan('ID:')} ${this.id})`);
    context.nodeEvent.emit("preConnect", this.id, this.connectCmdObj);
    if (!this.isStarting) return this.stop();
    context.nodeEvent.emit("postConnect", this.id, this.connectCmdObj);

    if (method === "GET") {
      this.playStreamPath = streamPath;
      this.playArgs = urlInfo.query;
      this.onPlay();
    } else {
      this.stop();
    }
  }

  stop() {
    if (this.isStarting) {
      this.isStarting = false;
      var publisherId = context.publishers.get(this.playStreamPath);
      if (publisherId != null) {
        context.sessions.get(publisherId).players.delete(this.id);
        context.nodeEvent.emit("donePlay", this.id, this.playStreamPath, this.playArgs);
      }
      Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} closed stream on path ${colors.yellow(this.playStreamPath)} (${colors.cyan('ID:')} ${this.id})`);
      Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} disconnected (${colors.cyan('ID:')} ${this.id})`);
      context.nodeEvent.emit("doneConnect", this.id, this.connectCmdObj);
      this.res.end();
      context.idlePlayers.delete(this.id);
      context.sessions.delete(this.id);
    }
  }

  onReqClose() {
    this.stop();
  }

  onReqError(e) {
    this.stop();
  }

  reject() {
    Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} rejected (${colors.red('ID:')} ${this.id})`);
    this.stop();
  }

  onPlay() {
    context.nodeEvent.emit("prePlay", this.id, this.playStreamPath, this.playArgs);
    if (!this.isStarting) return;

    if (!context.publishers.has(this.playStreamPath)) {
      Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} requested stream on path ${colors.yellow(this.playStreamPath)} but it was not found (${colors.cyan('ID:')} ${this.id})`);
      context.idlePlayers.add(this.id);
      this.isIdling = true;
      return;
    }

    this.onStartPlay();
  }

  onStartPlay() {
    var publisherId = context.publishers.get(this.playStreamPath);
    var publisher = context.sessions.get(publisherId);
    var players = publisher.players;
    players.add(this.id);

    //send FLV header
    var FLVHeader = Buffer.from([0x46, 0x4c, 0x56, 0x01, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, 0x00, 0x00, 0x00]);
    if (publisher.isFirstAudioReceived) FLVHeader[4] |= 0b00000100;
    if (publisher.isFirstVideoReceived) FLVHeader[4] |= 0b00000001;
    this.res.write(FLVHeader);

    //send Metadata
    if (publisher.metaData != null) {
      var packet = FlvPacket.create(publisher.metaData, 18);
      var tag = Flv.createFlvTag(packet);
      this.res.write(tag);
    }

    //send aacSequenceHeader
    if (publisher.audioCodec == 10) {
      var packet = FlvPacket.create(publisher.aacSequenceHeader, 8);
      var tag = Flv.createFlvTag(packet);
      this.res.write(tag);
    }

    //send avcSequenceHeader
    if (publisher.videoCodec == 7 || publisher.videoCodec == 12) {
      var packet = FlvPacket.create(publisher.avcSequenceHeader, 9);
      var tag = Flv.createFlvTag(packet);
      this.res.write(tag);
    }

    this.isIdling = false;
    this.isPlaying = true;
    Logger.log(`${colors.magenta('[http-flv]')} ${this.ip} joined stream on path ${colors.yellow(this.playStreamPath)} (${colors.cyan('ID:')} ${this.id})`);
    context.nodeEvent.emit("postPlay", this.id, this.playStreamPath, this.playArgs);
  }

  static createFlvTag(packet) {
    var PreviousTagSize = 11 + packet.header.length;
    var tagBuffer = Buffer.alloc(PreviousTagSize + 4);
    tagBuffer[0] = packet.header.type;
    tagBuffer.writeUIntBE(packet.header.length, 1, 3);
    tagBuffer[4] = (packet.header.timestamp >> 16) & 0xff;
    tagBuffer[5] = (packet.header.timestamp >> 8) & 0xff;
    tagBuffer[6] = packet.header.timestamp & 0xff;
    tagBuffer[7] = (packet.header.timestamp >> 24) & 0xff;
    tagBuffer.writeUIntBE(0, 8, 3);
    tagBuffer.writeUInt32BE(PreviousTagSize, PreviousTagSize);
    packet.payload.copy(tagBuffer, 11, 0, packet.header.length);
    return tagBuffer;
  }
}

module.exports = Flv;
