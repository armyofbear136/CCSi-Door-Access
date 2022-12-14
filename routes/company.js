var express = require('express');
const asyncify = require('express-asyncify');
const SQLfun = require('../mySQL');
const mySQLFun = require('../mySQL');
const companyRouter = asyncify(express.Router({ mergeParams: true }));


const siteRouter = require('./site');

companyRouter.use('/:companyID/site', siteRouter);



/* GET company page. */
companyRouter.get('/:companyID', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */
  try {

    console.log('Pulling data from sites db on company route');
    await db.query(

      ` SELECT si.*, d.companyName, d.orgName
      FROM sites si
      JOIN (
        SELECT c.id as id, c.name as companyName, c.org as orgName
        FROM companies c
      ) d ON (si.company_id_sites = d.id)
      WHERE si.company_id_sites = ${req.params.companyID}
      ORDER BY name ASC`,

      async function (err, result, fields) {
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
        let siteList = result;
        let companyName = siteList[0].companyName;

        for (i in siteList) {
          if (result[i].status) {
            siteList[i].statusText = "Online";
            siteList[i].statusTextStyle = "text-success";
            siteList[i].statusButtonStyle = "btn btn-primary";
          }
          else {
            siteList[i].statusText = "Offline";
            siteList[i].statusTextStyle = "text-danger";
            siteList[i].statusButtonStyle = "btn btn-secondary";
          }
        }

        // /* data packaging for ejs */


        var sidebarList = [
          { status: 0, url: `/org/${req.params.companyID}`, icon: "home", text: "Home", justText: "text-left" },
          { status: 1, url: `/org/${req.params.companyID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`, justText: "text-left" },
          // { status: 0, url: `/org/${req.params.companyID}/company/${req.params.companyID}/users`, icon: "people_alt", text: `Company Users`, justText: "text-right" },
        ];

        varName = "CCSI Door Access" //optional title override

        res.render('company', { sites: siteList, sidebar: sidebarList, sideTitle: varName, navTitle: `${companyName}`, orgID: req.params.orgID, companyID: req.params.companyID, thisURL: req.originalUrl });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* GET company users page. */
companyRouter.get('/:companyID/users', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data from users db on company_users route');
    await db.query(


      `SELECT u.*, d.companyName, d.orgName, d.siteName,
    GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as doorgroups
    FROM users u
      LEFT JOIN access_groups ag ON u.id = ag.user_id
      LEFT JOIN door_groups dg ON ag.group_id = dg.id
      JOIN (
        SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
        FROM companies c
        JOIN (
          SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
          FROM sites sit
        ) s ON (c.id = s.company_id_sites)
      ) d ON (u.site_id_users = d.siteID)
    WHERE u.company_id_users = ${req.params.companyID} 
    GROUP BY u.id
    ORDER BY last_name ASC`,


      async function (err, result, fields) {
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

        let usersData = result;
        var companyName;

        var panelTitleT;
        var panelSubtextT;

        if (usersData.length) {
          companyName = usersData[0].companyName;
          if (usersData.length === 1) {
            panelTitleT = `${usersData.length} User at ${companyName}`;
          }
          else {
            panelTitleT = `${usersData.length} Users at ${companyName}`;
          }
          panelSubtextT = "Please Select a User";
        }
        else {
          let company = await mySQLFun.getCompanyInfo(db, req.params.companyID);
          companyName = company[0].name;
          
          panelTitleT = `No Users at ${companyName}`;
          panelSubtextT = "Please Add a User";
          
        }

        var sidebarList = [
          { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home", justText: "text-left" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`, justText: "text-left" },
          // { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/users`, icon: "people_alt", text: `Company Users`, justText: "text-center" }
        ];


        varName = "CCSI Door Access"; //optional title override

        

        res.render('company_users', { users: usersData, sidebar: sidebarList, sideTitle: varName, navTitle: `${companyName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID, companyID: req.params.companyID });


      });

  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});

module.exports = companyRouter;