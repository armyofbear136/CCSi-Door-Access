const fs = require("fs");
const { stringify } = require("csv-stringify");

let CSVfun = {};

CSVfun.generate = async function(path, data) {

  return new Promise(function(resolve, reject) {
    const writeableStream = fs.createWriteStream('csv_export/'+path);
    var stringifier;
    for (i in data)
    {
      if (i == 0){
        stringifier = stringify({ header: true, columns: data[i]});
        console.log(data[i].toString());
      }
      else {
        console.log(`${data[i].toString()}`);
        stringifier.write(data[i]);
      }
    }
    resolve(stringifier.pipe(writeableStream));
    }
  )
};


module.exports = CSVfun;
  
  //exports.getList = getList;