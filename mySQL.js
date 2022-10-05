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

    // try {
    // await db.query(
    //   `
    //   SELECT * FROM sites
    //   WHERE company_id_sites = ${companyID};
    //   `,
    //   async function (err, result, fields) {

    //     if (err){ 
    //         console.log(typeof(err));
    //         for (var k in err){
    //           console.log(`${k}: ${err[k]}`);
    //         }
    //         // throw err
    //       };
          
    //       // console.log(result);
    //       let data = result;
    //       // return data;
    //     });


    //   }catch ( err ) {
    //     console.log(err)
    //   } finally {
    //     //await db.close();
    //   }
  // };

SQLfun.test = async function(number) {
  console.log("Test");
    return number;
  };

module.exports = SQLfun;
  
  //exports.getList = getList;