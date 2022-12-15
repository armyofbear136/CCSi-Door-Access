var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
const APIFun = require('../myAPI');
const doorsRouter = asyncify(express.Router({ mergeParams: true }));



/* GET doors page. */
doorsRouter.get('/', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {


    console.log('Pulling data on doors route');
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

          if (doorsData[i].alarm == "Normal") {
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]
        
        var panelTitle;
        var panelSubtext;
        if (doorsData.length) {
          if (doorsData.length === 1) {
            panelTitle = `${doorsData.length} Door (${siteName})`;
          }
          else {
            panelTitle = `${doorsData.length} Doors (${siteName})`;
          }
          panelSubtext = "Please Select a Door";
        }
        else {
          panelTitle = `No Doors (${siteName})`;
          panelSubtext = "Please Add a Door";
        }

        varName = "CCSI Door Access" //optional title override

        // console.log(funSites);
        res.render('doors', { doors: doorsData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: panelTitle, panelSubtext: panelSubtext, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID, thisURL: req.originalUrl });

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});


/* GET door_add page. */
doorsRouter.get('/add', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

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

        let groupData = result;
        let companyName = groupData[0].companyName;
        let siteName = groupData[0].siteName;


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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]

        var varName;
        varName = "CCSI Door Access" //optional title override
        res.render('doors_add', { groups: groupData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Add Door`, panelSubtext: `Site - ${siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID });
      });
  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

  

});


