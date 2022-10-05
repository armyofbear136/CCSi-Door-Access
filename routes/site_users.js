var express = require('express');
const asyncify = require('express-asyncify');
const siteUsersRouter = asyncify(express.Router({mergeParams: true}));

/* GET users page. */
siteUsersRouter.get('/', async function(req, res, next) {

  console.log(req.params);

  
  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  var companyName;
  var orgName;
  try {
    
    console.log('Pulling data from company db on site_users route');
    await db.query(`

      SELECT name, org 
      FROM companies 
      WHERE id = ${req.params.companyID}`, 
      
      function (err, result, fields) {
      companyName = result[0].name;
      orgName = result[0].org;
    });
  }catch ( err ) {
    console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
    // console.log(err)
  } finally {
    //await db.close();
  }

  var siteName;

  try {
    
    console.log('Pulling data from sites db on site_users route');
    await db.query(
      `SELECT name 
      FROM sites 
      WHERE id = ${req.params.siteID}`, 
      
      function (err, result, fields) {
      siteName = result[0].name;
    });
  }catch ( err ) {
    console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
    // console.log(err)
  } finally {
    //await db.close();
  }
//    GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as "doorgroups"
  try {
    console.log('Pulling data from users db on site_users route');
    await db.query(

    `SELECT u.*, 
    GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as "doorgroups"
    FROM users u
      LEFT JOIN access_groups ag ON u.id = ag.user_id
      LEFT JOIN door_groups dg ON ag.group_id = dg.id
    WHERE site_id_users = ${req.params.siteID} 
    GROUP BY u.id
    ORDER BY last_name ASC`, 

      function (err, result, fields) {
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
      var userList = [];
      for (let i = 0; i < result.length; i++) {
        userList.push({ id: result[i].id, fob: result[i].fob_id, eid: result[i].employee_id, first: result[i].first_name, last: result[i].last_name, groups: result[i].doorgroups});
      }

      
      
      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}`, icon: "store", text: `${siteName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
        {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"},
      ];


      orgName = "CCSI Door Access"; //optional title override

      var panelTitleT;
      var panelSubtextT;

      if (userList.length) {
        if (userList.length === 1) {
          panelTitleT = `${userList.length} User at ${companyName} - ${siteName}`;
        }
        else {
          panelTitleT = `${userList.length} Users at ${companyName} - ${siteName}`;
        }
        panelSubtextT = "Please Select a User";
      }
      else {
        panelTitleT = `No Users at ${companyName} - ${siteName}`;
        panelSubtextT = "Please Add a User";
      }

      res.render('site_users', { users: userList, sidebar: sidebarList, sideTitle: orgName, navTitle: `${companyName} - ${siteName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, companyID: req.params.companyID, siteID: req.params.siteID, orgID: req.params.orgID});


    });

} catch ( err ) {
  console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
} finally {
  //await db.close();
}


});


/* GET new user page. */
siteUsersRouter.get('/add', async function(req, res, next) {


  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  var companyName;

  var siteName;

 

  try {
 
    console.log('Pulling data from sites table on new_user route');
    await db.query(

      `
      SELECT
        dg.id,
        dg.name,
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
      ORDER BY name ASC
      `, 
      
      function (err, result, fields) {
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
        let groupsList = result;
        companyName = result[0].companyName;
        siteName = result[0].siteName;

        var sidebarList = [
          {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${companyName}`},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}`, icon: "store", text: `${siteName}`},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
          {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"},
        ];
        var varName;
        varName = "CCSI Door Access" //optional title override
        
        res.render('new_user', { groups: groupsList, sidebar: sidebarList, sideTitle: varName, navTitle: `${companyName} - ${siteName}`, company: companyName, site: siteName, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID});

    });



  }catch ( err ) {
    console.log(err)
  } finally {
    //await db.close();
  }

  

});

/* POST new user to db. */
siteUsersRouter.post('/add', async function(req, res, next) {

/* link to database */

var db = req.app.get('db');

// /* load data from database */

console.log("POST Request Called");

try {
    
  console.log('Posting data to users table on new_user route');
  console.log(req.body.fname);
  if (!req.body.fname){req.body.fname = null};
  if (!req.body.lname){req.body.lname = null};
  if (!req.body.email){req.body.email = null};
  if (!req.body.fob){req.body.fob = null};
  if (!req.body.eid){req.body.eid = null};
  
  await db.query(

    `INSERT INTO users
    VALUES (NULL, "${req.body.fname}", "${req.body.lname}", "${req.body.email}", ${req.body.fob}, ${req.params.companyID}, ${req.params.siteID}, ${req.body.eid})`,

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
      let userData = result;
      var values = [];
      console.log(req.body.groups);
      if (req.body.groups)
        {
        if (typeof req.body.groups === 'string')
        {
          values.push([null, req.body.groups, userData.insertId])
        }
        else
        {
          for (let i = 0; i < req.body.groups.length; i++) {
            if (result){
              values.push([null, req.body.groups[i], userData.insertId]);
            }
          }
        }
      }

      try {
    
        console.log('Posting data to access_groups table on new_user route');
        console.log(values);
        if (values.length > 0){
          await db.query(
    
          `INSERT INTO access_groups
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
          }
    
          );
        }
        res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users/${userData.insertId}`);
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




/* GET user page. */
siteUsersRouter.get('/:userID', async function(req, res, next) {

console.log("hitting user route");



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
    
    
      
    function (err, result, fields) {
      let userData = result[0];

      if (userData.groupNamesList){
        userData.allDoorGroupNames = userData.groupNamesList.split(", ");
        userData.allDoorGroupIds = userData.groupIDsList.split(", ");
      }
      userData.doorgroupIDs = [];
      if (userData.userGroups){
        if (userData.userGroups.length <= 1){
          userData.doorgroupIDs = [`${userData.userGroups}`];
        }
        else {
          userData.doorgroupIDs = userData.userGroups.split(", ");
        }
      }
      
      let groupings = []
      for (var i in userData.allDoorGroupNames){
        groupings.push({name: userData.allDoorGroupNames[i], id: userData.allDoorGroupIds[i] });
      }
      userData.groups = groupings;

      console.log(userData);

      if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
            res.render('error', { error: "Server Error", message: "Please try again", sidebar: [{status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${userData.companyName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}`, icon: "store", text: `${userData.siteName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
        {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"},
      ];

      var panelTitleT = `${userData.last_name}, ${userData.first_name} - ${userData.employee_id}`;
      var panelSubtextT = "User Info";
      var varName = "CCSI DOOR ACCESS"

      res.render('user', { user: userData, sidebar: sidebarList, sideTitle: `${varName}`, navTitle: `${userData.companyName} - ${userData.siteName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID});

        
      });
}catch ( err ) {
  console.log(err)
} finally {
  //await db.close();
}
});


