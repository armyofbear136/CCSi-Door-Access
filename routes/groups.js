var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
const groupsRouter = asyncify(express.Router({ mergeParams: true }));




/* GET access groups page. */
groupsRouter.get('/', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data from door_groups table on groups route');
    await db.query(

      ` SELECT dg.*, d.companyName, d.orgName, d.siteName
      FROM door_groups dg
      JOIN (
        SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
        FROM companies c
        JOIN (
          SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
          FROM sites sit
        ) s ON (c.id = s.company_id_sites)
      ) d ON (dg.site_id_door_group = d.siteID)
      WHERE dg.site_id_door_group = ${req.params.siteID}
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

        let groupsData = result;
        let companyName = groupsData[0].companyName;
        let siteName = groupsData[0].siteName;

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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ]

        var varName;
        varName = "CCSI Door Access" //optional title override

        // console.log(funSites);

        res.render('groups', { groups: groupsData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `${siteName} - Groups`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});



/* GET access group add page. */
groupsRouter.get('/add', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data from door_groups table on group route');
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

        console.log(result);

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

        console.log(groupData);
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override


        res.render('groups_add', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Add Group`, panelSubtext: "Please add some Doors and Users", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });

  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* POST new group to db. */
groupsRouter.post('/add', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  console.log(req.body);



  try {

    console.log('Posting data to door_groups table on groups_add route');


    if (!req.body.name) { req.body.name = null };
    if (!req.body.stime) { req.body.stime = "07:00:00" };
    if (!req.body.etime) { req.body.etime = "17:00:00" };

    var groupID;

    await db.query(

      `INSERT INTO door_groups
      VALUES (NULL, "${req.body.name}", ${req.params.siteID}, "${req.body.stime}", "${req.body.etime}", NULL)`,

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
        };

        console.log(result);

        groupID = result.insertId;

        var doorValues = [];
        var userValues = [];

        if (req.body.doorgroups) {
          if (typeof req.body.doorgroups === 'string') {
            doorValues.push([null, req.body.doorgroups, groupID]);
          }
          else {
            for (let i = 0; i < req.body.doorgroups.length; i++) {
              if (result) {
                doorValues.push([null, req.body.doorgroups[i], groupID]);
              }
            }
          }
        }

        if (req.body.usergroups) {
          if (typeof req.body.usergroups === 'string') {
            userValues.push([null, groupID, req.body.usergroups]);
          }
          else {
            for (let i = 0; i < req.body.usergroups.length; i++) {
              if (result) {
                userValues.push([null, groupID, req.body.usergroups[i]]);
              }
            }
          }
        }

        try {

          console.log('Posting data to door_group_list table on groups_add route');
          console.log(doorValues);
          if (doorValues.length > 0) {
            await db.query(

              `INSERT INTO door_group_list
            VALUES ?`, [doorValues],
              function (err, result, fields) {
                if (err) {
                  console.log(typeof (err));
                  for (var k in err) {
                    console.log(`${k}: ${err[k]}`);

                  }
                  res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
                  // throw err
                }
              }

            );
          }
        } catch (err) {
          res.send("server error");
          console.log(err)

        } finally {
          //await db.close();
        }

        try {

          console.log('Posting data to access_groups table on groups_add route');
          console.log(userValues);
          if (userValues.length > 0) {
            await db.query(

              `INSERT INTO access_groups
            VALUES ?`, [userValues],
              function (err, result, fields) {
                if (err) {
                  console.log(typeof (err));
                  for (var k in err) {
                    console.log(`${k}: ${err[k]}`);

                  }
                  res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
                  // throw err
                }
              }

            );
          }
        } catch (err) {
          res.send("server error");
          console.log(err)

        } finally {
          //await db.close();
        }

        res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups/${groupID}`);
      });


  } catch (err) {
    res.send("server error");
    console.log(err)
  } finally {
    //await db.close();
  }


});


/* GET access group page. */
groupsRouter.get('/:groupID', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {

    console.log('Pulling data from door_groups table on group route');
    //  GROUP_CONCAT ( DISTINCT d.doorNames ORDER BY d.doorNames SEPARATOR ', ' ) as doorNamesList,
    // GROUP_CONCAT ( DISTINCT d.doorIDs ORDER BY d.doorNames SEPARATOR ', ' ) as doorIDsList,
    await db.query(



      `SELECT
      dg.*,
      d.companyName,
      d.orgName,
      d.siteName,
      GROUP_CONCAT ( DISTINCT d.doorNames, "~",d.doorIDs ORDER BY d.doorNames SEPARATOR ', ' ) as doorNameIDList,
      GROUP_CONCAT ( DISTINCT dgl.door_id_door_group_list ORDER BY dgl.id SEPARATOR ', ' ) as groupDoors,
      GROUP_CONCAT ( DISTINCT d.first_name, " ",d.last_name ORDER BY d.last_name SEPARATOR ', ' ) as userFullNamesList,
      GROUP_CONCAT ( DISTINCT d.userID ORDER BY d.last_name SEPARATOR ', ' ) as userIDsList,
      GROUP_CONCAT ( DISTINCT ag.user_id ORDER BY ag.id SEPARATOR ', ' ) as groupUsers


      FROM door_groups dg
        JOIN (
          SELECT
            c.id as id,
            c.name as companyName,
            c.org as orgName,
            s.id as siteID,
            s.name as siteName,
            s.doorNames,
            s.doorIDs,
            s.first_name,
            s.last_name,
            s.userID

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

        ) d ON (dg.site_id_door_group = d.siteID)

        LEFT JOIN door_group_list dgl ON dg.id = dgl.door_group_id_door_group_list
        LEFT JOIN access_groups ag ON dg.id = ag.group_id
        WHERE dg.id = ${req.params.groupID}
        GROUP BY dg.id
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

        console.log(result);

        let groupData = result[0];
        groupData.allDoors = [];
        groupData.allUsers = [];

        if (groupData.doorNameIDList) {
          let doorNameIDArray = groupData.doorNameIDList.split(", ");
          for (i in doorNameIDArray) {
            let doorNameAndID = doorNameIDArray[i].split("~");
            console.log(doorNameAndID);
            groupData.allDoors.push({ name: doorNameAndID[0], id: doorNameAndID[1] });
          }
        }

        if (groupData.userFullNamesList) {
          let userNamesArray = groupData.userFullNamesList.split(", ");
          let userIDsArray = groupData.userIDsList.split(", ");
          for (i in userNamesArray) {
            groupData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i] });
          }
        }

        groupData.doorIDs = [];

        if (groupData.groupDoors) {
          if (groupData.groupDoors.length <= 1) {
            groupData.doorIDs = [`${groupData.groupDoors}`];
          }
          else {
            groupData.doorIDs = groupData.groupDoors.split(", ");
          }
        }

        groupData.userIDs = [];

        if (groupData.groupUsers) {
          if (groupData.groupUsers.length <= 1) {
            groupData.userIDs = [`${groupData.groupUsers}`];
          }
          else {
            groupData.userIDs = groupData.groupUsers.split(", ");
          }
        }

        console.log(groupData);
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        res.render('group', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Access Group - ${groupData.name}`, panelSubtext: `${groupData.doorIDs.length} - Doors | ${groupData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});



