var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
var reportsRouter = asyncify(express.Router({ mergeParams: true }));





/* GET home page. */
reportsRouter.get('/', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data from door_groups table on reports route');
    await db.query(



      `SELECT
          c.id as id,
          c.name as companyName,
          c.org as orgName,
          s.id as siteID,
          s.name as siteName,
          GROUP_CONCAT ( DISTINCT s.doorNames ORDER BY s.doorNames SEPARATOR ', ' ) as doorNamesList,
          GROUP_CONCAT ( DISTINCT s.doorIDs ORDER BY s.doorNames SEPARATOR ', ' ) as doorIDsList,
          GROUP_CONCAT ( DISTINCT s.first_name, " ",s.last_name ORDER BY s.last_name SEPARATOR ', ' ) as userFullNamesList,
          GROUP_CONCAT ( DISTINCT s.userID ORDER BY s.last_name SEPARATOR ', ' ) as userIDsList

        FROM companies c
        JOIN (
          SELECT
            sit.id as id,
            sit.name as name,
            sit.company_id_sites as company_id_sites,
            dr.doorNames as doorNames,
            dr.doorIDs as doorIDs,
            dr.first_name as first_name,
            dr.last_name as last_name,
            dr.userID as userID

          FROM sites sit
          JOIN (
            SELECT
              drs.site_id_doors as site_id_doors,
              drs.name as doorNames,
              drs.id as doorIDs,
              urs.first_name as first_name,
              urs.last_name as last_name,
              urs.userIDs as userID

            FROM doors drs
            JOIN (
              SELECT
                u.first_name as first_name,
                u.last_name as last_name,
                u.id as userIDs,
                u.site_id_users as site_id_users

              FROM users u

            ) urs ON (drs.site_id_doors = urs.site_id_users)

          ) dr ON (sit.id = dr.site_id_doors)

        ) s ON (c.id = s.company_id_sites)
 

        WHERE s.id = ${req.params.siteID}
        GROUP BY s.id
        `,

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

        let groupData = result[0];
        groupData.allDoors = [];
        groupData.allUsers = [];

        if (groupData.doorNamesList) {
          let doorNamesArray = groupData.doorNamesList.split(", ");
          let doorIDsArray = groupData.doorIDsList.split(", ");

          groupData.allDoors = [];
          for (i in doorNamesArray) {
            groupData.allDoors.push({ name: doorNamesArray[i], id: doorIDsArray[i] });
          }
        }

        if (groupData.userFullNamesList) {
          let userNamesArray = groupData.userFullNamesList.split(", ");
          let userIDsArray = groupData.userIDsList.split(", ");
          for (i in userNamesArray) {
            groupData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i] });
          }
        }

        let companyName = groupData.companyName;
        let siteName = groupData.siteName;

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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override


        res.render('reports', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Door Access Reporting`, panelSubtext: "Select parameters for report", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });

  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});


/* POST new group to db. */
reportsRouter.post('/add', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  console.log(req.body);



  try {

    console.log('Posting data to door_groups table on groups_add route');


    if (!req.body.name) { req.body.name = null };
    if (!req.body.stime) { req.body.stime = "07:00:00" };
    if (!req.body.sdate) { req.body.sdate = "01/01/2022" };
    if (!req.body.etime) { req.body.etime = "17:00:00" };
    if (!req.body.edate) { req.body.edate = "12/25/2022" };

    var groupID;

   
  } catch (err) {
    res.send("server error");
    console.log(err)
  } finally {
    //await db.close();
  }
});

module.exports = reportsRouter;