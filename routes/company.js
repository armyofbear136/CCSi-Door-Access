require('../mySQL');

var express = require('express');
const asyncify = require('express-asyncify');
const companyRouter = asyncify(express.Router({mergeParams: true}));
const siteRouter = require('./site');
const companyUsersRouter = require('./company_users');

companyRouter.use('/:companyID/site', siteRouter);
companyRouter.use('/:companyID/users', companyUsersRouter);

/* GET company page. */
companyRouter.get('/:companyID', async function(req, res, next) {

  console.log(req.params);

  
  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */
  var companyName;
  var orgName;
  try {
    
    console.log('Pulling data from company db on company route');
    await db.query(
      
      `SELECT name, org 
      FROM companies 
      WHERE id = ${req.params.companyID}`, 
      
      function (err, result, fields) {
        if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };
        companyName = result[0].name;
        orgName = result[0].org;
    });
  }catch ( err ) {
    console.log(err)
  } finally {
    //await db.close();
  }


  try {
    
    console.log('Pulling data from sites db on company route');
    await db.query(
      
      `SELECT * 
      FROM sites 
      WHERE company_id_sites = ${req.params.companyID} 
      ORDER BY name ASC`, 
      
      function (err, result, fields) {
      if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };
      var siteList = [];

      for (let i = 0; i < result.length; i++) {
        var statusTextT
        var statusTextStyleT
        var statusButtonStyleT
        if (result[i].status) {
          statusTextT = "Online";
          statusTextStyleT = "text-success";
          statusButtonStyleT = "btn btn-primary";
        }
        else {
          statusTextT = "Offline";
          statusTextStyleT = "text-danger";
          statusButtonStyleT = "btn btn-secondary";
        }
        siteList.push({ id: result[i].id, name: result[i].name, statusText: statusTextT,  statusTextStyle: statusTextStyleT, statusButtonStyle: statusButtonStyleT});
      }

        // /* data packaging for ejs */
      

      var sidebarList = [
        {status: 0, url: `/org/${req.params.companyID}`, icon: "home", text: "Home", justText: "text-left"},
        {status: 1, url: `/org/${req.params.companyID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`, justText: "text-left"},
        {status: 0, url: `/org/${req.params.companyID}/company/${req.params.companyID}/users`, icon: "people_alt", text: `Company Users`, justText: "text-right"},
      ];
      console.log(companyName);
      console.log(orgName);
    
      orgName = "CCSI Door Access" //optional title override
    
      res.render('company', { sites: siteList, sidebar: sidebarList, sideTitle: orgName, navTitle: `${companyName}`, orgID: req.params.orgID, companyID: req.params.companyID });


    });


  } catch ( err ) {
    console.log(err)
  } finally {
    //await db.close();
  }





  
});

module.exports = companyRouter;