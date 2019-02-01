/* eslint-disable no-console */

var cluster = require('cluster');
const fs = require('fs');
const OCLE = require('openchemlib-extended');
const stat = require('ml-stat/array');
const sdfParser = require('sdf-parser');

const maxSphereSize = 5;

const sdf = fs.readFileSync(`${__dirname}/nmrshiftdb2withsignals.sd`, 'utf8');
const parsedSdf = sdfParser(sdf, { mixedEOL: true });

function logger(message) {
  console.log(message);
}

const db13C = [];
const db1H = [];
for (let k = 0; k < maxSphereSize; k++) {
  db13C.push({});
  db1H.push({});
}

if (cluster.isMaster) {
  var max = parsedSdf.molecules.length;
  var numWorkers = require('os').cpus().length;

  logger(`Master cluster setting up ${numWorkers} workers...`);

  let workers = [];
  for (var i = 0; i < numWorkers; i++) {
    let worker = cluster.fork();
    workers.push(worker);
  }

  cluster.on('message', function (worker, message) {
    if (message && message.c && message.h) {
      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
      if (counter <= max) {
        mergeDB(db1H, message.h);
        mergeDB(db13C, message.c);
      }
      if (counter === max) {
        [db13C, db1H].forEach((db) => {
          db.forEach((hoseMap) => {
            for (const hose of Object.keys(hoseMap)) {
              hoseMap[hose] = getStats(hoseMap[hose]);
            }
          });
        });
        fs.writeFileSync(`${__dirname}/../data/nmrshiftdb2-13c-full.json`, JSON.stringify(db13C));
        fs.writeFileSync(`${__dirname}/../data/nmrshiftdb2-1h-full.json`, JSON.stringify(db1H));
        logger('Process finished!');
      }
    }
  });

  cluster.on('online', function (worker) {
    logger(`Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', function (worker) {
    logger(`Starting a new worker ${worker.process.id}`);
    cluster.fork();
  });

  // Be notified when worker processes die.
  cluster.on('death', function (worker) {
    logger(`Worker ${worker.process.pid} died.`);
  });

  let counter = 0;
  begin(parsedSdf, workers);
}
if (cluster.isWorker) {
  // Receive messages from the master process.
  const OCLE = require('openchemlib-extended');

  process.on('message', function (msg) {
    if (msg && msg.molecule) {
      const molecule = msg.molecule;
      const mol = OCLE.Molecule.fromMolfile(molecule.molfile);
      const fields = Object.keys(molecule);

      let c = fillDb(molecule, mol, fields, 'C', 'Spectrum 13C', maxSphereSize);
      let h = fillDb(molecule, mol, fields, 'H', 'Spectrum 1H', maxSphereSize);

      // Return a promise to the master
      process.send({ c, h });
    }
  });
}

function begin(sdf, workers) {
  // Run the learning process. After each iteration the system has seen every single molecule once
  try {
    // logger(predictor.databases);
    // we could now loop on the sdf to add the int index
    for (let i = 0; i < sdf.molecules.length; i++) {
      workers[i % workers.length].send({ molecule: sdf.molecules[i] });
    }
  } catch (e) {
    logger(e);
  }
}

function mergeDB(db, tmpDB) {
  // try {
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
/**
 * Get the assigment for the given molecule
 * @param {object} molecule - a
 * @param {object} mol  - b
 * @param {string} fields - c
 * @param {string} atomLabel - d
 * @param {string} fieldLabel -e
 * @param {number} maxSphereSize -f
 *@return {Array}
 */
function fillDb(molecule, mol, fields, atomLabel, fieldLabel, maxSphereSize) {
  let extendedDiaIds = null;
  if (atomLabel === 'H') {
    extendedDiaIds = getExtendedDiaIds(mol);
  }

  let db = [];
  for (let k = 0; k < maxSphereSize; k++) {
    db.push({});
  }

  fields = fields.filter((field) => field.startsWith(fieldLabel));
  if (fields.length === 0) return db;
  const allAssignments = fields
    .map((field) => molecule[field])
    .reduce((result, assignmentString) => {
      const splitAssignments = assignmentString.split('|');
      splitAssignments.pop(); // last element is the empty string
      return result.concat(splitAssignments);
    }, []);

  if (!molecule.oclIds) {
    molecule.oclIds = mol.getGroupedDiastereotopicAtomIDs({ atomLabel: 'C' });
  }

  const diaIds = molecule.oclIds;

  const atoms = {};
  for (const diaId of diaIds) {
    for (const atom of diaId.atoms) {
      atoms[atom] = { oclID: diaId.oclID, values: [] };
    }
  }

  for (const assignment of allAssignments) {
    const signal = assignment.split(';');
    const chemicalShift = +signal[0];
    const atomId = signal[2];
    const refAtom = atoms[atomId];
    // todo Add throw
    //  if (!refAtom) throw new Error(`could not identify atom ${atomId} in entry ${molecule['nmrshiftdb2 ID']}`);
    if (refAtom) refAtom.values.push(chemicalShift);
  }

  let cache = {};
  for (const atom of Object.values(atoms)) {
    if (atom.values.length > 0) {
      const chemicalShift = stat.mean(atom.values);
      let oclIds = [atom.oclID];
      if (atomLabel === 'H') {
        oclIds = getHydrogensOf(atom.oclID, extendedDiaIds);
      }
      for (let oclId of oclIds) {
        let hoseCodes = [];
        if (cache[oclId]) {
          hoseCodes = cache[oclId];
        } else {
          hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(oclId, { maxSphereSize, type: 0 });
          cache[oclId] = hoseCodes;
        }
        for (let k = 0; k < maxSphereSize; k++) {
          const hoseCode = hoseCodes[k];
          if (hoseCode) {
            if (!db[k][hoseCode]) {
              db[k][hoseCode] = [];
            }
            db[k][hoseCode].push(chemicalShift);
          }
        }
      }
    }
  }
  return db;
}

function getHydrogensOf(oclId, extendedOclIds) {
  for (let i = 0; i < extendedOclIds.length; i++) {
    if (extendedOclIds[i].id === oclId) {
      return extendedOclIds[i].hydrogenOCLIDs;
    }
  }
  return [];
}

/**
 * Extends the diasterotopic atom ids to include information about the neighbourhood of the atoms
 * @param {OCLE.Molecule} mol - Input molecule
 * @return {Array}
 */
function getExtendedDiaIds(mol) {
  try {
    let newDiaIDs = [];
    let molecule = mol.getCompactCopy();
    molecule.addImplicitHydrogens();
    molecule.ensureHelperArrays(OCLE.Molecule.cHelperNeighbours);
    let diaIDs = molecule.getDiastereotopicAtomIDs();

    for (let i = 0; i < diaIDs.length; i++) {
      let diaID = diaIDs[i];
      let newDiaID = { id: diaID, atomLabel: molecule.getAtomLabel(i), atom: i, nbHydrogens: 0, hydrogenOCLIDs: [] };
      let maxI = molecule.getAllConnAtoms(i);
      for (let j = 0; j < maxI; j++) {
        let atom = molecule.getConnAtom(i, j);
        if (molecule.getAtomLabel(atom) === 'H') {
          newDiaID.nbHydrogens++;
          if (newDiaID.hydrogenOCLIDs.indexOf(diaIDs[atom]) < 0) {
            newDiaID.hydrogenOCLIDs.push(diaIDs[atom]);
          }
        }
      }
      newDiaIDs.push(newDiaID);
    }

    return newDiaIDs;
  } catch (e) {
    return [];
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
