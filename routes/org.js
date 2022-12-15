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
            panelTitleT = `${userData.length} Global User`;
          }
          else {
            panelTitleT = `${userData.length} Global Users`;
          }
          panelSubtextT = "Please Select a User";
        }
        else {
          panelTitleT = `No Global Users`;
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

/* GET users page. */
orgRouter.get('/:orgID/useraccount', async function (req, res, next) {

  console.log("hitting user route");

  req.params.companyID = 4;
  req.params.siteID = 7;
  req.params.userID = 162;



  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {
    // GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as "doorgroups",

    console.log('Pulling user data from tables on userID route');
    await db.query(

      `SELECT
      u.*,
      d.companyName,
      d.orgName,
      d.siteName,
      GROUP_CONCAT ( DISTINCT d.groupNames ORDER BY d.groupNames SEPARATOR ', ' ) as groupNamesList,
      GROUP_CONCAT ( DISTINCT d.groupIDs ORDER BY d.groupNames SEPARATOR ', ' ) as groupIDsList,
      GROUP_CONCAT ( DISTINCT ag.group_id ORDER BY ag.id SEPARATOR ', ' ) as userGroups

    FROM users u
      JOIN (
        SELECT
          c.id as id,
          c.name as companyName,
          c.org as orgName,
          s.id as siteID,
          s.name as siteName,
          s.groupNames,
          s.groupIDs

        FROM companies c
        JOIN (
          SELECT
            sit.id as id,
            sit.name as name,
            sit.company_id_sites as company_id_sites,
            dg.groupNames as groupNames,
            dg.groupIDs as groupIDs

          FROM sites sit
          JOIN (
            SELECT
              dgs.site_id_door_group as site_id_door_group,
              dgs.name as groupNames,
              dgs.id as groupIDs

            FROM door_groups dgs
           

          ) dg ON (sit.id = dg.site_id_door_group)

        ) s ON (c.id = s.company_id_sites)

      ) d ON (u.site_id_users = d.siteID)

      LEFT JOIN access_groups ag ON u.id = ag.user_id
      WHERE u.id = ${req.params.userID}
      GROUP BY u.id
      `,



      async function (err, result, fields) {
        let userData = result[0];

        if (userData.groupNamesList) {
          userData.allDoorGroupNames = userData.groupNamesList.split(", ");
          userData.allDoorGroupIds = userData.groupIDsList.split(", ");
        }
        userData.doorgroupIDs = [];
        if (userData.userGroups) {
          if (userData.userGroups.length <= 1) {
            userData.doorgroupIDs = [`${userData.userGroups}`];
          }
          else {
            userData.doorgroupIDs = userData.userGroups.split(", ");
          }
        }

        let groupings = []
        for (var i in userData.allDoorGroupNames) {
          groupings.push({ name: userData.allDoorGroupNames[i], id: userData.allDoorGroupIds[i] });
        }
        userData.groups = groupings;


        if (err) {
          console.log(typeof (err));
          for (var k in err) {
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
          // throw err
        };

        const funSites = await mySQLFun.getSites(db, req.params.companyID)

        var sidebarList = [
          { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${userData.companyName}` }
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ];

        var panelTitleT = `${userData.last_name}, ${userData.first_name} - ${userData.employee_id}`;
        var panelSubtextT = "User Info";
        var varName = "CCSI DOOR ACCESS"

        res.render('user', { user: userData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: `${varName}`, navTitle: `${userData.companyName} - ${userData.siteName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID, thisURL: req.originalUrl });


      });
  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }
});

module.exports = orgRouter;