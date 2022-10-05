function executeQuery(query, callback) {
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
  }
  
  
  function getResult(query,callback) {
    executeQuery(query, function (err, rows) {
       if (!err) {
          callback(null,rows);
       }
       else {
          callback(true,err);
       }
    });
  }
  
  function getServers() {
    getResult("select * from table",function(err,rows){
      if(!err){
          return rows;
      }else{
          console.log(err);
      }
    });   
  }

  const aSQL = async function asyncSQL(db, sql, insertARR) {

    await db.query(sql, [insertARR], function(err) {
      if (err) throw err;
      // db.end();
    });
  }

  module.export = aSQL;
  
  //exports.getList = getList;