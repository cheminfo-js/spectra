import FS from 'fs';
import path from 'path';

import OCLE from 'openchemlib-extended';

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

function start() {
  let testSet = JSON.parse(loadFile('/../data/assigned298.json')); // File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  testSet.forEach((row) => {
    let molecule = OCLE.Molecule.fromMolfile(row.molfile.replace(/\\n/g, '\n'));
    molecule.addImplicitHydrogens();

    let diaID = molecule.getIDCode();
    if (diaID !== row.diaID) {
      // console.log(diaID + ' ' + row.diaID);
    }
  });
}

start();
