/** Merge 2 hose code databases in a single one*/
const fs = require('fs');
const utils = require('./dbutils');


const maxSphereSize = 6;

let db1 = JSON.parse(fs.readFileSync(`${__dirname}/../data/nmrshiftdb2-1h-full.json`).toString());
let db2 = JSON.parse(fs.readFileSync(`${__dirname}/../../nmr-learning/data/h_full_25.json`).toString());

db1 = utils.mergeDB(db1, db2, maxSphereSize);

fs.writeFileSync(`${__dirname}/../data/db-1h-full.json`, JSON.stringify(db1));

db1 = utils.reduceDB(db1);
// fs.writeFileSync(`${__dirname}/../data/nemo-13c-full.json`, JSON.stringify(db13C));
fs.writeFileSync(`${__dirname}/../data/db-1h.json`, JSON.stringify(db1));