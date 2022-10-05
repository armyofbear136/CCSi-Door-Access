var express = require('express');
const asyncify = require('express-asyncify');
const globalUsersRouter = asyncify(express.Router({mergeParams: true}));

/* GET users page. */
globalUsersRouter.get('/', async function(req, res, next) {

  console.log(req.params);

  
  /* link to database */

  var db = req.app.get('db');

  // /* load data from database */

  //saving in case of restructure to higher level
  // try {
    
  //   console.log('Pulling data from company db on company_users route');
  //   await db.query(`SELECT name, org FROM companies WHERE id = ${req.params.companyID}`, function (err, result, fields) {
  //     companyName = result[0].name;
  //     orgName = result[0].org;
  //   });
  // }catch ( err ) {
  //   console.log(err)
  // } finally {
  //   //await db.close();
  // }

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
        
      if (err){ 
          console.log(typeof(err));
          for (var k in err){
            console.log(`${k}: ${err[k]}`);
          }
          res.render('error', { error: "Server Error", message: "Please try again", sidebar: [
            {status: 0, url: `/`, icon: "logout", text: "Portal"}], sideTitle: "CCSI Door Access", navTitle: "Server Error 500"});
          // throw err
        };
      let userList = result;
      let orgName = result[0].orgName;

      

      var sidebarList = [
        {status: 0, url: `/org/${req.params.orgID}`, icon: "home", text: "Home"},
        {status: 1, url: `/org/${req.params.orgID}/users`, icon: "public", text: `Global Users`},
      ];

      console.log(orgName);
    

      systemName = "CCSI Door Access"; //optional title override

      var panelTitleT;
      var panelSubtextT;

      if (userList.length) {
        if (userList.length === 1) {
          panelTitleT = `${userList.length} User at ${orgName}`;
        }
        else {
          panelTitleT = `${userList.length} Users at ${orgName}`;
        }
        panelSubtextT = "Please Select a User";
      }
      else {
        panelTitleT = `No Users at ${orgName}`;
        panelSubtextT = "Please Add a User";
      }
    
      res.render('global_users', { users: userList, sidebar: sidebarList, sideTitle: systemName, navTitle: `${orgName}`, panelTitle: panelTitleT, panelSubtext: panelSubtextT, orgID: req.params.orgID});


    });

} catch ( err ) {
  console.log(err)
} finally {
  //await db.close();
}

});

module.exports = globalUsersRouter;
