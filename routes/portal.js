var express = require('express');
const asyncify = require('express-asyncify');
var portalRouter = asyncify(express.Router());

const orgRouter = require('./org');

portalRouter.use('/org', orgRouter);

/* GET portal page. needs to be built*/
portalRouter.get('/', function(req, res, next) {

  var sidebarList = [];
  var varName = "CCSI Door Access";
  var textTitle = "Welcome to the CCSI Door Access Portal"
  res.render('portal', { sidebar: sidebarList, sideTitle: varName, navTitle: textTitle });
});

module.exports = portalRouter;
