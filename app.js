'use strict';

var
  express = require('express'),
  app = express(), server;

app.get('/', function(req, res) {
  res.send('Hello world!');
});

server = app.listen(3000, function() {
  console.log('Server started; listening on port %d', server.address().port);
});
