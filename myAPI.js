let APIfun = {};
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
// import fetch from 'node-fetch';
const fetch = require('node-fetch');
const DigestFetch = require('digest-fetch');

APIfun.downloadFile = async function(fileUrl, outputLocationPath) {
  const writer = fs.createWriteStream(outputLocationPath);

  return axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then(response => {

    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}

APIfun.digestor = async function (url, username, password, options){
const client = new DigestFetch(username, password);
 return client.fetch(url, options)
  .then(resp=>resp.json())
  // .then(data=>console.log(data))
  .catch(e=>console.error(e))
}

APIfun.axisParseAllEvents = async function(jsonData){
  return new Promise(function(resolve, reject) {
    let cardEventArray = [
      [
        "cardraw",
        "cardnr",
        "access_time",
        "reader"
      ]
    ];
    let doorEventArray = [
      [
        "doorname",
        "doorevent",
        "doorstatus",
        "access_time"
      ]
    ];
    for (i in jsonData){
      let foundDoorRequest = false;
      let foundDoorToken = false;
      let foundDoorName = '';
      let foundCardHex = '';

      for (k in jsonData[i].KeyValues){
        //check for tag being used
        if (jsonData[i].KeyValues[k].Key == 'CardNrHex'){
          // console.log(jsonData[i].UtcTime);
          foundDoorRequest = true;
          foundCardHex = jsonData[i].KeyValues[k].Value
        }
        //check if value is a door
        if (jsonData[i].KeyValues[k].Key == 'DoorToken'){
          foundDoorToken = true;
          for (t in jsonData[i].KeyValues[k].Tags){
            if (jsonData[i].KeyValues[k].Tags[t].slice(0,5) == 'evvnn'){
              // console.log(jsonData[i].UtcTime);
              let tempDoorName = jsonData[i].KeyValues[k].Tags[t].slice(6, jsonData[i].KeyValues[k].Tags[t].length);
              // console.log('Door : ' + tempDoorName);
              foundDoorName = tempDoorName;
            }
          }
        }

        //grab info for tag request
        if (foundDoorRequest){
          if (jsonData[i].KeyValues[k].Key == 'Card' || jsonData[i].KeyValues[k].Key == 'CardNr'){
            let tempValue = jsonData[i].KeyValues[k].Value;
            if (jsonData[i].KeyValues[k].Key == 'CardNr'){
              cardEventArray.push([foundCardHex,tempValue,(jsonData[i].UtcTime.slice(0,10)+' '+jsonData[i].UtcTime.slice(12,19))]);
            }
            // console.log(tempKey + ' ' + tempValue);
          }
        }

        //grab door status info
        if (foundDoorToken){
          if (jsonData[i].KeyValues[k].Key == 'State'){
            for (t in jsonData[i].KeyValues[k].Tags)
            {
              if (jsonData[i].KeyValues[k].Tags[t].slice(0,5) == 'evknn')
              {
                let tempValue = jsonData[i].KeyValues[k].Value;
                let tempTag = jsonData[i].KeyValues[k].Tags[t].slice(6, jsonData[i].KeyValues[k].Tags[t].length);
                doorEventArray.push([foundDoorName,tempTag,tempValue,(jsonData[i].UtcTime.slice(0,10)+' '+jsonData[i].UtcTime.slice(12,19))]);
                // console.log(tempValue + ' : ' + tempTag);
              }
            }
            
          }
        }
      }
      //push door reader since out of sequence check needed
      if (foundDoorRequest){
        cardEventArray[cardEventArray.length-1].push(jsonData[i].KeyValues[1].Value);
      }
    }
    console.log('finished parsing');
    resolve ({door_events: doorEventArray, card_events: cardEventArray});
  });
    

}


APIfun.axisParseLastEvents = async function(jsonData){
  return new Promise(function(resolve, reject) {
    let lastEvents = {Doors : {}, Fobs : {}};
    for (i in jsonData){

      let foundDoorRequest = false;
      let foundDoorToken = false;
      let foundDoorName = '';
      let foundCardHex = '';

      for (k in jsonData[i].KeyValues){
        //check for tag being used
        if (jsonData[i].KeyValues[k].Key == 'CardNrHex'){
          // console.log(jsonData[i].UtcTime);
          foundDoorRequest = true;
          foundCardHex = jsonData[i].KeyValues[k].Value
        }
        //check if value is a door
        if (jsonData[i].KeyValues[k].Key == 'DoorToken'){
          foundDoorToken = true;
          for (t in jsonData[i].KeyValues[k].Tags){
            if (jsonData[i].KeyValues[k].Tags[t].slice(0,5) == 'evvnn'){
              // console.log(jsonData[i].UtcTime);
              let tempDoorName = jsonData[i].KeyValues[k].Tags[t].slice(6, jsonData[i].KeyValues[k].Tags[t].length);
              // console.log('Door : ' + tempDoorName);
              foundDoorName = tempDoorName;
            }
          }
        }

        //grab info for tag request
        if (foundDoorRequest){
          if (jsonData[i].KeyValues[k].Key == 'Card' || jsonData[i].KeyValues[k].Key == 'CardNr'){
            let tempKey = jsonData[i].KeyValues[k].Key;
            let tempValue = jsonData[i].KeyValues[k].Value;
            if (!lastEvents.Fobs[foundCardHex]){
              lastEvents.Fobs[foundCardHex] = {};
            }
            lastEvents.Fobs[foundCardHex]['Accessed'] = (jsonData[i].UtcTime.slice(0,10)+' '+jsonData[i].UtcTime.slice(12,19));
            lastEvents.Fobs[foundCardHex][tempKey] = tempValue;
            // console.log(tempKey + ' ' + tempValue);
          }
        }

        //grab door status info
        if (foundDoorToken){
          if (jsonData[i].KeyValues[k].Key == 'State'){
            for (t in jsonData[i].KeyValues[k].Tags)
            {
              if (jsonData[i].KeyValues[k].Tags[t].slice(0,5) == 'evknn')
              {
                let tempValue = jsonData[i].KeyValues[k].Value;
                let tempTag = jsonData[i].KeyValues[k].Tags[t].slice(6, jsonData[i].KeyValues[k].Tags[t].length);
                if (!lastEvents.Doors[foundDoorName]){
                  lastEvents.Doors[foundDoorName] = {};
                }
                lastEvents.Doors[foundDoorName]['Accessed'] = (jsonData[i].UtcTime.slice(0,10)+' '+jsonData[i].UtcTime.slice(12,19));
                lastEvents.Doors[foundDoorName][tempTag] = tempValue;
                // console.log(tempValue + ' : ' + tempTag);
              }
            }
            
          }
        }
      }
    }
    console.log('finished parsing');
    resolve(lastEvents);
  });

}

module.exports = APIfun;
  
  //exports.getList = getList;