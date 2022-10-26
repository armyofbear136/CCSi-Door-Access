var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
var orgRouter = asyncify(express.Router({ mergeParams: true }));


const companyRouter = require('./company');

orgRouter.use('/:orgID/company', companyRouter);


/* GET home page. */
orgRouter.get('/:orgID', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {

    console.log('Pulling data from companies table on org route');
    await db.query(

      `SELECT c.id, c.name, c.status, c.org, COALESCE(COUNT(s.id), 0) as sitecount, COALESCE(SUM(s.usercount), 0) as usercount, COALESCE(SUM(s.doorcount), 0) as doorcount, COALESCE(SUM(s.groupcount), 0) as groupcount
      FROM companies c
      LEFT JOIN (
        SELECT sit.id, sit.company_id_sites as company_id_sites, sit.usercount as usercount, sit.doorcount as doorcount, sit.groupcount as groupcount
        FROM sites sit
      ) s ON (c.id = s.company_id_sites)
      GROUP BY c.id
      ORDER BY c.name ASC
      `,

      function (err, result, fields) {
        if (err) {
          console.log(typeof (err));
          for (var k in err) {
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', {
            error: "Server Error", message: "Please try again", sidebar: [
              { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
          });
          // throw err
        };
        var companiesData = result;
        var orgName = companiesData[0].org;

        for (i in companiesData) {
          if (companiesData[i].status) {
            companiesData[i].statusText = "Online";
            companiesData[i].statusTextStyle = "text-success";
            companiesData[i].statusButtonStyle = "btn btn-primary";
          }
          else {
            companiesData[i].statusText = "Offline";
            companiesData[i].statusTextStyle = "text-danger";
            companiesData[i].statusButtonStyle = "btn btn-secondary";
          }
        }

        var sidebarList = [
          { status: 1, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          // { status: 0, url: `/org/${req.params.orgID}/users`, icon: "public", text: `Global Users` },
        ];

        varName = "CCSI Door Access" //optional title override


        res.render('org', { companies: companiesData, sidebar: sidebarList, sideTitle: varName, navTitle: `${orgName} - Available Companies`, orgID: req.params.orgID });


      });

  } catch (err) {
    res.send("server error");
    console.log(err)

  } finally {
    //await db.close();
  }


});


/* GET users page. */
orgRouter.get('/:orgID/users', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {

    console.log('Pulling data from users db on global_users route');
    await db.query(

      `SELECT u.*, d.companyName, d.orgName, d.siteName
      FROM users u
        JOIN (
          SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
          FROM companies c
          JOIN (
            SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
            FROM sites sit
          ) s ON (c.id = s.company_id_sites)
        ) d ON (u.site_id_users = d.siteID) 
      ORDER BY last_name ASC`,

      function (err, result, fields) {

        if (err) {
          console.log(typeof (err));
          for (var k in err) {
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', {
            error: "Server Error", message: "Please try again", sidebar: [
              { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
          });
          // throw err
        };
        let userData = result;
        let orgName = userData[0].orgName;



        var sidebarList = [
          { status: 1, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          // { status: 1, url: `/org/${req.params.orgID}/users`, icon: "public", text: `Global Users` },
        ];

        varName = "CCSI Door Access"; //optional title override

        var panelTitleT;
        var panelSubtextT;

        if (userData.length) {
          if (userData.length === 1) {
            panelTitleT = `${userData.length} User at ${orgName}`;
          }
          else {
            panelTitleT = `${userData.length} Users at ${orgName}`;
          }
          panelSubtextT = "Please Select a User";
        }
        else {
          panelTitleT = `No Users at ${orgName}`;
          panelSubtextT = "Please Add a User";
        }

        res.render('org_users', { users: userData, sidebar: sidebarList, sideTitle: varName, navTitle: `${orgName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID });


      });

  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});

module.exports = orgRouter;