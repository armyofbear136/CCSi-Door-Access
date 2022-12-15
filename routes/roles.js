var express = require('express');
const asyncify = require('express-asyncify');
const mySQLFun = require('../mySQL');
const rolesRouter = asyncify(express.Router({ mergeParams: true }));




/* GET access groups page. */
rolesRouter.get('/', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */


  try {

    console.log('Pulling data from door_groups table on groups route');
    await db.query(

      ` SELECT dg.*, d.companyName, d.orgName, d.siteName
      FROM roles dg
      JOIN (
        SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
        FROM companies c
        JOIN (
          SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
          FROM sites sit
        ) s ON (c.id = s.company_id_sites)
      ) d ON (dg.site_id_roles = d.siteID)
      WHERE dg.site_id_roles = ${req.params.siteID}
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

        let rolesData = result;
        var companyName;
        var siteName;

        if (rolesData.length)
        {
          companyName = rolesData[0].companyName;
          siteName = rolesData[0].siteName;
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
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups" },
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ]

        var varName;
        varName = "CCSI Door Access" //optional title override

        var panelTitle;
        var panelSubtext;
        if (rolesData.length) {
          if (rolesData.length === 1) {
            panelTitle = `${rolesData.length} Role (${siteName})`;
          }
          else {
            panelTitle = `${rolesData.length} Roles (${siteName})`;
          }
          panelSubtext = "Please Select a Role";
        }
        else {
          panelTitle = `No Roles (${siteName})`;
          panelSubtext = "Please Add a Role";
        }

        // console.log(funSites);

        res.render('roles', { roles: rolesData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: panelTitle, panelSubtext: panelSubtext, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID, thisURL: req.originalUrl});

      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});



/* GET access group add page. */
rolesRouter.get('/add', async function (req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  try {

    console.log('Pulling data from door_groups table on group route');

    await db.query(

      `SELECT
      c.*,
      s.siteName,
      GROUP_CONCAT ( DISTINCT s.permNames, "~",s.permIDs ORDER BY s.permNames SEPARATOR ', ' ) as permNameIDList,
      GROUP_CONCAT ( DISTINCT s.first_name, " ",s.last_name ORDER BY s.last_name SEPARATOR ', ' ) as userFullNamesList,
      GROUP_CONCAT ( DISTINCT s.userID ORDER BY s.last_name SEPARATOR ', ' ) as userIDsList

      FROM companies c
        JOIN (
          SELECT
            sit.id as siteID,
            sit.name as siteName,
            sit.company_id_sites as company_id_sites,
            dr.permNames as permNames,
            dr.permIDs as permIDs,
            dr.first_name as first_name,
            dr.last_name as last_name,
            dr.userID as userID

          FROM sites sit
          JOIN (
            SELECT
              drs.site_id_perms as site_id_perms,
              drs.name as permNames,
              drs.id as permIDs,
              urs.first_name as first_name,
              urs.last_name as last_name,
              urs.userIDs as userID

            FROM role_perms drs
            JOIN (
              SELECT
                u.first_name as first_name,
                u.last_name as last_name,
                u.id as userIDs,
                u.site_id_users as site_id_users

              FROM users u

            ) urs ON (drs.site_id_perms = urs.site_id_users)

          ) dr ON (sit.id = dr.site_id_perms)

        ) s ON (c.id = s.company_id_sites)

        WHERE c.id = ${req.params.companyID}
        GROUP BY c.id
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


        let roleData = result[0];
        
        roleData.allPerms = [];
        roleData.allUsers = [];

        if (roleData.permNameIDList) {
          let permNameIDArray = roleData.permNameIDList.split(", ");
          for (i in permNameIDArray) {
            let permNameAndID = permNameIDArray[i].split("~");
            roleData.allPerms.push({ name: permNameAndID[0], id: permNameAndID[1] });
          }
        }

        if (roleData.userFullNamesList) {
          let userNamesArray = roleData.userFullNamesList.split(", ");
          let userIDsArray = roleData.userIDsList.split(", ");
          for (i in userNamesArray) {
            roleData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i] });
          }
        }

        console.log(roleData);
        let companyName = roleData.name;
        let siteName = roleData.siteName;

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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override


        res.render('roles_add', { role: roleData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Add Role`, panelSubtext: "Please add some Permissions and Users", orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });

  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* POST new group to db. */
rolesRouter.post('/add', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("POST Request Called");
  console.log(req.body);



  try {

    console.log('Posting data to door_groups table on groups_add route');


    if (!req.body.name) { req.body.name = null };

    var groupID;

    await db.query(

      `INSERT INTO roles
      VALUES (NULL, "${req.body.name}", ${req.params.siteID})`,

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

        roleID = result.insertId;

        var permValues = [];
        var userValues = [];

        if (req.body.permgroups) {
          if (typeof req.body.permgroups === 'string') {
            permValues.push([null, roleID, req.body.permgroups]);
          }
          else {
            for (let i = 0; i < req.body.permgroups.length; i++) {
              if (result) {
                permValues.push([null, roleID, req.body.permgroups[i]]);
              }
            }
          }
        }

        if (req.body.usergroups) {
          if (typeof req.body.usergroups === 'string') {
            userValues.push([null, req.body.usergroups, roleID]);
          }
          else {
            for (let i = 0; i < req.body.usergroups.length; i++) {
              if (result) {
                userValues.push([null, req.body.usergroups[i], roleID]);
              }
            }
          }
        }

        try {

          console.log('Posting data to door_group_list table on groups_add route');
          console.log(permValues);
          if (permValues.length > 0) {
            await db.query(

              `INSERT INTO perm_groups
            VALUES ?`, [permValues],
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

              `INSERT INTO role_groups
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

        res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles/${roleID}`);
      });


  } catch (err) {
    res.send("server error");
    console.log(err)
  } finally {
    //await db.close();
  }


});


/* GET access group page. */
rolesRouter.get('/:roleID', async function (req, res, next) {


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
      GROUP_CONCAT ( DISTINCT d.permNames, "~",d.permIDs ORDER BY d.permNames SEPARATOR ', ' ) as permNameIDList,
      GROUP_CONCAT ( DISTINCT dgl.role_perm_id ORDER BY dgl.id SEPARATOR ', ' ) as rolePerms,
      GROUP_CONCAT ( DISTINCT d.first_name, " ",d.last_name ORDER BY d.last_name SEPARATOR ', ' ) as userFullNamesList,
      GROUP_CONCAT ( DISTINCT d.userID ORDER BY d.last_name SEPARATOR ', ' ) as userIDsList,
      GROUP_CONCAT ( DISTINCT ag.user_id ORDER BY ag.id SEPARATOR ', ' ) as roleUsers


      FROM roles dg
        JOIN (
          SELECT
            c.id as id,
            c.name as companyName,
            c.org as orgName,
            s.id as siteID,
            s.name as siteName,
            s.permNames,
            s.permIDs,
            s.first_name,
            s.last_name,
            s.userID

          FROM companies c
          JOIN (
            SELECT
              sit.id as id,
              sit.name as name,
              sit.company_id_sites as company_id_sites,
              dr.permNames as permNames,
              dr.permIDs as permIDs,
              dr.first_name as first_name,
              dr.last_name as last_name,
              dr.userID as userID

            FROM sites sit
            JOIN (
              SELECT
                drs.site_id_perms as site_id_perms,
                drs.name as permNames,
                drs.id as permIDs,
                urs.first_name as first_name,
                urs.last_name as last_name,
                urs.userIDs as userID

              FROM role_perms drs
              JOIN (
                SELECT
                  u.first_name as first_name,
                  u.last_name as last_name,
                  u.id as userIDs,
                  u.site_id_users as site_id_users
  
                FROM users u

              ) urs ON (drs.site_id_perms = urs.site_id_users)

            ) dr ON (sit.id = dr.site_id_perms)

          ) s ON (c.id = s.company_id_sites)

        ) d ON (dg.site_id_roles = d.siteID)

        LEFT JOIN perm_groups dgl ON dg.id = dgl.role_id
        LEFT JOIN role_groups ag ON dg.id = ag.role_id
        WHERE dg.id = ${req.params.roleID}
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


        let roleData = result[0];
        
        roleData.allPerms = [];
        roleData.allUsers = [];

        if (roleData.permNameIDList) {
          let permNameIDArray = roleData.permNameIDList.split(", ");
          for (i in permNameIDArray) {
            let permNameAndID = permNameIDArray[i].split("~");
            roleData.allPerms.push({ name: permNameAndID[0], id: permNameAndID[1] });
          }
        }

        if (roleData.userFullNamesList) {
          let userNamesArray = roleData.userFullNamesList.split(", ");
          let userIDsArray = roleData.userIDsList.split(", ");
          for (i in userNamesArray) {
            roleData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i] });
          }
        }

        roleData.permIDs = [];

        if (roleData.rolePerms) {
          if (roleData.rolePerms.length <= 1) {
            roleData.permIDs = [`${roleData.rolePerms}`];
          }
          else {
            roleData.permIDs = roleData.rolePerms.split(", ");
          }
        }

        roleData.userIDs = [];

        if (roleData.roleUsers) {
          if (roleData.roleUsers.length <= 1) {
            roleData.userIDs = [`${roleData.roleUsers}`];
          }
          else {
            roleData.userIDs = roleData.roleUsers.split(", ");
          }
        }

        console.log(roleData);
        let companyName = roleData.companyName;
        let siteName = roleData.siteName;

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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        res.render('role', { role: roleData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `Role - ${roleData.name}`, panelSubtext: `${roleData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID, thisURL: req.originalUrl });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* DELETE user route. */
rolesRouter.delete('/:roleID', async function (req, res, next) {

  console.log("hitting group delete route");



  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  // if (req.body.command == "delete") {
    try {

      console.log('Deleting data from tables on roleID delete route');
      await db.query(

        `
        DELETE
          roles,
          role_groups,
          perm_groups
        FROM roles
        LEFT JOIN
          role_groups ON roles.id = role_groups.role_id
        LEFT JOIN
          perm_groups ON roles.id = perm_groups.role_perm_id
        WHERE roles.id = ${req.params.roleID};
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


  });


/* GET access group edit page. */
rolesRouter.get('/:roleID/edit', async function (req, res, next) {


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
      GROUP_CONCAT ( DISTINCT d.permNames, "~",d.permIDs ORDER BY d.permNames SEPARATOR ', ' ) as permNameIDList,
      GROUP_CONCAT ( DISTINCT dgl.role_perm_id ORDER BY dgl.id SEPARATOR ', ' ) as rolePerms,
      GROUP_CONCAT ( DISTINCT d.first_name, " ",d.last_name ORDER BY d.last_name SEPARATOR ', ' ) as userFullNamesList,
      GROUP_CONCAT ( DISTINCT d.userID ORDER BY d.last_name SEPARATOR ', ' ) as userIDsList,
      GROUP_CONCAT ( DISTINCT ag.user_id ORDER BY ag.id SEPARATOR ', ' ) as roleUsers


      FROM roles dg
        JOIN (
          SELECT
            c.id as id,
            c.name as companyName,
            c.org as orgName,
            s.id as siteID,
            s.name as siteName,
            s.permNames,
            s.permIDs,
            s.first_name,
            s.last_name,
            s.userID

          FROM companies c
          JOIN (
            SELECT
              sit.id as id,
              sit.name as name,
              sit.company_id_sites as company_id_sites,
              dr.permNames as permNames,
              dr.permIDs as permIDs,
              dr.first_name as first_name,
              dr.last_name as last_name,
              dr.userID as userID

            FROM sites sit
            JOIN (
              SELECT
                drs.site_id_perms as site_id_perms,
                drs.name as permNames,
                drs.id as permIDs,
                urs.first_name as first_name,
                urs.last_name as last_name,
                urs.userIDs as userID

              FROM role_perms drs
              JOIN (
                SELECT
                  u.first_name as first_name,
                  u.last_name as last_name,
                  u.id as userIDs,
                  u.site_id_users as site_id_users
  
                FROM users u

              ) urs ON (drs.site_id_perms = urs.site_id_users)

            ) dr ON (sit.id = dr.site_id_perms)

          ) s ON (c.id = s.company_id_sites)

        ) d ON (dg.site_id_roles = d.siteID)

        LEFT JOIN perm_groups dgl ON dg.id = dgl.role_id
        LEFT JOIN role_groups ag ON dg.id = ag.role_id
        WHERE dg.id = ${req.params.roleID}
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


        let roleData = result[0];
        
        roleData.allPerms = [];
        roleData.allUsers = [];

        if (roleData.permNameIDList) {
          let permNameIDArray = roleData.permNameIDList.split(", ");
          for (i in permNameIDArray) {
            let permNameAndID = permNameIDArray[i].split("~");
            roleData.allPerms.push({ name: permNameAndID[0], id: permNameAndID[1] });
          }
        }

        if (roleData.userFullNamesList) {
          let userNamesArray = roleData.userFullNamesList.split(", ");
          let userIDsArray = roleData.userIDsList.split(", ");
          for (i in userNamesArray) {
            roleData.allUsers.push({ name: userNamesArray[i], id: userIDsArray[i] });
          }
        }

        roleData.permIDs = [];

        if (roleData.rolePerms) {
          if (roleData.rolePerms.length <= 1) {
            roleData.permIDs = [`${roleData.rolePerms}`];
          }
          else {
            roleData.permIDs = roleData.rolePerms.split(", ");
          }
        }

        roleData.userIDs = [];

        if (roleData.roleUsers) {
          if (roleData.roleUsers.length <= 1) {
            roleData.userIDs = [`${roleData.roleUsers}`];
          }
          else {
            roleData.userIDs = roleData.roleUsers.split(", ");
          }
        }

        console.log(roleData);
        let companyName = roleData.companyName;
        let siteName = roleData.siteName;

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
          { status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, icon: "settings_accessibility", text: "Roles" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports" },
          { status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/events`, icon: "view_timeline", text: "Events" }
        ];

        var varName;
        varName = "CCSI Door Access" //optional title override

        res.render('role_edit', { role: roleData, sidebar: sidebarList, tabBar: tabBarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, panelTitle: `${roleData.name} (Editing)`, panelSubtext: `${roleData.userIDs.length} - Users`, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID });


      });


  } catch (err) {
    console.log(err)
  } finally {
    //await db.close();
  }


});

