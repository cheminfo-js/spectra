/** Merge 2 hose code databases in a single one*/
const stat = require('ml-stat/array');

let mergeDB = function(db1, db2, maxSphereSize) {
  if(db1.length >= db2.length) {
    return merge(db1, db2, maxSphereSize);
  }
  else {
    return merge(db2, db1, maxSphereSize);
  }
}

let reduceDB = function(db1) {
  [db1].forEach((db) => {
    db.forEach((hoseMap) => {
      for (const hose of Object.keys(hoseMap)) {
        hoseMap[hose] = getStats(hoseMap[hose]);
      }
    });
  });
  return db1;
}

function merge(db, tmpDB, maxSphereSize) {
  let result = db.slice();
  if (tmpDB && tmpDB.length >= 0) {
    for (let k = 0; k < maxSphereSize && k < tmpDB.length; k++) {
      let keys = Object.keys(tmpDB[k]);
      if (keys && keys.length > 0) {
        for (let hoseCode of keys) {
          if (!result[k][hoseCode]) {
            result[k][hoseCode] = [];
          }
          result[k][hoseCode].push(...tmpDB[k][hoseCode]);
        }
      }
    }
  }
  return result;
}

function getStats(entry) {
  const minMax = stat.minMax(entry);
  return {
    min: minMax.min,
    max: minMax.max,
    ncs: entry.length,
    mean: stat.mean(entry),
    median: stat.median(entry),
    std: stat.standardDeviation(entry, false)
  };
}

module.exports = {mergeDB, reduceDB};