/* POST new door to db. */
doorsRouter.post('/add', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");


  try {

    console.log('Posting data to doors table on new_door route');

    if (!req.body.name) { req.body.name = null };
    if (!req.body.ip) { req.body.ip = null };

    await db.query(

      `INSERT INTO doors
      VALUES (NULL, "${req.body.name}", "${req.body.ip}", "NEW", "NEW", ${req.params.siteID}, NULL, NULL, NULL, "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", "07:00:00", "18:00:00", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`,

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
        doorData = result;

        values = [];

        if (req.body.groups) {
          if (typeof req.body.groups === 'string') {
            values.push([null, result.insertId, req.body.groups]);
          }
          else {
            for (let i = 0; i < req.body.groups.length; i++) {
              if (result) {
                values.push([null, result.insertId, req.body.groups[i]]);
              }
            }
          }
        }


        try {

          console.log('Posting data to door_group_list table on new_door route');
          if (values.length > 0) {
            await db.query(

              `INSERT INTO door_group_list
            VALUES ?`, [values],
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
          res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors/${doorData.insertId}`);
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

  try {

    console.log('Getting data from doors table on new_door route');

    await db.query(

      `SELECT COUNT(*)
      FROM doors
      WHERE site_id_doors = ${req.params.siteID}`,

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
        let doorCount = Object.values(result[0])[0];
        try {

          console.log('Getting data from users table on new_user route');
      
          await db.query(
      
            `UPDATE sites
            SET doorcount = ${doorCount}
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



/* GET door page. */
doorsRouter.get('/:doorID', async function (req, res, next) {


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

        let doorData = result[0];

        if (doorData.groupNamesList) {
          doorData.allDoorGroupNames = doorData.groupNamesList.split(", ");
          doorData.allDoorGroupIds = doorData.groupIDsList.split(", ");
        }

        doorData.doorgroupIDs = [];

        if (doorData.doorGroups) {
          if (doorData.doorGroups.length <= 1) {
            doorData.doorgroupIDs = [`${doorData.doorGroups}`];
          }
          else {
            doorData.doorgroupIDs = doorData.doorGroups.split(", ");
          }
        }

        let groupings = []
        for (var i in doorData.allDoorGroupNames) {
          groupings.push({ name: doorData.allDoorGroupNames[i], id: doorData.allDoorGroupIds[i] });
        }
        doorData.groups = groupings;


        const funSites = await mySQLFun.getSites(db, req.params.companyID)

        var sidebarList = [
          { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${doorData.companyName}` }
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]

        var varName;

        varName = "CCSI Door Access" //optional title override
        res.render('door', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name}`, panelSubtext: `Site - ${doorData.siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID, thisURL: req.originalUrl });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});


/* DELETE user route. */
doorsRouter.delete('/:doorID', async function (req, res, next) {

  console.log("hitting user delete route");



  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  // if (req.body.command == "delete") {
    try {

      console.log('Pulling door data from tables on doorID route');
      await db.query(

        `
        DELETE
          doors,
          door_group_list
        FROM doors
        LEFT JOIN
          door_group_list ON doors.id = door_group_list.door_id_door_group_list
        WHERE doors.id = ${req.params.doorID};
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

      console.log('Getting data from doors table on new_door route');
  
      await db.query(
  
        `SELECT COUNT(*)
        FROM doors
        WHERE site_id_doors = ${req.params.siteID}`,
  
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
          let doorCount = Object.values(result[0])[0];
          try {
  
            console.log('Getting data from users table on new_user route');
        
            await db.query(
        
              `UPDATE sites
              SET doorcount = ${doorCount}
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


/* GET door_edit page. */
doorsRouter.get('/:doorID/edit', async function (req, res, next) {


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


        // let doorInfo = {id: result[0].id, name: result[0].name, ip: result[0].ip, status: result[0].status, alarm: result[0].alarm};
        let doorData = result[0];

        if (doorData.groupNamesList) {
          doorData.allDoorGroupNames = doorData.groupNamesList.split(", ");
          doorData.allDoorGroupIds = doorData.groupIDsList.split(", ");
        }

        doorData.doorgroupIDs = [];

        if (doorData.doorGroups) {
          if (doorData.doorGroups.length <= 1) {
            doorData.doorgroupIDs = [`${doorData.doorGroups}`];
          }
          else {
            doorData.doorgroupIDs = doorData.doorGroups.split(", ");
          }
        }

        let groupings = []
        for (var i in doorData.allDoorGroupNames) {
          groupings.push({ name: doorData.allDoorGroupNames[i], id: doorData.allDoorGroupIds[i] });
        }
        doorData.groups = groupings;


        const funSites = await mySQLFun.getSites(db, req.params.companyID)

        var sidebarList = [
          { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${doorData.companyName}` }
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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]

        var varName;

        varName = "CCSI Door Access" //optional title override
        res.render('door_edit', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name}`, panelSubtext: `Site - ${doorData.siteName}`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});


/* POST edited door to db. */
doorsRouter.put('/:doorID/edit', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  // res.send("posting");

  try {

    console.log('Posting data to users table on user edit POST route');

    if (!req.body.name) { req.body.name = null };
    if (!req.body.ip) { req.body.ip = null };
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

      `UPDATE doors 
      SET 
        name = "${req.body.name}", 
        ip = "${req.body.ip}",
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
      WHERE id = ${req.params.doorID}`,

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

        try {

          console.log('Deleting data from access_groups table on user edit route');
          await db.query(
            `DELETE FROM door_group_list WHERE door_id_door_group_list = ${req.params.doorID}`,
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
                console.log('Posting data to door_group_list table on door edit route');
                let valuesString = ""

                if (req.body.groups) {
                  if (typeof req.body.groups === 'string') {
                    valuesString = `(NULL, ${req.params.doorID}, ${req.body.groups})`
                  }
                  else {
                    for (var i in req.body.groups) {
                      if (i == 0) { valuesString = `(NULL, ${req.params.doorID}, ${req.body.groups[i]})` }
                      else { valuesString = valuesString.concat(", ", `(NULL, ${req.params.doorID}, ${req.body.groups[i]})`) }
                    }
                  }



                  await db.query(
                    `
                      INSERT INTO door_group_list
                      VALUES ${valuesString}
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
                      }
                      res.send(200);
                      // res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors/${req.params.doorID}`);
                    });
                }
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
  } catch (err) {
    res.send("server error");
    console.log(err)

  } finally {
    //await db.close();
  }
});



/* GET door_edit page. */
doorsRouter.get('/:doorID/controls/:command', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data on door control GET route');
    await db.query(

      `SELECT
       d.lock_key
 
     FROM doors u
       JOIN (
         SELECT
           c.id as id,
           c.lock_key as lock_key
         FROM door_readers c
       ) d ON (u.reader_id = d.id)

       WHERE u.id = ${req.params.doorID}
       GROUP BY u.id
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

        

        let readerData = result[0];

        // console.log(readerData.lock_key);

        // const funSites = await mySQLFun.getSites(db, req.params.companyID)

        // var sidebarList = [
        //   { status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home" },
        //   { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${doorData.companyName}` }
        // ];
        // for (i in funSites) {
        //   if (funSites[i].id == req.params.siteID) {
        //     sidebarList.push({ status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
        //   }
        //   else {
        //     sidebarList.push({ status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${funSites[i].id}`, icon: "store", text: `${funSites[i].name}` });
        //   }
        // }

        // var tabBarList = [
        //   { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors" },
        //   { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users" },
        //   { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
        //   { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          // { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        // ]
        // var varName;

        // // console.log(doorData);
        // varName = "CCSI Door Access" //optional title override
        // res.render('door_controls', { door: doorData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${doorData.companyName} - ${doorData.siteName}`, panelTitle: `${doorData.name} - Controls`, panelSubtext: `Door Control Panel`, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID });
        try {
          if (readerData?.lock_key){
            const response = await APIFun.doorControls(`${req.params.command}`, `${readerData.lock_key}`);
          // console.log("response");
          // console.log(response);
          res.send(200);
          }
        }catch (err) {
          console.log(err)
        } finally {
          //await db.close();
        }

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }

});

/* GET door processing page. */
doorsRouter.get('/:doorID/processing', async function (req, res, next) {


  /* link to database */


  // /* load data from database */
  console.log("hitting processing page");


  

  res.render('success', { redirect: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, success: "Processing transaction", message: "Redirecting...", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Action completed successfully" });
 


});

module.exports = doorsRouter;
