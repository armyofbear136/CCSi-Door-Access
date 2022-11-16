var express = require('express');
const asyncify = require('express-asyncify');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const mySQLFun = require('../mySQL');
const APIfun = require('../myAPI');
const CSVfun = require('../myCSV');

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
          GROUP_CONCAT ( DISTINCT s.userID ORDER BY s.last_name SEPARATOR ', ' ) as userIDsList,
          GROUP_CONCAT ( DISTINCT s.fobID ORDER BY s.last_name SEPARATOR ', ' ) as userFOBsList

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
            dr.userID as userID,
            dr.fobID as fobID

          FROM sites sit
          JOIN (
            SELECT
              drs.site_id_doors as site_id_doors,
              drs.name as doorNames,
              drs.id as doorIDs,
              urs.first_name as first_name,
              urs.last_name as last_name,
              urs.userIDs as userID,
              urs.fobIDs as fobID

            FROM doors drs
            JOIN (
              SELECT
                u.first_name as first_name,
                u.last_name as last_name,
                u.id as userIDs,
                u.fob_id as fobIDs,
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
          let userFOBsArray = groupData.userFOBsList.split(", ");
          for (i in userNamesArray) {
            groupData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i], fob_id: userFOBsArray[i]});
          }
          console.log(groupData.allUsers);
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
reportsRouter.post('/', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  console.log(req.body);

  var siteReport = false;
  var doorsReport = false;
  var usersReport = false;

  if (req.body.sitedoorgroups && req.body.siteusergroups){siteReport = true;}
  if (req.body.dooronlygroups){doorsReport = true;}
  if (req.body.useronlygroups){usersReport = true;}

  var reportTitle;

  var doorsData;
  var usersData;
  var companyName;
  var siteName;

  let doorObjects = {};
  let userObjects = {};

  // /* load data from database */

  
  let siteInfo = await mySQLFun.getSiteInfo(db, req.params.siteID);
  companyName = siteInfo[0].companyName;
  siteName = siteInfo[0].name;
  reportTitle = siteName + '_' + Date.now();

  const response = await APIfun.digestor('http://10.0.1.246/vapix/eventlogger/FetchEvents', 'root', 'pass', {});
  let parsedAllEvents = await APIfun.axisParseAllEvents(response.Event);
  let parsedLastEvents = await APIfun.axisParseLastEvents(response.Event);
  // for (i in parsedAllEvents){
  //   await CSVfun.generate((i + '_' + Date.now() + '.csv'), parsedAllEvents[i]);
  // }

  console.log('Posting data to door_groups table on groups_add route');


  if (!req.body.name) { req.body.name = 'Null' };
  if (!req.body.stime) { req.body.stime = "00:00:00" };
  if (!req.body.sdate) { req.body.sdate = "2022-01-01" };
  if (!req.body.etime) { req.body.etime = "23:59:59" };
  if (!req.body.edate) { req.body.edate = "2022-12-25" };

  let startDT = new Date(req.body.sdate + ':' + req.body.stime);
  let endDT = new Date(req.body.edate + ':' + req.body.etime);

  //generate csv for selected doors in timeframe

  doorsData = await mySQLFun.getDoorsInfo(db, req.params.siteID);

  if (doorsReport){


    for (i in doorsData){
      doorObjects[doorsData[i].name] = {};
      for (o in doorsData[i]){
        doorObjects[doorsData[i].name][o] = doorsData[i][o];
      }
    }

    if (typeof req.body.dooronlygroups == 'string'){req.body.dooronlygroups = [req.body.dooronlygroups]};
    let selectedDoorEvents = [
      [
        "doorname",
        "doorevent",
        "doorstatus",
        "access_time",
        "id",
        "name",
        "ip",
        "status",
        "alarm",
        "site_id_doors",
        "tamper",
        "companyName",
        "orgName",
        "siteName"
      ]
    ];
    // console.log(parsedAllEvents)
    // var doorEvent;
    for (i in req.body.dooronlygroups)
    {
      for (e in parsedAllEvents.door_events)
      {
        let doorEvent = parsedAllEvents.door_events[e];
        // console.log(doorEvent);
        if ((doorEvent[0] == req.body.dooronlygroups[i]) && (new Date(doorEvent[3]) > (startDT)) && (new Date(doorEvent[3]) < (endDT)))
        {
          for (o in doorObjects[doorEvent[0]]){
            doorEvent.push(doorObjects[doorEvent[0]][o]);
          }
          selectedDoorEvents.push(doorEvent);
        }

      }

    }
    
    // console.log(selectedDoorEvents);
    await CSVfun.generate((reportTitle + '/' + req.body.name + '_' + 'Doors_' + Date.now() + '.csv'), selectedDoorEvents);
  }

  //generate csv for selected users in timeframe

  usersData = await mySQLFun.getUsersInfo(db, req.params.siteID);

  if (usersReport){

      // usersData = await mySQLFun.getUsersInfo(req.params.siteID);
          for (i in usersData){
            userObjects[usersData[i].fob_id] = {};
            for (o in usersData[i]){
              userObjects[usersData[i].fob_id][o] = usersData[i][o];
            }
          }
        
    if (typeof req.body.useronlygroups == 'string'){req.body.useronlygroups = [req.body.useronlygroups]};
    let selectedUserEvents = [
      [
        "cardraw",
        "cardnr",
        "access_time",
        "id",
        "first_name",
        "last_name",
        "email",
        "fob_id",
        "company_id_users",
        "site_id_users",
        "employee_id",
        "fob_raw",
        "last_access",
        "companyName",
        "orgName",
        "siteName",
        "doorgroups"
      ]
    ];
    // console.log(parsedAllEvents)
    for (i in req.body.useronlygroups)
    {
      for (e in parsedAllEvents.card_events)
      {
        let cardEvent = parsedAllEvents.card_events[e];
        if ((cardEvent[1] == req.body.useronlygroups[i]) && (new Date(cardEvent[2]) > (startDT)) && (new Date(cardEvent[2]) < (endDT)))
        {
          for (o in userObjects[cardEvent[1]]){
            cardEvent.push(userObjects[cardEvent[1]][o]);
          }
          selectedUserEvents.push(cardEvent);
        }
      }
    }
    // console.log(selectedUserEvents);
    console.log('generating user report');
    await CSVfun.generate((reportTitle + '/' + req.body.name + '_' + 'Users_' + Date.now() + '.csv'), selectedUserEvents);
  }
  // res.download('./csv_export/'+userFileName);


  //updates db with most recent statuses

  try {

    for (i in parsedLastEvents.Doors){
      let tampered = 0;
      if (parsedLastEvents.Doors[i]['Door Tamper'] != 'NotInTamper'){tampered = 1;}
      await db.query(

        `UPDATE doors 
        SET 
        status = '${parsedLastEvents.Doors[i]['Door Mode']}', 
        alarm = '${parsedLastEvents.Doors[i]['Door Alarm']}', 
        last_access = "${parsedLastEvents.Doors[i].Accessed}", 
        tamper = '${tampered}'
        WHERE site_id_doors = ${req.params.siteID} AND name = '${i}'`,

        async function (err, result, fields) {
          if (err) {
            console.log(typeof (err));
            for (var k in err) {
              console.log(`${k}: ${err[k]}`);
            }
            res.render('error', {
              error: "Duplicate ID detected", message: "Please try again", sidebar: [
                { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
            });
            // throw err
          }
        }
      )
    }
  }catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

    try {

      for (i in parsedLastEvents.Fobs){
        await db.query(
  
          `UPDATE users 
          SET 
          last_access = "${parsedLastEvents.Fobs[i].Accessed}"
          WHERE site_id_users = ${req.params.siteID} AND fob_id = ${parsedLastEvents.Fobs[i].CardNr}`,
  
          async function (err, result, fields) {
            if (err) {
              console.log(typeof (err));
              for (var k in err) {
                console.log(`${k}: ${err[k]}`);
              }
              res.render('error', {
                error: "Duplicate ID detected", message: "Please try again", sidebar: [
                  { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
              });
              // throw err
            }
          }
        )
      }
    }catch (err) {
      console.log(err)
    } finally {
      //await db.close();
    }
    console.log(reportTitle);
    res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports/download/${reportTitle}`);

});

reportsRouter.get('/download/:filename', async (req, res)=>{
  console.log('downloading');

  await emptyDir('./csv_export/archives/');

  await zipDirectory('./csv_export/generated/' + req.params.filename, './csv_export/archives/' + req.params.filename + '.zip');

  // await emptyDir('./csv_export/generated/');

  res.download('./csv_export/archives/' + req.params.filename + '.zip', (err)=>{
    console.log(err);
  });

  // res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`)

});

function zipDirectory(sourceDir, outPath) {
  const archive = archiver('zip', { zlib: { level: 9 }});
  const stream = fs.createWriteStream(outPath);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(stream)
    ;

    stream.on('close', () => resolve());
    archive.finalize();
  });
}

function emptyDir(dirPath) {
  const dirContents = fs.readdirSync(dirPath); // List dir content
  return new Promise((resolve, reject) => {
    for (const fileOrDirPath of dirContents) {
      try {
        // Get Full path
        const fullPath = path.join(dirPath, fileOrDirPath);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // It's a sub directory
          if (fs.readdirSync(fullPath).length) emptyDir(fullPath);
          // If the dir is not empty then remove it's contents too(recursively)
          fs.rmdirSync(fullPath);
        } else fs.unlinkSync(fullPath); // It's a file
      } catch (ex) {
        reject(console.error(ex.message));
      }
    }
    resolve(true);
  });
}

module.exports = reportsRouter;