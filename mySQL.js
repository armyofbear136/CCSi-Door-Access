let SQLfun = {};

SQLfun.executeQuery = function(query, callback) {
    pool.getConnection(function (err, connection) {
      if (err) {
          return callback(err, null);
      }
      else if (connection) {
          connection.query(query, function (err, rows, fields) {
              connection.release();
              if (err) {
                  return callback(err, null);
              }
              return callback(null, rows);
          })
      }
      else {
          return callback(true, "No Connection");
      }
    });
  };
  
  
SQLfun.getResult = function(query,callback) {
    executeQuery(query, function (err, rows) {
       if (!err) {
          callback(null,rows);
       }
       else {
          callback(true,err);
       }
    });
  };
  
SQLfun.getServers = function() {
    getResult("select * from table",function(err,rows){
      if(!err){
          return rows;
      }else{
          console.log(err);
      }
    });   
  };

SQLfun.aSQL = async function(db, sql, insertARR) {

    await db.query(sql, [insertARR], function(err) {
      if (err) throw err;
      // db.end();
    });
  }

SQLfun.getSites = async function(db, companyID) {

  return new Promise(function(resolve, reject){
    db.query(
      `
      SELECT * FROM sites
      WHERE company_id_sites = ${companyID};
      `,
        function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
        }
    )}
  )};

SQLfun.getCompanyInfo = async function(db, companyID) {

  return new Promise(function(resolve, reject){
    db.query(
      `
      SELECT * FROM companies
      WHERE id = ${companyID};
      `,
        function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
        }
    )}
  )};

  SQLfun.getSiteInfo = async function(db, siteID) {

    return new Promise(function(resolve, reject){
      db.query(
        `
        SELECT
          si.*,
          d.companyName,
          d.orgName
        FROM sites si
        JOIN (
          SELECT c.id as id, c.name as companyName, c.org as orgName
          FROM companies c
        ) d ON (si.company_id_sites = d.id)
        WHERE si.id = ${siteID}
        ORDER BY name ASC`,
          function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
          }
      )}
    )};

  SQLfun.getUsersInfo = async function(db, siteID) {
    console.log("getting user info");

    return new Promise(function(resolve, reject){
      db.query(
        `
        SELECT
        u.*,
        d.companyName,
        d.orgName,
        d.siteName,
        GROUP_CONCAT ( DISTINCT dg.name ORDER BY dg.name SEPARATOR ', ' ) as "doorgroups"
        FROM users u
        JOIN (
          SELECT c.id as id, c.name as companyName, c.org as orgName, s.id as siteID, s.name as siteName
          FROM companies c
          JOIN (
            SELECT sit.id as id, sit.name as name, sit.company_id_sites as company_id_sites
            FROM sites sit
          ) s ON (c.id = s.company_id_sites)
        ) d ON (u.site_id_users = d.siteID)
          LEFT JOIN access_groups ag ON u.id = ag.user_id
          LEFT JOIN door_groups dg ON ag.group_id = dg.id
        WHERE site_id_users = ${siteID} 
        GROUP BY u.id
        ORDER BY last_name ASC`,
          function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
          }
      )}
    )};

    SQLfun.getDoorsInfo = async function(db, siteID) {
      console.log("getting doors info");
  
      return new Promise(function(resolve, reject){
        db.query(
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
          WHERE ds.site_id_doors = ${siteID}
          ORDER BY name ASC`,
          function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
          }
      )}
    )};

    SQLfun.getDoorsInfoSimple = async function(db, siteID) {
      console.log("getting doors info");
  
      return new Promise(function(resolve, reject){
        db.query(
          ` SELECT ds.id, ds.name, ds.ip, ds.status, ds.alarm, ds.site_id_doors, ds.last_access, ds.tamper, ds.reader
          FROM doors ds
          WHERE ds.site_id_doors = ${siteID}
          ORDER BY name ASC`,
          function(err, result){                                                
            if(result === undefined){
                reject(new Error("Error result is undefined"));
            }else{
                resolve(result);
            }
          }
      )}
    )};

module.exports = SQLfun;
  
  //exports.getList = getList;
