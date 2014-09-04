'use strict';

var
  path = require('path'),
  express = require('express'),
  bodyParser = require('body-parser'),
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

  // SERVER SETUP:

  cpClient = cryptophoto.createClient(process.env.CP_PUBLIC_KEY || 'efe925bda3bc2b5cd6fe3ad3661075a7',
                                      process.env.CP_PRIVATE_KEY || '384b1bda2dafcd909f607083da22fef0');

  app = express();
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, 'views'));

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public'), { maxage: '6h' }));
  app.use(session({ maxAge: 60000, saveUninitialized: true, secret: 'my precious', resave: true}));

  // Routes and handlers:

  app.get('/', function(request, response) {
    var session = request.session;

    if (request.query.logout != null) { // allow log out using queries like '?logout'
      console.log('Logging out...');
      return session.destroy(function() {
        response.render('login', { errorMessage: '' });
      });
    }

    session.userId ?
      response.render('internal', { userId: session.userId }) :
      response.render('login', { errorMessage: '' });
  });

  app.post('/', function(request, response, next) {
    var session = request.session, userId, passWd;

    if (!session.authPending) {

      if (session.userId) { return response.render('internal', { userId: session.userId }); }

      // Check user id and password:
      userId = request.body.userId ? request.body.userId.trim() : '';
      passWd = request.body.passWd ? request.body.passWd.trim() : '';
      if (DB[userId] !== passWd) {
        return next(err('The username or password you entered is not correct! ( Try Moria/Mellon ;) )', 401));
      }

      // Establish a valid CryptoPhoto session:
      cpClient.getSession(userId, visibleIp, function(error, cpSession) {

        if (error) { return next(error); }

        if ('true' !== String(cpSession.valid)) {
          return next(err('CryptoPhoto session is not valid (' + cpSession.error + ')!'));
        }

        session.userId = userId;
        session.authPending = true;

        // Display CryptoPhoto widget (either challenge or token generation):
        if (cpSession.token) {
          response.render('login', { userId: userId, cryptoPhotoWidget: cpClient.getChallengeWidget(cpSession) });
        } else {
          session.destroy(function() {
            response.render('login',
                            { userId: userId, cryptoPhotoWidget: cpClient.getTokenGenerationWidget(cpSession) });
          }); // simplify a bit the flow... after token generation, the user must re-log in
        }
      });

    } else { // the user has just responded to the challenge:
      cpClient.verify(request.body.token_selector, request.body.token_response_field_row,
                      request.body.token_response_field_col, request.body.cp_phc, session.userId, visibleIp,
                      function(error, cpVerification) {

                        if (error) { return session.destroy(function() { next(error); }); }

                        if ('true' !== String(cpVerification.valid)) {
                          return session.destroy(function() {
                            next(err('CryptoPhoto verification failed (' + cpVerification.error + ')!'));
                          });
                        }

                        session.authPending = false;
                        response.render('internal', { userId: session.userId });
                      });
    }
  });

  app.use(function(req, res, next) { // catch 404 and forward to error handler
    next(err('Sorry, the page you were looking for was not found.', 404));
  });

  app.use(function(err, req, res, next) { // declaring 4 arguments indicates an express error handler!
    res.status(err.status || 500);
    res.render('login', { errorMessage: err.message });
  });

  // SERVER STARTUP:

  server = app.listen(3000, function() {
    console.log('Server started; %s:%d', visibleIp, server.address().port);
  });

  // UTILITIES:

  function err(errorMessage, status) {
    var err = new Error(errorMessage);
    err.status = status || 500;
    return err;
  }
});
