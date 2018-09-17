
const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

function start() {
  var testSet = JSON.parse(loadFile('/../data/assigned298.json'));// File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  testSet.forEach((row) => {
    var molecule = OCLE.Molecule.fromMolfile(row.molfile.replace(/\\n/g, '\n'));
    molecule.addImplicitHydrogens();

    let diaID = molecule.getIDCode();
    if (diaID !== row.diaID) {
      // console.log(diaID + ' ' + row.diaID);
    }
  });
}

start();
