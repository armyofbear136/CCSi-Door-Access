require('../mySQL');

var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
const siteRouter = asyncify(express.Router({ mergeParams: true }));


const doorsRouter = require('./doors');
const usersRouter = require('./users');
const groupsRouter = require('./groups');



siteRouter.use('/:siteID/doors', doorsRouter);

siteRouter.use('/:siteID/users', usersRouter);


siteRouter.use('/:siteID/groups', groupsRouter);



siteRouter.get('/', async function (req, res, next) {

  console.log('hitting /  route on sites');

});

/* GET site page. */
siteRouter.get('/:siteID', async function (req, res, next) {


  // /* link to database */

  // var db = req.app.get('db');

  // // /* load data from database */

  // try {

  //   console.log('Pulling data from sites db on site route');
  //   await db.query(

  //     ` SELECT si.name, d.companyName, d.orgName
  //     FROM sites si
  //     JOIN (
  //       SELECT c.id as id, c.name as companyName, c.org as orgName
  //       FROM companies c
  //     ) d ON (si.company_id_sites = d.id)
  //     WHERE si.id = ${req.params.siteID}
  //     ORDER BY name ASC`,

  //     async function (err, result, fields) {
  //       if (err) {
  //         console.log(typeof (err));
  //         for (var k in err) {
  //           console.log(`${k}: ${err[k]}`);
  //         }
  //         res.render('error', {
  //           error: "Server Error", message: "Please try again", sidebar: [
  //             { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
  //         });
  //         // throw err
  //       };
  //       let siteData = result[0];
  //       let siteName = siteData.name;
  //       let companyName = siteData.companyName;


  //       const funSites = await mySQLFun.getSites(db, req.params.companyID)

  //       var sidebarList = [
  //         { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
  //         { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}` }
  //       ];
  //       for (i in funSites) {
  //         if (funSites[i].id == req.params.siteID) {
  //           sidebarList.push({ status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
  //         }
  //         else {
  //           sidebarList.push({ status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
  //         }
  //       }

  //       var tabBarList = [
  //         { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
  //         { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
  //         { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
  //         { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
  //       ];




  //       orgName = "CCSI Door Access" //optional title override      

  //       res.render('site', { sidebar: sidebarList, sideTitle: orgName, tabBar: tabBarList, navTitle: `${companyName} - ${siteName}`, panelTitle: `${siteName}` });


  //     });

  
  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {


    console.log('Pulling data on site route');
    await db.query(
      ` SELECT ds.*, d.companyName, d.orgName, d.siteName
      FROM doors ds
      JOIN (
        SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
        FROM companies c
        JOIN (
          SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
          FROM sites sit
        ) s ON (c.id = s.company_id_sites)
      ) d ON (ds.site_id_doors = d.siteID)
      WHERE ds.site_id_doors = ${req.params.siteID}
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

        let doorsData = result;
        var companyName;
        var siteName;

        if (doorsData.length)
        {
          companyName = doorsData[0].companyName;
          siteName = doorsData[0].siteName;
        }
        else
        {
          let siteInfo = await mySQLFun.getSiteInfo(db, req.params.siteID);
          companyName = siteInfo[0].companyName;
          siteName = siteInfo[0].name;
        }


        


        for (i in doorsData) {
          if (doorsData[i].status == "Unlocked") {
            doorsData[i].statusTextStyle = "text-success";
          }
          else if (doorsData[i].status == "Locked") {
            doorsData[i].statusTextStyle = "text-danger";
          }
          else {
            doorsData[i].statusTextStyle = "text-danger";
          }

          if (doorsData[i].alarm == "OK") {
            doorsData[i].alarmTextStyle = "text-success";
          }
          else {
            doorsData[i].alarmTextStyle = "text-danger";
          }
        }

        const funSites = await mySQLFun.getSites(db, req.params.companyID)

        var sidebarList = [
          { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}` }
        ];
        for (i in funSites) {
          if (funSites[i].id == req.params.siteID) {
            sidebarList.push({ status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
          }
          else {
            sidebarList.push({ status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
          }
        }

        var tabBarList = [
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ]

        varName = "CCSI Door Access" //optional title override

        // console.log(funSites);
        res.render('site', { doors: doorsData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `${siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID, thisURL: req.originalUrl });

      });
  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }





});

module.exports = siteRouter;