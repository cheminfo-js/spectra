/* eslint-disable no-console */

const cluster = require('cluster');
const fs = require('fs');
const OCLE = require('openchemlib-extended');
const stat = require('ml-stat/array');
const xml2js = require('xml2js');


const maxSphereSize = 5;

function loadFile(filename) {
  return fs.readFileSync(filename).toString();
}

const testFolder = '/home/acastillo/Documents/DataSet/jdx/';

const jcamps = fs.readdirSync(testFolder);

function logger(message) {
  console.log(message);
}

// const db13C = [];
const db1H = [];
for (let k = 0; k < maxSphereSize; k++) {
  // db13C.push({});
  db1H.push({});
}

if (cluster.isMaster) {
  var max = jcamps.length;
  var numWorkers = require('os').cpus().length;

  logger(`Master cluster setting up ${numWorkers} workers...`);

  let workers = [];
  for (var i = 0; i < numWorkers; i++) {
    let worker = cluster.fork();
    workers.push(worker);
  }

  cluster.on('message', function (worker, message) {
    if (message && message.h) {
      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
      if (counter <= max) {
        mergeDB(db1H, message.h);
      // mergeDB(db13C, message.c);
      }
      if (counter === max) {
        fs.writeFileSync(`${__dirname}/../data/nemo-1h-full.json`, JSON.stringify(db1H));

        [db1H].forEach((db) => {
          db.forEach((hoseMap) => {
            for (const hose of Object.keys(hoseMap)) {
              hoseMap[hose] = getStats(hoseMap[hose]);
            }
          });
        });
        // fs.writeFileSync(`${__dirname}/../data/nemo-13c-full.json`, JSON.stringify(db13C));
        fs.writeFileSync(`${__dirname}/../data/nemo-1h.json`, JSON.stringify(db1H));
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
  begin(jcamps, workers);
}
if (cluster.isWorker) {
  // Receive messages from the master process.
  const OCLE = require('openchemlib-extended');

  process.on('message', function (msg) {
    if (msg && msg.fileName) {
      let fileName = msg.fileName;
      console.log(fileName);
      let jcamp = loadFile(fileName);
      let h = [];
      if (jcamp.indexOf('##$NEMO VIEW=') >= 0 && jcamp.indexOf('##.OBSERVE NUCLEUS= ^1H') > 0) {
        // TODO: Perhaps there is a better rule for the end of the string
        let data = jcamp.substring(jcamp.indexOf('##$NEMO VIEW=') + 13, jcamp.indexOf('##.ACQUISITION MODE='));
        let buff = Buffer.from(data, 'base64');
        let text = buff.toString('ascii');
        if (text.indexOf('IDCode="') > 0) {
          let parser = new xml2js.Parser();
          parser.parseString(text, function (err, result) {
            let spectraDisplay = result['nemo.SpectraDisplay'];
            let actMoleculeDisplay = spectraDisplay['moldraw.ActMoleculeDisplay'][0];
            let oclId = actMoleculeDisplay.$.IDCode + actMoleculeDisplay.$.EncodedCoordinates;
            let atoms = actMoleculeDisplay['moldraw.ActAtomEntity'].map((entry) => entry.$);

            let spectra = spectraDisplay['nemo.Spectra'][0];
            if (spectra['nemo.SmartPeakLabel']) {
              let integrals = [];
              // In the oldest format the integrals were serialized in a different field than the peakLabels
              if (spectra['nemo.Integral']) {
                integrals = spectra['nemo.Integral'].map((entry) => entry.$);
              }
              let smartPeakLabels = spectra['nemo.SmartPeakLabel'].map((entry) => entry.$);
              const mol = OCLE.Molecule.fromIDCode(oclId);
              let molecule = { atoms, integrals, smartPeakLabels };

              // let h = fillDb(molecule, mol, '', 'C', '', maxSphereSize); //Use this if ##.OBSERVE NUCLEUS= ^13C
              h = fillDb(molecule, mol, '', 'H', '', maxSphereSize);
            }
            if (err) {
              console.log('Fail');
            }
          });
        }
      }
      process.send({ h });
    }
  });
}

function begin(dataset, workers) {
  // Run the learning process. After each iteration the system has seen every single molecule once
  try {
    // logger(predictor.databases);
    // we could now loop on the sdf to add the int index
    for (let i = 0; i < dataset.length; i++) {
      workers[i % workers.length].send({ fileName: testFolder + dataset[i] });
    }
  } catch (e) {
    logger(e);
  }
}

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

  const allAssignments = molecule.smartPeakLabels.map((field) => {
    // It only works if UNITS is PPM.
    let delta1 = (Number(field.startXUnits) + Number(field.stopXUnits)) / 2;
    let oclIds = null;
    // There is a better guess in nmrSignal1D
    if (field.nmrSignal1D) {
      let nmrSignal1D = JSON.parse(field.nmrSignal1D);
      delta1 = nmrSignal1D.delta1;
      // In the new format, the assignment was stored inside the nmrSignal1D. But we cannot use it because the diaIDs have changed.
      oclIds = nmrSignal1D.diaIDs;
    }

    let nbLinks = parseInt(field.nbLinks, 10);
    let result = [];
    for (let i = 0; i < nbLinks; i++) {
      var linkId = field['link' + i];
      if (linkId) {
        // Look for this ID within the list of integral
        let linkedIntegral = molecule.integrals.filter((integral) => integral.uniqueID === linkId );
        if (linkedIntegral && linkedIntegral.length > 0) {
          let nbLinksIntegral = parseInt(linkedIntegral[0].nbLinks, 10);
          for (let k = 0; k < nbLinksIntegral; k++) {
            linkId = linkedIntegral[0]['link' + k];
            // Look for this ID within the list of atom directly
            let assignedAtom = molecule.atoms.filter((atom) => atom.uniqueID === linkId );
            if (assignedAtom && assignedAtom.length > 0) {
              result.push({ delta1: delta1, atomID: assignedAtom[0].atomID, oclIds });
            }
          }
        } else {
          // Look for this ID within the list of atom directly
          let assignedAtom = molecule.atoms.filter((atom) => atom.uniqueID === linkId);
          if (assignedAtom && assignedAtom.length > 0) {
            result.push({ delta1: delta1, atomID: assignedAtom[0].atomID, oclIds });
          }
        }
      }
    }
    return result;
  }).filter((entry) => (entry && entry.length > 0)).reduce((a, b) => a.concat(...b), []);

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
    const chemicalShift = 0 + assignment.delta1;
    const atomId = assignment.atomID;
    const refAtom = atoms[atomId];
    // Those 2 oclID should be the same, but they are not!. So we cannot rely on the oclIDs stored in the nmrSignal1D
    // console.log(refAtom.oclID + ' --- ' + assignment.oclIds);
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
