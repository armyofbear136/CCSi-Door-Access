var express = require('express');
const asyncify = require('express-asyncify');
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const mySQLFun = require('../mySQL');
const APIfun = require('../myAPI');
const CSVfun = require('../myCSV');
const { report } = require('process');

var eventsRouter = asyncify(express.Router({ mergeParams: true }));





/* GET home page. */
eventsRouter.get('/', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("GET Request Called");


  let doorsReport = true;

  var reportTitle;

  var doorsData;
  var usersData;
  var companyName;
  var siteName;

  let doorObjects = {};


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


  // if (!req.body.name) { req.body.name = 'Null' };
  // if (!req.body.stime) { req.body.stime = "00:00:00" };
  // if (!req.body.sdate) { req.body.sdate = "2022-01-01" };
  // if (!req.body.etime) { req.body.etime = "23:59:59" };
  // if (!req.body.edate) { req.body.edate = "2022-12-25" };

  // let startDT = new Date(req.body.sdate + ':' + req.body.stime);
  // let endDT = new Date(req.body.edate + ':' + req.body.etime);

  //generate csv for selected doors in timeframe

  doorsData = await mySQLFun.getDoorsInfoSimple(db, req.params.siteID);
  usersData = await mySQLFun.getUsersInfo(db, req.params.siteID);

  if (doorsReport){


    for (i in doorsData){
      doorObjects[doorsData[i].name] = {};
      for (o in doorsData[i]){
        doorObjects[doorsData[i].name][o] = doorsData[i][o];
      }
    }

    let doorEventLabels = [
      "Door Name",
      "Door Event",
      "Door Status",
      "Access Time",
      "ID",
      "Name",
      "IP",
      "Status",
      "Alarm",
      "Site ID",
      "Last Access",
      "Tamper",
      "Reader"
    ];

    let selectedDoorEvents = [];
    // console.log(parsedAllEvents)
    // var doorEvent;
      for (e in parsedAllEvents.door_events)
      {
        let doorEvent = parsedAllEvents.door_events[e];
        // console.log(doorEvent);

          for (o in doorObjects[doorEvent[0]]){
            doorEvent.push(doorObjects[doorEvent[0]][o]);
          }
          selectedDoorEvents.push(doorEvent);

      }

    

    // console.log(selectedDoorEvents);
    // await CSVfun.generate((reportTitle + '/' + req.body.name + '_' + 'DoorEvents_' + Date.now() + '.csv'), selectedDoorEvents);
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
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        
        selectedDoorEvents.shift(); //weird first array with extra parameters>?? shifting off
        res.render('events', { events: selectedDoorEvents, eventLabels: doorEventLabels, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Event Log ${reportTitle}`, panelSubtext: "Showing last 1000 Events", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID,  thisURL: req.originalUrl });
  }


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
    // res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports/download/${reportTitle}`);

});

/* GET home page. */
eventsRouter.get('/download', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("GET Request Called");


  let doorsReport = true;

  var reportTitle;

  var doorsData;
  var usersData;
  var companyName;
  var siteName;

  let doorObjects = {};


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


  // if (!req.body.name) { req.body.name = 'Null' };
  // if (!req.body.stime) { req.body.stime = "00:00:00" };
  // if (!req.body.sdate) { req.body.sdate = "2022-01-01" };
  // if (!req.body.etime) { req.body.etime = "23:59:59" };
  // if (!req.body.edate) { req.body.edate = "2022-12-25" };

  // let startDT = new Date(req.body.sdate + ':' + req.body.stime);
  // let endDT = new Date(req.body.edate + ':' + req.body.etime);

  //generate csv for selected doors in timeframe

  doorsData = await mySQLFun.getDoorsInfoSimple(db, req.params.siteID);
  usersData = await mySQLFun.getUsersInfo(db, req.params.siteID);

  if (doorsReport){


    for (i in doorsData){
      doorObjects[doorsData[i].name] = {};
      for (o in doorsData[i]){
        doorObjects[doorsData[i].name][o] = doorsData[i][o];
      }
    }

    let doorEventLabels = [
      "Door Name",
      "Door Event",
      "Door Status",
      "Access Time",
      "ID",
      "Name",
      "IP",
      "Status",
      "Alarm",
      "Site ID",
      "Last Access",
      "Tamper",
      "Reader"
    ];

    let selectedDoorEvents = [];
    // console.log(parsedAllEvents)
    // var doorEvent;
      for (e in parsedAllEvents.door_events)
      {
        let doorEvent = parsedAllEvents.door_events[e];
        // console.log(doorEvent);

          for (o in doorObjects[doorEvent[0]]){
            doorEvent.push(doorObjects[doorEvent[0]][o]);
          }
          selectedDoorEvents.push(doorEvent);

      }

    

    // console.log(selectedDoorEvents);
    // await CSVfun.generate((reportTitle + '/' + req.body.name + '_' + 'DoorEvents_' + Date.now() + '.csv'), selectedDoorEvents);
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
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        
        selectedDoorEvents.shift(); //weird first array with extra parameters>?? shifting off
        doorEventsForCSV = [];
        doorEventsForCSV.push(doorEventLabels);
        selectedDoorEvents.forEach(function(event) {
          doorEventsForCSV.push(event);
        });

        console.log("generating csv");
        await CSVfun.generate((reportTitle + '/' + siteName + '_' + 'DoorAccess_' + Date.now() + '.csv'), doorEventsForCSV);
        console.log("csv generated");
        // res.render('events', { events: selectedDoorEvents, eventLabels: doorEventLabels, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Event Log ${reportTitle}`, panelSubtext: "Showing last 1000 Events", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });

  }


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
    res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events/download/${reportTitle}`);

});



eventsRouter.get('/download/:filename', async (req, res)=>{
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

module.exports = eventsRouter;