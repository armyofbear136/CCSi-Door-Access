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
        var companyName;
        var siteName;

        if (groupsData.length)
        {
          companyName = groupsData[0].companyName;
          siteName = groupsData[0].siteName;
        }
        else
        {
          let siteInfo = await mySQLFun.getSiteInfo(db, req.params.siteID);
          console.log(siteInfo);
          companyName = siteInfo[0].companyName;
          siteName = siteInfo[0].name;
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]

        var varName;
        varName = "CCSI Door Access" //optional title override

        var panelTitle;
        var panelSubtext;
        if (groupsData.length) {
          if (groupsData.length === 1) {
            panelTitle = `${groupsData.length} Group (${siteName})`;
          }
          else {
            panelTitle = `${groupsData.length} Groups (${siteName})`;
          }
          panelSubtext = "Please Select a Group";
        }
        else {
          panelTitle = `No Groups (${siteName})`;
          panelSubtext = "Please Add a Group";
        }

        // console.log(funSites);

        res.render('groups', { groups: groupsData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: panelTitle, panelSubtext: panelSubtext, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID, thisURL: req.originalUrl});

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

        let groupData = result[0];

        if(groupData){
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
            { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
          ];

          var varName;
          varName = "CCSI Door Access" //optional title override


          res.render('groups_add', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Add Group`, panelSubtext: "Please add some Doors and Users", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });
        }
        else {
          res.render('error', {
            error: "Server Error", message: "Please try again", sidebar: [
              { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
          });
        }

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
      VALUES (NULL, "${req.body.name}", ${req.params.siteID}, "${req.body.stime}", "${req.body.etime}", NULL, "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,

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


  try {

    console.log('Getting data from door_groups table on new_group route');

    await db.query(

      `SELECT COUNT(*)
      FROM door_groups
      WHERE site_id_door_group = ${req.params.siteID}`,

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
        let groupCount = Object.values(result[0])[0];
        try {

          console.log('updating data on sites table on new_group route');
      
          await db.query(
      
            `UPDATE sites
            SET groupcount = ${groupCount}
            WHERE id = ${req.params.siteID}`,
      
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
          );
        } catch (err) {
          res.send("server error");
          console.log(err)
      
        } finally {
          //await db.close();
        }
      }
    );
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


        let groupData = result[0];

        if (groupData)
        {
          groupData.allDoors = [];
          groupData.allUsers = [];

          if (groupData.doorNameIDList) {
            let doorNameIDArray = groupData.doorNameIDList.split(", ");
            for (i in doorNameIDArray) {
              let doorNameAndID = doorNameIDArray[i].split("~");
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
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
          ];

          var varName;
          varName = "CCSI Door Access" //optional title override

          res.render('group', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Access Group - ${groupData.name}`, panelSubtext: `${groupData.doorIDs.length} - Doors | ${groupData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID, thisURL: req.originalUrl });
        }
        else {
          res.render('error', {
            error: "Server Error", message: "Please try again", sidebar: [
              { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
          });
        }

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* DELETE user route. */
groupsRouter.delete('/:groupID', async function (req, res, next) {

  console.log("hitting group delete route");



  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  // if (req.body.command == "delete") {
    try {

      console.log('Pulling group data from tables on groupID delete route');
      await db.query(

        `
        DELETE
          door_groups,
          access_groups,
          door_group_list
        FROM door_groups
        LEFT JOIN
          access_groups ON door_groups.id = access_groups.group_id
        LEFT JOIN
          door_group_list ON door_groups.id = door_group_list.door_group_id_door_group_list
        WHERE door_groups.id = ${req.params.groupID};
        `,



        async function (err, result, fields) {
          

          if (err) {
            console.log(typeof (err));
            for (var k in err) {
              console.log(`${k}: ${err[k]}`);
            }
            res.render('error', { error: "Server Error", message: "Please try again", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500" });
            // throw err
          };

          

        });
        res.send(200);
        // res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`);
        

    } catch (err) {
      console.log(err)
    } finally {
      //await db.close();
    }

    try {

      console.log('Getting data from door_groups table on new_group route');
  
      await db.query(
  
        `SELECT COUNT(*)
        FROM door_groups
        WHERE site_id_door_group = ${req.params.siteID}`,
  
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
          let groupCount = Object.values(result[0])[0];
          try {
  
            console.log('updating data on sites table on new_group route');
        
            await db.query(
        
              `UPDATE sites
              SET groupcount = ${groupCount}
              WHERE id = ${req.params.siteID}`,
        
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
            );
          } catch (err) {
            res.send("server error");
            console.log(err)
        
          } finally {
            //await db.close();
          }
        }
      );
    } catch (err) {
      res.send("server error");
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

        let groupData = result[0];
        if (groupData){
            
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
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
            { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
          ];

          var varName;
          varName = "CCSI Door Access" //optional title override

          res.render('group_edit', { group: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `${groupData.name} (Editing)`, panelSubtext: `${groupData.doorIDs.length} - Doors | ${groupData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });
        }
        else {
          res.render('error', {
            error: "Server Error", message: "Please try again", sidebar: [
              { status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"
          });
        }

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* POST new group to db. */
groupsRouter.put('/:groupID/edit', async function (req, res, next) {

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
    if (!req.body.alwayson) { req.body.alwayson = 0};
    if (!req.body.mallday) { req.body.mallday = 0};
    if (!req.body.menabled) { req.body.menabled = 0};
    if (!req.body.tuallday) { req.body.tuallday = 0};
    if (!req.body.tuenabled) { req.body.tuenabled = 0};
    if (!req.body.wallday) { req.body.wallday = 0};
    if (!req.body.wenabled) { req.body.wenabled = 0};
    if (!req.body.thallday) { req.body.thallday = 0};
    if (!req.body.thenabled) { req.body.thenabled = 0};
    if (!req.body.fallday) { req.body.fallday = 0};
    if (!req.body.fenabled) { req.body.fenabled = 0};
    if (!req.body.saallday) { req.body.saallday = 0};
    if (!req.body.saenabled) { req.body.saenabled = 0};
    if (!req.body.suallday) { req.body.suallday = 0};
    if (!req.body.suenabled) { req.body.suenabled = 0};

    await db.query(

      `UPDATE door_groups
      SET
        name = "${req.body.name}",
        start_time = "${req.body.stime}", 
        end_time = "${req.body.etime}",
        mstart_time = "${req.body.mstime}",
        mend_time = "${req.body.metime}",
        tustart_time = "${req.body.tustime}",
        tuend_time = "${req.body.tuetime}",
        wstart_time = "${req.body.wstime}",
        wend_time = "${req.body.wetime}",
        thstart_time = "${req.body.thstime}",
        thend_time = "${req.body.thetime}",
        fstart_time = "${req.body.fstime}",
        fend_time = "${req.body.fetime}",
        sastart_time = "${req.body.sastime}",
        saend_time = "${req.body.saetime}",
        sustart_time = "${req.body.sustime}",
        suend_time = "${req.body.suetime}",
        menabled = "${req.body.menabled}",
        tuenabled = "${req.body.tuenabled}",
        wenabled = "${req.body.wenabled}",
        thenabled = "${req.body.thenabled}",
        fenabled = "${req.body.fenabled}",
        saenabled = "${req.body.saenabled}",
        suenabled = "${req.body.suenabled}",
        mallday = "${req.body.mallday}",
        tuallday = "${req.body.tuallday}",
        wallday = "${req.body.wallday}",
        thallday = "${req.body.thallday}",
        fallday = "${req.body.fallday}",
        saallday = "${req.body.saallday}",
        suallday = "${req.body.suallday}",
        alwayson = "${req.body.alwayson}"
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
            res.send(200);
          // res.redirect(`/org/${orgID}/company/${companyID}/site/${siteID}/groups/${groupID}`);
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

/* GET user processing page. */
groupsRouter.get('/:groupID/processing', async function (req, res, next) {


  /* link to database */


  // /* load data from database */
  console.log("hitting processing page");


  

  res.render('success', { redirect: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, success: "Processing transaction", message: "Redirecting...", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Action completed successfully" });
 


});


module.exports = groupsRouter;
