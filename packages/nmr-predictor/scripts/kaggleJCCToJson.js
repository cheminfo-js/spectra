
const fs = require('fs');

const OCLE = require('../../../../core');
const getAllPaths = require('../../getAllPaths');
const getAllCouplings = require('../new/getAllCouplings');

const dataFolder = '/home/acastillo/Documents/kaggle/champs-scalar-coupling/';
const structuremol = `${dataFolder}structuresmol/`;

var train = fs.readFileSync(`${dataFolder}train.csv`).toString().split('\n');
let head = train[0];
// console.log(head);
let molid = '';
let couplings = null;
let max = train.length - 1;
let stats = {};
let map = [];
let db = {};
for (let i = 1; i < max; i++) {
  let example = train[i].split(',');
  example[0] = Number(example[0]);
  example[2] = Number(example[2]);
  example[3] = Number(example[3]);
  example[5] = Number(example[5]);
  // console.log(example);
  if (!db[example[4]]) {
    db[example[4]] = [{}, {}, {}];
    stats[example[4]] = 0;
  }

  stats[example[4]]++;

  if (i % 10000 === 0) {
    console.log(i / max * 100);
  }

  // Change of molecule
  if (example[1] !== molid) {
    storeData(couplings, db);
    molid = example[1];
    // Open the molecule
    let result = OCLE.Molecule.fromMolfileWithAtomMap(fs.readFileSync(`${structuremol + molid}.mol`).toString());
    map = result.map;
    // console.log(fs.readFileSync(`${structuremol + molid}.mol`).toString());
    // console.log(map)
    // allPaths = result.molecule.getAllPaths({ fromLabel: 'H', maxLength: 3 });
    couplings = getAllCouplings(result.molecule, { fromLabel: 'H', toLabel: '', maxLength: 3 });
    // console.log(couplings)
    // console.log(couplings[2].fromDiaID + '\n' + couplings[2].toDiaID + '\n' + couplings[2].code.join('\n'));
  }

  let group = couplings.find((value) => {
    return value.fromTo.find((pair) => {
      return map[pair[0]] === example[2] && map[pair[1]] === example[3];
    }) != null;
  });

  if (!group) {
    console.log(example);
  }

  if (!group.coupling) {
    group.coupling = [];
  }
  group.coupling.push(example[5]);
  group.kind = example[4];
}

// console.log(JSON.stringify(allPaths));
// console.log(allPaths);
storeData(couplings, db);
console.log(JSON.stringify(db));


function storeData(couplings, result) {
  if (couplings !== null) {
    for (let path of couplings) {
      let db = result[path.kind];
      if (path.code && path.coupling) {
        for (let k = 0; k < path.code.length; k++) {
          if (!db[k][path.code[k]]) {
            db[k][path.code[k]] = path.coupling.slice();
          } else {
            db[k][path.code[k]].push(...path.coupling.slice());
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