/* GET user edit page. */
siteUsersRouter.get('/:userID/edit', async function(req, res, next) {

console.log("hitting user route");



/* link to database */

var db = req.app.get('db');

// /* load data from database */

try {
  // GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as "doorgroups",
  
  console.log('Pulling user data from tables on edit user GET route');
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
    
    
      
    function (err, result, fields) {
      let userData = result[0];

      console.log(result);

      if (userData.groupNamesList){
        userData.allDoorGroupNames = userData.groupNamesList.split(", ");
        userData.allDoorGroupIds = userData.groupIDsList.split(", ");
      }
      userData.doorgroupIDs = [];
      if (userData.userGroups){
        if (userData.userGroups.length <= 1){
          userData.doorgroupIDs = [`${userData.userGroups}`];
        }
        else {
          userData.doorgroupIDs = userData.userGroups.split(", ");
        }
      }
      
      let groupings = []
      for (var i in userData.allDoorGroupNames){
        groupings.push({name: userData.allDoorGroupNames[i], id: userData.allDoorGroupIds[i] });
      }
      userData.groups = groupings;

      if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
            res.render('error', { error: "Server Error", message: "Please try again", sidebar: [{status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}`, icon: "business", text: `${userData.companyName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}`, icon: "store", text: `${userData.siteName}`},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/doors`, icon: "meeting_room", text: "Doors"},
        {status: 1, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users`, icon: "person", text: "Users"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/groups`, icon: "supervisor_account", text: "Groups"},
        {status: 0, url: `/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/reports`, icon: "summarize", text: "Reports"},
      ];

      var panelTitleT = `${userData.last_name}, ${userData.first_name} - ${userData.employee_id} (Editing)`;
      var panelSubtextT = "Edit User";
      var varName = "CCSI DOOR ACCESS"

      res.render('user_edit', { user: userData, sidebar: sidebarList, sideTitle: `${varName}`, navTitle: `${userData.companyName} - ${userData.siteName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID, companyID: req.params.companyID, siteID: req.params.siteID});

        
      });
  }catch ( err ) {
    console.log(err)
  } finally {
    //await db.close();
  }
});



/* POST edited user to db. */
siteUsersRouter.post('/:userID/edit', async function(req, res, next) {

/* link to database */

var db = req.app.get('db');

// /* load data from database */

console.log("POST Request Called");
console.log(req.body);
// res.send("posting");

try {
    
  console.log('Posting data to users table on user edit POST route');

  await db.query(

    `UPDATE users 
    SET 
      first_name = "${req.body.fname}", 
      last_name = "${req.body.lname}", 
      email = "${req.body.email}", 
      fob_id = ${req.body.fob}, 
      company_id_users = ${req.params.companyID}, 
      site_id_users = ${req.params.siteID}, 
      employee_id = ${req.body.eid}
    WHERE id = ${req.params.userID}`,

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
          `DELETE FROM access_groups WHERE user_id = ${req.params.userID}`,
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
              console.log('Posting data to access_groups table on user edit route');
              let valuesString = ""
              if (typeof req.body.groups === 'string')
              {
                valuesString = `(NULL, ${req.body.groups}, ${req.params.userID})`
              }
              else
              {
                for (var i in req.body.groups){
                  console.log(i);
                  if (i == 0){ valuesString = `(NULL, ${req.body.groups[i]}, ${req.params.userID})`}
                  else { valuesString = valuesString.concat(", ", `(NULL, ${req.body.groups[i]}, ${req.params.userID})`)}
                }
              }
              console.log("values string");
              console.log(valuesString);
              await db.query(
              `INSERT INTO access_groups
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
                res.redirect(`/org/${req.params.orgID}/company/${req.params.companyID}/site/${req.params.siteID}/users/${req.params.userID}`);
            });
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




module.exports = siteUsersRouter;
