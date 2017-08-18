'use strict';

const types = require('./types.js');

const IMEvent = new types.Event('IM', {
  userID: new types.String('The ID of the user'),
  body: new types.Schema({
    text: new types.String('the message of the text'),
    messageID: new types.UUID('unique ID of the message'),
    timestamp: new types.ISO8601('time the message was sent - ISO8601 format'),
  }),
});

const SMSEvent = new types.Event('SMS', {
  phoneNumber: new types.String('Phone number'),
  body: new types.Schema({
    text: new types.String('the text in the message'),
    messageID: new types.UUID('unique ID of the message', false),
    timestamp: new types.ISO8601('time the message was sent - ISO8601 format')
  })
});

module.exports = {
  IM: IMEvent,
  SMS: SMSEvent,
};
