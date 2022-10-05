var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
const doorsRouter = asyncify(express.Router({mergeParams: true}));

 

/* GET doors page. */
doorsRouter.get('/', async function(req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

 var companyName;
 var siteName;
 var doorsList = [];

 try {
    

  console.log('Pulling data on site doors route');
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
      if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };


      orgName = result[0].orgName;
      companyName = result[0].companyName;
      siteName = result[0].siteName;


      for (let i = 0; i < result.length; i++) {
        let statusTextT = result[i].status;
        var statusTextStyleT;
        let alarmTextT = result[i].alarm;
        var alarmTextStyleT;
        
        if (statusTextT == "Unlocked") {
          statusTextStyleT = "text-success";
        }
        else if (statusTextT == "Locked") {
          statusTextStyleT = "text-danger";
        }
        else {
          statusTextStyleT = "text-danger";
        }

        if (alarmTextT == "OK") {
          alarmTextStyleT = "text-success";
        }
        else {
          alarmTextStyleT = "text-danger";
        }
        doorsList.push({ id: result[i].id, name: result[i].name, location: `${companyName} - ${siteName}`, ip: result[i].ip, statusText: statusTextT, statusTextStyle: statusTextStyleT, alarmText: alarmTextT, alarmTextStyle: alarmTextStyleT});

      }

      const funSites = await mySQLFun.getSites(db, req.params.companyID)

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`}
      ];
      for (i in funSites){
        if (funSites[i].id == req.params.siteID)
          {
            sidebarList.push({status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
          else 
          {
            sidebarList.push({status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
      }

      var tabBarList = [
      {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"}
      ]

      varName = "CCSI Door Access" //optional title override

      // console.log(funSites);
      res.render('doors', { doors: doorsList, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `${siteName} - Doors`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});

    });


}catch ( err ) {
  console.log(err)
} finally {
  //await db.close();
}
  
});


/* GET door_add page. */
doorsRouter.get('/add', async function(req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

 var companyName;
 var orgName;
 var siteName;
 var groupList = [];
 try {
   
   console.log('Pulling data from company db on doors route');
   await db.query(
     
    `
    SELECT
      dg.*,
      d.companyName,
      d.orgName,
      d.siteName

    FROM door_groups dg
    JOIN (
      SELECT
        c.id as id,
        c.name as companyName,
        c.org as orgName,
        s.id as siteID,
        s.name as siteName

      FROM companies c
      JOIN (
        SELECT
          sit.id as id,
          sit.name as name,
          sit.company_id_sites as company_id_sites

        FROM sites sit
      ) s ON (c.id = s.company_id_sites)
    ) d ON (dg.site_id_door_group = d.siteID)
    WHERE dg.site_id_door_group = ${req.params.siteID}
    ORDER BY name ASC`, 
     
     async function (err, result, fields) {
       if (err){ 
         console.log(typeof(err));
         for (var k in err){
           console.log(`${k}: ${err[k]}`);
         }
         res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
           {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
         // throw err
       };
       companyName = result[0].companyName;
       console.log(companyName);
       orgName = result[0].orgName;
       siteName = result[0].siteName;
       for (var i in result){
        groupList.push(result[i]);
       }
       console.log(groupList);

       const funSites = await mySQLFun.getSites(db, req.params.companyID)

       var sidebarList = [
         {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
         {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`}
       ];
       for (i in funSites){
         if (funSites[i].id == req.params.siteID)
          {
            sidebarList.push({status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
          else 
          {
            sidebarList.push({status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
       }
 
       var tabBarList = [
       {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
       {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
       {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
       {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"}
       ]
    
      var varName;
      varName = "CCSI Door Access" //optional title override
      res.render('doors_add', {groups: groupList, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Add Door`, panelSubtext: `Site - ${siteName}`,companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});
   });
 }catch ( err ) {
   console.log(err)
 } finally {
   //await db.close();
 }
 
});


/* POST new door to db. */
doorsRouter.post('/add', async function(req, res, next) {

  /* link to database */
  
  var db = req.app.get('db');
  
  // /* load data from database */
  
  console.log("POST Request Called");
  console.log(req.body);
  
  
  try {
      
    console.log('Posting data to doors table on new_door route');
    
    if (!req.body.name) { req.body.name = null};
    if (!req.body.ip) { req.body.ip = null};

    await db.query(
  
      `INSERT INTO doors
      VALUES (NULL, "${req.body.name}", "${req.body.ip}", "NEW", "NEW", ${req.params.siteID}, NULL)`,
  
      async function (err, result, fields) {
        if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };
        doorData = result;

        values = [];

        if (req.body.groups)
        {
          if (typeof req.body.groups === 'string')
          {
            values.push([null, result.insertId, req.body.groups]);
          }
          else
          {
            for (let i = 0; i < req.body.groups.length; i++) {
              if (result){
                values.push([null, result.insertId, req.body.groups[i]]);
              }
            }
          }
        }
          

        try {
      
          console.log('Posting data to door_group_list table on new_door route');
          console.log(values);
          if (values.length > 0){
            await db.query(
      
            `INSERT INTO door_group_list
            VALUES ?`, [values],
            function (err, result, fields) {
              if (err){ 
                console.log(typeof(err));
                for (var k in err){
                  console.log(`${k}: ${err[k]}`);
  
                }
                res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [{status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
                // throw err
              }
            });
          }
          res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors/${doorData.insertId}`);
      }catch ( err ) {
        res.send("server error");  
        console.log(err)
          
        } finally {
          //await db.close();
        }
  
      }
      );
      }catch ( err ) {
    res.send("server error");
    console.log(err)
    
  } finally {
    //await db.close();
  }
  
  
  });



/* GET door page. */
doorsRouter.get('/:doorID', async function(req, res, next) {


 /* link to database */

 var db = req.app.get('db');

 // /* load data from database */


try {

  console.log('Pulling data on doors edit GET route');
    await db.query(
      
      `SELECT
      u.*,
      d.companyName,
      d.orgName,
      d.siteName,
      GROUP_CONCAT ( DISTINCT d.groupNames ORDER BY d.groupNames SEPARATOR ', ' ) as groupNamesList,
      GROUP_CONCAT ( DISTINCT d.groupIDs ORDER BY d.groupNames SEPARATOR ', ' ) as groupIDsList,
      GROUP_CONCAT ( DISTINCT dgl.door_group_id_door_group_list ORDER BY dgl.id SEPARATOR ', ' ) as doorGroups

    FROM doors u
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

      ) d ON (u.site_id_doors = d.siteID)

      LEFT JOIN door_group_list dgl ON u.id = dgl.door_id_door_group_list
      WHERE u.id = ${req.params.doorID}
      GROUP BY u.id
      `,
      
      async function (err, result, fields) {
      if (err){ 
        console.log(typeof(err));
        for (var k in err){
          console.log(`${k}: ${err[k]}`);
        }
        res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
          {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
        // throw err
      };

      console.log(result);
      
      // let doorInfo = {id: result[0].id, name: result[0].name, ip: result[0].ip, status: result[0].status, alarm: result[0].alarm};
      let doorData = result[0];

      if (doorData.groupNamesList){
        doorData.allDoorGroupNames = doorData.groupNamesList.split(", ");
        doorData.allDoorGroupIds = doorData.groupIDsList.split(", ");
      }

      doorData.doorgroupIDs = [];

      if (doorData.doorGroups){
        if (doorData.doorGroups.length <= 1){
          doorData.doorgroupIDs = [`${doorData.doorGroups}`];
        }
        else {
          doorData.doorgroupIDs = doorData.doorGroups.split(", ");
        }
      }
      
      let groupings = []
      for (var i in doorData.allDoorGroupNames){
        groupings.push({name: doorData.allDoorGroupNames[i], id: doorData.allDoorGroupIds[i] });
      }
      doorData.groups = groupings;


      const funSites = await mySQLFun.getSites(db, req.params.companyID)

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${doorData.companyName}`}
      ];
      for (i in funSites){
        if (funSites[i].id == req.params.siteID)
          {
            sidebarList.push({status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
          else 
          {
            sidebarList.push({status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
      }

      var tabBarList = [
      {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"}
      ]
    
      var varName;

      console.log(doorData);
      varName = "CCSI Door Access" //optional title override
      res.render('door', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name}`, panelSubtext: `Site - ${doorData.siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});


    });
 
   // var doorsList = [
   //   { id: '1', name: "Front Door", location: "Synergy55", ip: "172.24.18.202", statusText: "Locked", statusTextStyle: "text-danger", alarmText: "OK", alarmTextStyle: "text-success"},
   //   { id: '2', name: "North Door", location: "Synergy55", ip: "172.24.18.203", statusText: "Unlocked", statusTextStyle: "text-success", alarmText: "OK", alarmTextStyle: "text-success"},
   //   { id: '3', name: "South Door", location: "Synergy55", ip: "172.24.18.204", statusText: "Open", statusTextStyle: "text-warning", alarmText: "TAMPER", alarmTextStyle: "text-danger"},
   //   { id: '4', name: "West Door", location: "Synergy55", ip: "172.24.18.205", statusText: "Locked", statusTextStyle: "text-danger", alarmText: "OK", alarmTextStyle: "text-success"},
   //   { id: '5', name: "East Door", location: "Synergy55", ip: "172.24.18.206", statusText: "Unlocked", statusTextStyle: "text-success", alarmText: "OK", alarmTextStyle: "text-success"},
   //   { id: '6', name: "IT Room Door", location: "Synergy55", ip: "172.24.18.207", statusText: "Open", statusTextStyle: "text-warning", alarmText: "OK", alarmTextStyle: "text-success"},
   // ];
 
 
  }catch ( err ) {
   console.log(err)
  } finally {
   //await db.close();
  }
 
});





/* GET door_edit page. */
doorsRouter.get('/:doorID/edit', async function(req, res, next) {


 /* link to database */

 var db = req.app.get('db');

 // /* load data from database */


try {

  console.log('Pulling data on doors edit GET route');
    await db.query(
      
      `SELECT
      u.*,
      d.companyName,
      d.orgName,
      d.siteName,
      GROUP_CONCAT ( DISTINCT d.groupNames ORDER BY d.groupNames SEPARATOR ', ' ) as groupNamesList,
      GROUP_CONCAT ( DISTINCT d.groupIDs ORDER BY d.groupNames SEPARATOR ', ' ) as groupIDsList,
      GROUP_CONCAT ( DISTINCT dgl.door_group_id_door_group_list ORDER BY dgl.id SEPARATOR ', ' ) as doorGroups

    FROM doors u
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

      ) d ON (u.site_id_doors = d.siteID)

      LEFT JOIN door_group_list dgl ON u.id = dgl.door_id_door_group_list
      WHERE u.id = ${req.params.doorID}
      GROUP BY u.id
      `,
      
      async function (err, result, fields) {
      if (err){ 
        console.log(typeof(err));
        for (var k in err){
          console.log(`${k}: ${err[k]}`);
        }
        res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
          {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
        // throw err
      };

      console.log(result);
      
      // let doorInfo = {id: result[0].id, name: result[0].name, ip: result[0].ip, status: result[0].status, alarm: result[0].alarm};
      let doorData = result[0];

      if (doorData.groupNamesList){
        doorData.allDoorGroupNames = doorData.groupNamesList.split(", ");
        doorData.allDoorGroupIds = doorData.groupIDsList.split(", ");
      }

      doorData.doorgroupIDs = [];

      if (doorData.doorGroups){
        if (doorData.doorGroups.length <= 1){
          doorData.doorgroupIDs = [`${doorData.doorGroups}`];
        }
        else {
          doorData.doorgroupIDs = doorData.doorGroups.split(", ");
        }
      }
      
      let groupings = []
      for (var i in doorData.allDoorGroupNames){
        groupings.push({name: doorData.allDoorGroupNames[i], id: doorData.allDoorGroupIds[i] });
      }
      doorData.groups = groupings;


      const funSites = await mySQLFun.getSites(db, req.params.companyID)

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${doorData.companyName}`}
      ];
      for (i in funSites){
        if (funSites[i].id == req.params.siteID)
          {
            sidebarList.push({status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
          else 
          {
            sidebarList.push({status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
      }

      var tabBarList = [
      {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"}
      ]
    
      var varName;

      console.log(doorData);
      varName = "CCSI Door Access" //optional title override
      res.render('door_edit', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name}`, panelSubtext: `Site - ${doorData.siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});


    });


}catch ( err ) {
  console.log(err)
} finally {
  //await db.close();
}

});


/* POST edited door to db. */
doorsRouter.post('/:doorID/edit', async function(req, res, next) {

  /* link to database */
  
  var db = req.app.get('db');
  
  // /* load data from database */
  
  console.log("POST Request Called");
  console.log(req.body);
  // res.send("posting");
  
  try {
      
    console.log('Posting data to users table on user edit POST route');
  
    if (!req.body.name) { req.body.name = null};
    if (!req.body.ip) { req.body.ip = null};

    await db.query(
  
      `UPDATE doors 
      SET 
        name = "${req.body.name}", 
        ip = "${req.body.ip}"
      WHERE id = ${req.params.doorID}`,
  
      async function (err, result, fields) {
        if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        }
  
        try {
      
          console.log('Deleting data from access_groups table on user edit route');
            await db.query(
            `DELETE FROM door_group_list WHERE door_id_door_group_list = ${req.params.doorID}`,
            async function (err, result, fields) {
              if (err){ 
                console.log(typeof(err));
                for (var k in err){
                  console.log(`${k}: ${err[k]}`);
                }
                res.render('error', { error: "Server ERROR", message: "Please try again", sidebar: [
                  {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
                // throw err
              }
  
              try {
                console.log('Posting data to door_group_list table on door edit route');
                let valuesString = ""
                console.log(req.body.groups);

                if (req.body.groups)
                {
                  if (typeof req.body.groups === 'string')
                  {
                    valuesString = `(NULL, ${req.params.doorID}, ${req.body.groups})`
                  }
                  else {
                    for (var i in req.body.groups){
                      console.log(i);
                      if (i == 0){ valuesString = `(NULL, ${req.params.doorID}, ${req.body.groups[i]})`}
                      else { valuesString = valuesString.concat(", ", `(NULL, ${req.params.doorID}, ${req.body.groups[i]})`)}
                    }
                  }
                


                  await db.query(
                  `INSERT INTO door_group_list
                  VALUES ${valuesString}`,
    
                  async function (err, result, fields) {
                    if (err){ 
                      console.log(typeof(err));
                      for (var k in err){
                        console.log(`${k}: ${err[k]}`);
                      }
                      res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [
                        {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
                      // throw err
                    }
                    res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors/${req.params.doorID}`);
                  });
                }
                }catch ( err ) {
                res.send("server error");
                console.log(err)
                
              } finally {
                //await db.close();
              }
            }
            
      
            );
          }catch ( err ) {
            res.send("server error");
            console.log(err)
            
          } finally {
            //await db.close();
          }
        });
      }catch ( err ) {
        res.send("server error");  
        console.log(err)
          
        } finally {
          //await db.close();
        }
    });



    /* GET door_edit page. */
doorsRouter.get('/:doorID/controls', async function(req, res, next) {


  /* link to database */
 
  var db = req.app.get('db');
 
  // /* load data from database */
 
 
 try {
 
   console.log('Pulling data on doors edit GET route');
     await db.query(
       
       `SELECT
       u.*,
       d.companyName,
       d.orgName,
       d.siteName
 
     FROM doors u
       JOIN (
         SELECT
           c.id as id,
           c.name as companyName,
           c.org as orgName,
           s.id as siteID,
           s.name as siteName
 
         FROM companies c
         JOIN (
           SELECT
             sit.id as id,
             sit.name as name,
             sit.company_id_sites as company_id_sites

           FROM sites sit
         ) s ON (c.id = s.company_id_sites)
 
       ) d ON (u.site_id_doors = d.siteID)
 
       WHERE u.id = ${req.params.doorID}
       GROUP BY u.id
       `,
       
       async function (err, result, fields) {
       if (err){ 
         console.log(typeof(err));
         for (var k in err){
           console.log(`${k}: ${err[k]}`);
         }
         res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
           {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
         // throw err
       };
 
       console.log(result);
       
       // let doorInfo = {id: result[0].id, name: result[0].name, ip: result[0].ip, status: result[0].status, alarm: result[0].alarm};
       let doorData = result[0];
  
 
      const funSites = await mySQLFun.getSites(db, req.params.companyID)

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`}
      ];
      for (i in funSites){
        if (funSites[i].id == req.params.siteID)
          {
            sidebarList.push({status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
          else 
          {
            sidebarList.push({status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}`});
          }
      }

      var tabBarList = [
      {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
      {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"}
      ]
       var varName;
 
       console.log(doorData);
       varName = "CCSI Door Access" //optional title override
       res.render('door_controls', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name} - Controls`, panelSubtext: `Door Control Panel`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});
 
 
     });
 
 
 }catch ( err ) {
   console.log(err)
 } finally {
   //await db.close();
 }
 
 });

module.exports = doorsRouter;
