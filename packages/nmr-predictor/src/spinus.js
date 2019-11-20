import newArray from 'new-array';
import superagent from 'superagent';
import { group } from 'spectra-nmr-utilities';

import normalizeOptions from './normalizeOptions';

/**
 * Makes a prediction using spinus
 * @param {string|Molecule} molecule - could be a string of molfile, smile or Molecule instance.
 * @param {object} options
 * @param {object} options.OCLE - to recicle the OCLE object for prediction.
 * @return {Promise<Array>}
 */
export default function spinus(molecule, options) {
  options = Object.assign(
    {},
    { keepMolfile: true, distanceMatrix: true },
    options,
  );
  [molecule, options] = normalizeOptions(molecule, options);
  return fromSpinus(molecule).then((prediction) => {
    return options.group ? group(prediction) : prediction;
  });
}

function fromSpinus(molecule) {
  const request = superagent.post('https://www.nmrdb.org/service/predictor');
  request.field('molfile', molecule.molfile);

  return request.then((response) => {
    // Convert to the ranges format and include the diaID for each atomID
    const data = spinusParser(response.text);
    const ids = data.ids;
    const jc = data.couplingConstants;
    const cs = data.chemicalShifts;
    const multiplicity = data.multiplicity;
    const integrals = data.integrals;
    const nspins = cs.length;
    const diaIDs = molecule.diaId;
    const distanceMatrix = molecule.distanceMatrix;
    let result = new Array(nspins);
    let atoms = {};
    let atomNumbers = [];
    let i, j, k, oclID, tmpCS;
    let csByOclID = {};
    for (j = diaIDs.length - 1; j >= 0; j--) {
      if (diaIDs[j].atomLabel === 'H') {
        oclID = `${diaIDs[j].oclID}`;
        for (k = diaIDs[j].atoms.length - 1; k >= 0; k--) {
          atoms[diaIDs[j].atoms[k]] = oclID;
          atomNumbers.push(diaIDs[j].atoms[k]);
          if (!csByOclID[oclID]) {
            csByOclID[oclID] = { nc: 1, cs: cs[ids[diaIDs[j].atoms[k]]] };
          } else {
            csByOclID[oclID].nc++;
            csByOclID[oclID].cs += cs[ids[diaIDs[j].atoms[k]]];
          }
        }
      }
    }

    let idsKeys = Object.keys(ids);
    for (i = 0; i < nspins; i++) {
      tmpCS = csByOclID[atoms[idsKeys[i]]].cs / csByOclID[atoms[idsKeys[i]]].nc;
      result[i] = {
        atomIDs: [idsKeys[i]], // It's not in eln format
        diaIDs: [atoms[idsKeys[i]]],
        nbAtoms: integrals[i],
        delta: tmpCS,
        atomLabel: 'H',
        j: [],
      };

      for (j = 0; j < nspins; j++) {
        if (jc[i][j] !== 0) {
          result[i].j.push({
            assignment: [idsKeys[j]],
            diaID: atoms[idsKeys[j]],
            coupling: jc[i][j],
            multiplicity: multiplicity[j],
            distance: distanceMatrix[idsKeys[i]][idsKeys[j]],
          });
        }
      }
    }
    return result;
  });
}

function spinusParser(result) {
  let lines = result.split('\n');
  let nspins = lines.length - 1;
  let cs = new Array(nspins);
  let integrals = new Array(nspins);
  let ids = {};
  let jc = new Array(nspins);
  let i, j;

  for (i = 0; i < nspins; i++) {
    jc[i] = newArray(nspins, 0);
    var tokens = lines[i].split('\t');
    cs[i] = +tokens[2];
    ids[tokens[0] - 1] = i;
    integrals[i] = 1; // +tokens[5];//Is it always 1??
  }

  for (i = 0; i < nspins; i++) {
    tokens = lines[i].split('\t');
    let nCoup = (tokens.length - 4) / 3;
    for (j = 0; j < nCoup; j++) {
      let withID = tokens[4 + 3 * j] - 1;
      let idx = ids[withID];
      jc[i][idx] = +tokens[6 + 3 * j];
    }
  }

  for (j = 0; j < nspins; j++) {
    for (i = j; i < nspins; i++) {
      jc[j][i] = jc[i][j];
    }
  }

  return {
    ids,
    chemicalShifts: cs,
    integrals,
    couplingConstants: jc,
    multiplicity: newArray(nspins, 'd'),
  };
}