/* PUT edited role to db. */
rolesRouter.put('/:roleID/edit', async function (req, res, next) {

  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  console.log("PUT Request Called");
  console.log(req.body);

  let orgID = req.params.orgID;
  let siteID = req.params.siteID;
  let companyID = req.params.companyID;
  let roleID = req.params.roleID;

  try {

    console.log('Putting data to roles table on role_edit route');

    var roleData;

    if (!req.body.name) { req.body.name = null };

    await db.query(

      `UPDATE roles
      SET
        name = "${req.body.name}"
      WHERE id = ${req.params.roleID}
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

        roleData = result;

        var permValues = [];
        var userValues = [];

        if (req.body.permgroups) {
          if (typeof req.body.permgroups === 'string') {
            permValues.push([null, req.params.roleID, req.body.permgroups]);
          }
          else {
            for (let i = 0; i < req.body.permgroups.length; i++) {
              if (result) {
                permValues.push([null, req.params.roleID, req.body.permgroups[i]]);
              }
            }
          }
        }

        if (req.body.usergroups) {
          if (typeof req.body.usergroups === 'string') {
            userValues.push([null, req.body.usergroups, req.params.roleID]);
          }
          else {
            for (let i = 0; i < req.body.usergroups.length; i++) {
              if (result) {
                userValues.push([null, req.body.usergroups[i], req.params.roleID]);
              }
            }
          }
        }


        try {

          console.log('Deleting data from perm_group table on role_edit route');
          await db.query(
            `DELETE FROM perm_groups WHERE role_id = ${req.params.roleID}`,
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

                console.log('Posting data to perm_groups table on role_edit route');
                console.log(permValues);
                if (permValues.length > 0) {
                  await db.query(

                    `INSERT INTO perm_groups
                  VALUES ?`, [permValues],
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

          console.log('Deleting data from role_groups table on role_edit route');
          await db.query(
            `DELETE FROM role_groups WHERE role_id = ${req.params.roleID}`,
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

                console.log('Posting data to role_groups table on role_add route');
                console.log(userValues);
                if (userValues.length > 0) {
                  await db.query(

                    `INSERT INTO role_groups
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
rolesRouter.get('/:roleID/processing', async function (req, res, next) {


  /* link to database */


  // /* load data from database */
  console.log("hitting processing page");


  

  res.render('success', { redirect: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/roles`, success: "Processing transaction", message: "Redirecting...", sidebar: [{ status: 0, url: `/`, icon: "logout", text: "Portal" }], sideTitle: "CCSI Door Access", navTitle: "Action completed successfully" });
 


});


module.exports = rolesRouter;
