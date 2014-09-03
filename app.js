'use strict';

var
  path = require('path'),
  express = require('express'),
  session = require('express-session'),
  cryptophoto = require('cryptophoto-node'),

  DB = {
    Root: 'Root',
    Admin: 'Admin',
    Moria: 'Mellon',
    Erebor: 'Durin\'s Day',
    Redhorn: 'Caradhras'
  };

//
// Set up and start the server upon successfully obtaining the visible ip address:
//
cryptophoto.visibleIp(function(error, visibleIp) {
  var cpClient, app, server;

  if (error) { return console.error(error.toString()); }

  cpClient = cryptophoto.createClient(process.env.CP_PUBLIC_KEY || 'efe925bda3bc2b5cd6fe3ad3661075a7',
                                      process.env.CP_PRIVATE_KEY || '384b1bda2dafcd909f607083da22fef0');

  app = express();
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, 'views'));

  app.use(session({ maxAge: 60000, saveUninitialized: true, secret: 'my precious', resave: true}));
  app.use(express.static(path.join(__dirname, 'public'), { maxage: '6h' }));

  // Routes and handlers:

  app.get('/', function(request, response) {
    var session = request.session;

    if (request.query.logout != null) {
      console.log('Logging out...');
      return session.destroy(function() {
        response.render('login', { errorMessage: '' });
      });
    }

    return session.userId ? response.render('internal') : response.render('login', { errorMessage: '' });
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

  // Server startup:

  server = app.listen(3000, function() {
    console.log('Server started; %s:%d', visibleIp, server.address().port);
  });
});
