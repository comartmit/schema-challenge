'use strict';

const types = require('./types.js');

const IMEvent = new types.Event('IM', {
  userID: new types.String('The ID of the user'),
  body: new types.Schema({
    text: new types.String('the message of the text'),
    messageID: new types.UUID(),
    timestamp: new types.ISO8601(),
  }),
});

const simple = new types.Event('SIMPLE', {
  test: new types.String('test field')
});

module.exports = {
  simple,
  IMEvent
};
