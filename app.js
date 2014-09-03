'use strict';

var
  express = require('express'),
  path = require('path'),
  app, server;

app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public'), { maxage: '6h' }));

app.use('/', function(req, res) {
  //res.render('internal', { userId: 'Octavian' });
  res.render('login');
});

app.use(function(req, res, next) { // catch 404 and forward to error handler
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('login', { errorMessage: err.message });
});

server = app.listen(3000, function() {
  console.log('Server started; listening on port %d', server.address().port);
});
