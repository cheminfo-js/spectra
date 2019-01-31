/* eslint-disable no-console */


const fs = require('fs');

const OCLE = require('openchemlib-extended');
const stat = require('ml-stat/array');
const sdfParser = require('sdf-parser');

const maxSphereSize = 5;

const sdf = fs.readFileSync(`${__dirname}/nmrshiftdb2withsignals.sd`, 'utf8');
// const sdf = fs.readFileSync(`${__dirname}/gg.sd`, 'utf8');

const parsedSdf = sdfParser(sdf, { mixedEOL: true });

const db13C = [];
const db1H = [];
for (let k = 0; k < maxSphereSize; k++) {
  db13C.push({});
  db1H.push({});
}

console.log(parsedSdf.molecules.length);
// for (let i = 0; i < 1; i++) {
for (let i = 0; i < parsedSdf.molecules.length; i++) {
  if (i % 100 === 0) {
    console.log(i);
  }
  const molecule = parsedSdf.molecules[i];
  const mol = OCLE.Molecule.fromMolfile(molecule.molfile);
  const fields = Object.keys(molecule);

  fillDb(molecule, mol, fields, 'C', 'Spectrum 13C', db13C);
  fillDb(molecule, mol, fields, 'H', 'Spectrum 1H', db1H);
}

[db13C, db1H].forEach((db) => {
  db.forEach((hoseMap) => {
    for (const hose of Object.keys(hoseMap)) {
      hoseMap[hose] = getStats(hoseMap[hose]);
    }
  });
});

fs.writeFileSync(`${__dirname}/../data/nmrshiftdb2-13c.json`, JSON.stringify(db13C));
fs.writeFileSync(`${__dirname}/../data/nmrshiftdb2-1h.json`, JSON.stringify(db1H));

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

function fillDb(molecule, mol, fields, atomLabel, fieldLabel, db) {
  let extendedDiaIds = null;
  if (atomLabel === 'H') {
    extendedDiaIds = getExtendedDiaIds(mol);
  }

  fields = fields.filter((field) => field.startsWith(fieldLabel));
  if (fields.length === 0) return;
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
