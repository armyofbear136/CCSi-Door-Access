require('../mySQL');

var express = require('express');
const asyncify = require('express-asyncify');
var orgRouter = asyncify(express.Router({mergeParams: true}));


const companyRouter = require('./company');
const globalUsersRouter = require('./global_users');

orgRouter.use('/:orgID/company', companyRouter);
orgRouter.use('/:orgID/users', globalUsersRouter);





/* GET home page. */
orgRouter.get('/:orgID', async function(req, res, next) {

  
  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  data = {};
  data.name = 'test';

  // data = await db.query("SELECT name FROM companies", function (err, result, fields) {
    //  if (err){ 
    //       console.log(typeof(err));
    //       for (var k in err){
    //         console.log(`${k}: ${err[k]}`);
    //       }
    //       res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
    //         {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
    //       // throw err
    //     };
  //   console.log(result[1].name);
  // });

  try {
    
    console.log('Pulling data from companies table on org route');
    await db.query(

      `SELECT * 
      FROM companies 
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
      var companiesList = [];
      var orgName = result[0].org;

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
        companiesList.push({ id: result[i].id, name: result[i].name, statusText: statusTextT,  statusTextStyle: statusTextStyleT, statusButtonStyle: statusButtonStyleT});
      }

      var sidebarList = [
        {status: 1, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/users`, icon: "public", text: `Global Users`},
      ];

      orgName = "CCSI Door Access" //optional title override
    
    
      res.render('org', { companies: companiesList, sidebar: sidebarList, sideTitle: orgName, navTitle: `${orgName} - Available Companies`, orgID: req.params.orgID });


    });

  } catch ( err ) {
    res.send("server error");
    console.log(err)
    
  } finally {
    //await db.close();
  }

  
});

module.exports = orgRouter;