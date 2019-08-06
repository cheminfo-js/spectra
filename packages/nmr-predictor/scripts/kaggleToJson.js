
const fs = require('fs');

const OCLE = require('openchemlib-extended');

const maxSphereSize = 6;

const dataFolder = '/home/acastillo/Documents/kaggle/champs-scalar-coupling/';
const structuremol = `${dataFolder}structuresmol/`;

var train = fs.readFileSync(`${dataFolder}magnetic_shielding_tensors.csv`).toString().split('\n');

/**
molecule_name,atom_index,XX,YX,ZX,XY,YY,ZY,XZ,YZ,ZZ
dsgdb9nsd_000001,0,195.315,0,-0.0001,0,195.317,0.0007,-0.0001,0.0007,195.317
dsgdb9nsd_000001,1,31.341,-1.2317,4.0544,-1.2317,28.9546,-1.7173,4.0546,-1.7173,34.0861
dsgdb9nsd_000001,2,31.5814,1.2173,-4.1474,1.2173,28.9036,-1.6036,-4.1476,-1.6036,33.8967
dsgdb9nsd_000001,3,31.5172,4.1086,1.2723,4.1088,33.9068,1.695,1.2724,1.6951,28.9579
 */

let head = train.splice(0, 1);
// console.log(head);
let molid = '';
let max = train.length - 1;
// let molecule = null;
let map = [];
let db = { C: [], H: [], N: [], O: [], F: [] };
for (let label in db) {
  for (let k = 0; k < maxSphereSize; k++) {
    db[label].push({});
  }
}

let oclIds = null;
for (let i = 0; i < max; i++) {
  let example = train[i].split(',');
  let moleculeName = example.splice(0, 1)[0];
  let atomIndex = Number(example.splice(0, 1)[0]);
  let chemicalShift = (Number(example[0]) + Number(example[4]) + Number(example[8])) / 3;

  // Change of molecule
  if (moleculeName !== molid) {
    storeData(oclIds, db);
    molid = moleculeName;
    // Open the molecule
    let molObj = OCLE.Molecule.fromMolfileWithAtomMap(fs.readFileSync(`${structuremol + molid}.mol`).toString());
    map = molObj.map;
    // molecule = molObj.molecule;
    oclIds = molObj.molecule.getGroupedDiastereotopicAtomIDs();
    let cache = {};
    for (let oclId of oclIds) {
      // console.log(oclId);
      let hoseCodes = [];
      if (cache[oclId.oclID]) {
        hoseCodes = cache[oclId.oclID];
      } else {
        hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(oclId.oclID, { maxSphereSize, type: 0 });
        hoseCodes = hoseCodes.slice();
        cache[oclId.oclID] = hoseCodes;
      }
      oclId.hoses = hoseCodes;
    }
  }

  let group = oclIds.find((value) => {
    return value.atoms.find((atom) => {
      return map[atom] === atomIndex;
    }) != null;
  });

  if (!group.cs) {
    group.cs = [];
  }
  group.cs.push(chemicalShift);
}

// console.log(JSON.stringify(allPaths));
// console.log(allPaths);
storeData(oclIds, db);

console.log(JSON.stringify(db));

function storeData(oclIDs, result) {
  if (oclIDs !== null) {
    for (let oclID of oclIDs) {
      if (!result[oclID.atomLabel]) {
        result[oclID.atomLabel] = {};
      }
      let db = result[oclID.atomLabel];
      if (oclID.hoses && oclID.cs) {
        for (let k = 0; k < oclID.hoses.length; k++) {
          if (!db[k][oclID.hoses[k]]) {
            db[k][oclID.hoses[k]] = oclID.cs.slice();
          } else {
            db[k][oclID.hoses[k]].push(...oclID.cs.slice());
          }
        }
      }
    }
  }
}

// let examples = train.split('\n');

// console.log(examples.length);


/* var molecule = OCLE.Molecule.fromSmiles('CCC');
molecule.addImplicitHydrogens();
let result = getAllCouplings(molecule, {});
console.log(result);*/
