var createError = require('http-errors');
var express = require('express');
const asyncify = require('express-asyncify');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = asyncify(express());

var ccsiDB = require('./database');

// allow passing of db to express routes
app.set('db', ccsiDB);

//routers
// var homeRouter = require('./routes/home');
var portalRouter = require('./routes/portal');``



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/assets/', express.static(path.join(__dirname, 'public')));

// app.use('/', homeRouter);
app.use('/', portalRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //no error page made yet
  res.render('error', { error: "Server Error", message: "Please try again", sidebar: [{status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: `Server Error ${err.status}`});

});

// app.listen(6000);
//console.log('Server is listening on port 3000');

module.exports = app;
