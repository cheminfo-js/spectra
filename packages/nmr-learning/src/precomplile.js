import FS from 'fs';

import OCLE from 'openchemlib-extended';

const cheminfo = require('./preprocess/cheminfo');
const maybridge = require('./preprocess/maybridge');
// const home = require('./preprocess/home');
// const c6h6 = require('./preprocess/c6h6');

async function start() {
  // var testSet = JSON.parse(loadFile('/../data/assigned298.json'));//File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  let dataset1 = cheminfo.load(
    '/home/acastillo/Documents/data/cheminfo443/',
    'cheminfo',
    { keepMolecule: true, OCLE: OCLE },
  );
  let dataset2 = maybridge.load(
    '/home/acastillo/Documents/data/maybridge/',
    'maybridge',
    { keepMolecule: true, OCLE: OCLE },
  );
  // var dataset3 = c6h6.load("/home/acastillo/Documents/data/output.json", "c6h6", {keepMolecule: true, OCLE: OCLE});
  // var dataset4 = home.load('/home/acastillo/Documents/DataSet/', 'home', { keepMolecule: true, OCLE: OCLE });

  FS.writeFileSync(
    '/home/acastillo/Documents/data/procjson/cheminfo443_no2.5.json',
    JSON.stringify(dataset1),
  );
  FS.writeFileSync(
    '/home/acastillo/Documents/data/procjson/maybridge_no2.5.json',
    JSON.stringify(dataset2),
  );
  // FS.writeFileSync('/home/acastillo/Documents/data/procjson/home_y.json', JSON.stringify(dataset4));
}

start();
