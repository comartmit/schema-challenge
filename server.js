'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const _ = require('lodash');

const events = require('./lib/events.js');
const ValidationError = require('./lib/types.js').ValidationError;

// App setup
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('combined'));

// Contracts
const eventsContract = _.mapValues(events, eventSchema => (eventSchema.getContract()));
const serviceContract = {
  routes: {
    '/spec': 'returns the service contract',
    '/spec/:type': 'returns the schema of a particular event',
    '/validate': 'accepts a JSON object as input, identifies it as an event and validates it against the schema'
  },
  events: eventsContract
};


/* Routes */

app.get('/spec', (req, res) => {
  res.send(serviceContract);
});

app.get('/spec/:type', (req, res) => {
  const type = req.params.type;
  if (!type || !(type in eventsContract)) return res.status(404).send('Event not found');

  res.send(eventsContract[type]);
});

app.post('/validate', (req, res) => {
  let errorReason;

  if (req.body && req.body.type) {
    const event = events[req.body.type];
    if (event) {
      try {
        event.validate(req.body);
        res.send('ok');
      } catch (error) {
        if (error instanceof ValidationError) {
          errorReason = JSON.stringify(error.getFieldErrors());
        }
      }
    } else {
      errorReason = 'invalid event type';
    }
  } else {
    errorReason = 'missing arguments';
  }

  res.status(400).send({errors: errorReason});
});

// Handles all other routes
app.use((req, res) => {
  res.status(404).send('Nothing found at that address');
});

/* Start the server */
app.listen(3000, () => {
  console.log('Events app listening on port 3000!');
});
