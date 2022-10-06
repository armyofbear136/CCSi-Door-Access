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

module.exports = SQLfun;
  
  //exports.getList = getList;