/* GET access group edit page. */
groupsRouter.get('/:groupID/edit', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */
  try {

    console.log('Pulling data from door_groups table on group route');
    await db.query(



      `SELECT
     dg.*,
     d.companyName,
     d.orgName,
     d.siteName,
     GROUP_CONCAT ( DISTINCT d.doorNames ORDER BY d.doorNames SEPARATOR ', ' ) as doorNamesList,
     GROUP_CONCAT ( DISTINCT d.doorIDs ORDER BY d.doorNames SEPARATOR ', ' ) as doorIDsList,
     GROUP_CONCAT ( DISTINCT dgl.door_id_door_group_list ORDER BY dgl.id SEPARATOR ', ' ) as groupDoors,
     GROUP_CONCAT ( DISTINCT d.first_name, " ",d.last_name ORDER BY d.last_name SEPARATOR ', ' ) as userFullNamesList,
     GROUP_CONCAT ( DISTINCT d.userID ORDER BY d.last_name SEPARATOR ', ' ) as userIDsList,
     GROUP_CONCAT ( DISTINCT ag.user_id ORDER BY ag.id SEPARATOR ', ' ) as groupUsers


     FROM door_groups dg
       JOIN (
         SELECT
           c.id as id,
           c.name as companyName,
           c.org as orgName,
           s.id as siteID,
           s.name as siteName,
           s.doorNames,
           s.doorIDs,
           s.first_name,
           s.last_name,
           s.userID

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

       ) d ON (dg.site_id_door_group = d.siteID)

       LEFT JOIN door_group_list dgl ON dg.id = dgl.door_group_id_door_group_list
       LEFT JOIN access_groups ag ON dg.id = ag.group_id
       WHERE dg.id = ${req.params.groupID}
       GROUP BY dg.id
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

        console.log(result);

        let groupData = result[0];
        groupData.allDoors = [];
        groupData.allUsers = [];

        if (groupData.doorNamesList) {
          let doorNamesArray = groupData.doorNamesList.split(", ");
          let doorIDsArray = groupData.doorIDsList.split(", ");

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

        groupData.doorIDs = [];

        if (groupData.groupDoors) {
          if (groupData.groupDoors.length <= 1) {
            groupData.doorIDs = [`${groupData.groupDoors}`];
          }
          else {
            groupData.doorIDs = groupData.groupDoors.split(", ");
          }
        }

        groupData.userIDs = [];

        if (groupData.groupUsers) {
          if (groupData.groupUsers.length <= 1) {
            groupData.userIDs = [`${groupData.groupUsers}`];
          }
          else {
            groupData.userIDs = groupData.groupUsers.split(", ");
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        res.render('group_edit', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Edit Access Group - ${groupData.name}`, panelSubtext: `${groupData.doorIDs.length} - Doors | ${groupData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* POST new group to db. */
groupsRouter.post('/:groupID/edit', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  console.log(req.body);

  let orgID = req.params.orgID;
  let siteID = req.params.siteID;
  let companyID = req.params.companyID;
  let groupID = req.params.groupID;

  try {

    console.log('Posting data to door_groups table on groups_add route');

    var groupData;

    if (!req.body.name) { req.body.name = null };
    if (!req.body.stime) { req.body.stime = null };
    if (!req.body.etime) { req.body.etime = null };

    await db.query(

      `UPDATE door_groups
      SET
        name = "${req.body.name}",
        start_time = "${req.body.stime}", 
        end_time = "${req.body.etime}"
      WHERE id = ${req.params.groupID}
      `,

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
        };

        groupData = result;

        var doorValues = [];
        var userValues = [];

        if (req.body.doorgroups) {
          if (typeof req.body.doorgroups === 'string') {
            doorValues.push([null, req.body.doorgroups, req.params.groupID]);
          }
          else {
            for (let i = 0; i < req.body.doorgroups.length; i++) {
              if (result) {
                doorValues.push([null, req.body.doorgroups[i], req.params.groupID]);
              }
            }
          }
        }

        if (req.body.usergroups) {
          if (typeof req.body.usergroups === 'string') {
            userValues.push([null, req.params.groupID, req.body.usergroups]);
          }
          else {
            for (let i = 0; i < req.body.usergroups.length; i++) {
              if (result) {
                userValues.push([null, req.params.groupID, req.body.usergroups[i]]);
              }
            }
          }
        }


        try {

          console.log('Deleting data from door_group_list table on group_edit route');
          await db.query(
            `DELETE FROM door_group_list WHERE door_group_id_door_group_list = ${req.params.groupID}`,
            async function (err, result, fields) {
              if (err) {
                console.log(typeof (err));
                for (var k in err) {
                  console.log(`${k}: ${err[k]}`);
                }
                res.render('error', {
                  error: "Server ERROR", message: "Please try again", sidebar: [
                    { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
                });
                // throw err
              }
              try {

                console.log('Posting data to door_group_list table on groups_edit route');
                console.log(doorValues);
                if (doorValues.length > 0) {
                  await db.query(

                    `INSERT INTO door_group_list
                  VALUES ?`, [doorValues],
                    function (err, result, fields) {
                      if (err) {
                        console.log(typeof (err));
                        for (var k in err) {
                          console.log(`${k}: ${err[k]}`);

                        }
                        res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
                        // throw err
                      }

                    });

                }
              } catch (err) {
                res.send("server error");
                console.log(err)

              } finally {
                //await db.close();
              }

            });

        } catch (err) {
          res.send("server error");
          console.log(err)

        } finally {
          //await db.close();
        }


        try {

          console.log('Deleting data from access_groups table on group_edit route');
          await db.query(
            `DELETE FROM access_groups WHERE group_id = ${req.params.groupID}`,
            async function (err, result, fields) {
              if (err) {
                console.log(typeof (err));
                for (var k in err) {
                  console.log(`${k}: ${err[k]}`);
                }
                res.render('error', {
                  error: "Server ERROR", message: "Please try again", sidebar: [
                    { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
                });
                // throw err
              }
              try {

                console.log('Posting data to access_groups table on groups_add route');
                console.log(userValues);
                if (userValues.length > 0) {
                  await db.query(

                    `INSERT INTO access_groups
                  VALUES ?`, [userValues],
                    function (err, result, fields) {
                      if (err) {
                        console.log(typeof (err));
                        for (var k in err) {
                          console.log(`${k}: ${err[k]}`);

                        }
                        res.render('error', { error: "Duplicate ID detected", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
                        // throw err
                      }
                    }

                  );
                }
              } catch (err) {
                res.send("server error");
                console.log(err)

              } finally {
                //await db.close();
              }


            });
          res.redirect(`/org/${orgID}/company/${companyID}/site/${siteID}/groups/${groupID}`);
        } catch (err) {
          res.send("server error");
          console.log(err)

        } finally {
          //await db.close();
        }

      });


  } catch (err) {
    res.send("server error");
    console.log(err)
  } finally {
    //await db.close();
  }


});

module.exports = groupsRouter;
