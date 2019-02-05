/** Merge 2 hose code databases in a single one*/


const fs = require('fs');
const stat = require('ml-stat/array');


const maxSphereSize = 5;

let db1 = JSON.parse(fs.readFileSync(`${__dirname}/../data/nmrshiftdb2-1h-full.json`).toString());
let db2 = JSON.parse(fs.readFileSync(`${__dirname}/../data/nemo-1h-full.json`).toString());

mergeDB(db1, db2);

fs.writeFileSync(`${__dirname}/../data/db-1h-full.json`, JSON.stringify(db1));

[db1].forEach((db) => {
  db.forEach((hoseMap) => {
    for (const hose of Object.keys(hoseMap)) {
      hoseMap[hose] = getStats(hoseMap[hose]);
    }
  });
});
// fs.writeFileSync(`${__dirname}/../data/nemo-13c-full.json`, JSON.stringify(db13C));
fs.writeFileSync(`${__dirname}/../data/db-1h.json`, JSON.stringify(db1));

function mergeDB(db, tmpDB) {
  if (tmpDB && tmpDB.length >= maxSphereSize) {
    for (let k = 0; k < maxSphereSize; k++) {
      let keys = Object.keys(tmpDB[k]);
      if (keys && keys.length > 0) {
        for (let hoseCode of keys) {
          if (!db[k][hoseCode]) {
            db[k][hoseCode] = [];
          }
          db[k][hoseCode].push(...tmpDB[k][hoseCode]);
        }
      }
    }
  }
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
