const fs = require("fs");
const path = require("path");
const { stringify } = require("csv-stringify");

let CSVfun = {};

CSVfun.generate = async function(path, data) {

  var dir = 'csv_export/generated/';

  // file wont stop being in use so can't delete right now, but would like auto cleanup
  // await emptyDir('./csv_export/generated/');
  

  return new Promise(function(resolve, reject) {
    
    // fs.rm(dir, { recursive: true }, callback)
    let newDir = path.split("/");
    if (!fs.existsSync(dir+newDir[0])){
      fs.mkdirSync(dir+newDir[0]);
  }
    const writeableStream = fs.createWriteStream(dir+path);
    var stringifier;
    for (i in data)
    {
      if (i == 0){
        stringifier = stringify({ header: true, columns: data[i]});
        // console.log(data[i].toString());
      }
      else {
        // console.log(`${data[i].toString()}`);
        stringifier.write(data[i]);
      }
    }
    // console.log(stringifier);
    resolve(stringifier.pipe(writeableStream));
    // writeableStream.end();
    // writeableStream.once('finish', () => resolve());
    // // stringifier.on('error', reject);
    }
  )
};

function emptyDir(dirPath) {
  const dirContents = fs.readdirSync(dirPath); // List dir content
  return new Promise((resolve, reject) => {
    for (const fileOrDirPath of dirContents) {
      try {
        // Get Full path
        const fullPath = path.join(dirPath, fileOrDirPath);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // It's a sub directory
          if (fs.readdirSync(fullPath).length) emptyDir(fullPath);
          // If the dir is not empty then remove it's contents too(recursively)
          fs.rmdirSync(fullPath);
        } else fs.unlinkSync(fullPath); // It's a file
      } catch (ex) {
        reject(console.error(ex.message));
      }
    }
    console.log('resolved');
    resolve(true);
  });
}


module.exports = CSVfun;
  
  //exports.getList = getList;