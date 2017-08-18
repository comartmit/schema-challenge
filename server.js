'use strict';

const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const jsonParser = bodyParser.json();

app.get('/spec', (req, res) => {
  res.send('Hello World!');
});

app.get('/spec/:type', (req, res) => {
  res.send('Hello World!');
});

app.post('/validate', jsonParser, (req, res) => {
  if (!req.body) return res.sendStatus(400);

  res.send('Hello World 2');
});

// 405 for not allowed. Enforce an Allow header
app.use((req, res) => {
  res.status(404).send("Sorry can't find that!");
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
