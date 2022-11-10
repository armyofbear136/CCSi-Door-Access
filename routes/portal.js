var express = require('express');
const asyncify = require('express-asyncify');

const axios = require('axios');
var portalRouter = asyncify(express.Router());

const orgRouter = require('./org');
// const { stringifier } = require('csv/.');

portalRouter.use('/org', orgRouter);

/* GET portal page. needs to be built*/
portalRouter.get('/', async function (req, res, next) {

  var sidebarList = [];
  var varName = "CCSI Door Access";
  var textTitle = "Welcome to the CCSI Door Access Portal"


// APIfun.downloadFile('https://upload.wikimedia.org/wikipedia/commons/a/ab/Patates.jpg', '../data.jpg');
  res.render('portal', { sidebar: sidebarList, sideTitle: varName, navTitle: textTitle });
});

module.exports = portalRouter;
