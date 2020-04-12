/*
**  Made by ThaCheeseBun, forked from Mingliang Chen
**  Edited 12 april 2020
*/

const Crypto = require('crypto');
const context = require('./ctx');

var generateNewSessionID = () => {
  var sessionID = '';
  do { sessionID = Crypto.randomBytes(4).toString('hex').toUpperCase(); }
  while (context.sessions.has(sessionID))
  return sessionID;
}

module.exports = { generateNewSessionID }
