'use strict';

const newArray = require('new-array');
const superagent = require('superagent');
const group = require('spectra-nmr-utilities').group;
const normalizeOptions = require('./normalizeOptions');

/**
 * Makes a prediction using spinus
 * @param {string|Molecule} molecule
 * @param {object} [options]
 * @return {Promise<Array>}
 */
module.exports = function spinus(molecule, options) {
    [molecule, options] = normalizeOptions(molecule, options);
    return fromSpinus(molecule).then(prediction => {
        if (options.group) {
            prediction = group(prediction);
        }
        return prediction;
    });
};

function fromSpinus(molecule) {
    const request = superagent.post('https://www.nmrdb.org/service/predictor');
    request.field('molfile', molecule.toMolfile());

    return request.then(response => {
        //Convert to the ranges format and include the diaID for each atomID
        const data = spinusParser(response.text);
        const ids = data.ids;
        const jc = data.couplingConstants;
        const cs = data.chemicalShifts;
        const multiplicity = data.multiplicity;
        const integrals = data.integrals;
        const nspins = cs.length;
        const diaIDs = molecule.getGroupedDiastereotopicAtomIDs({atomLabel: 'H'});
        const distanceMatrix = molecule.getConnectivityMatrix({pathLength: true});
        var result = new Array(nspins);
        var atoms = {};
        var atomNumbers = [];
        var i, j, k, oclID, tmpCS;
        var csByOclID = {};
        for (j = diaIDs.length - 1; j >= 0; j--) {
            oclID = diaIDs[j].oclID + '';
            for (k = diaIDs[j].atoms.length - 1; k >= 0; k--) {
                atoms[diaIDs[j].atoms[k]] = oclID;
                atomNumbers.push(diaIDs[j].atoms[k]);
                if (!csByOclID[oclID]) {
                    csByOclID[oclID] = {nc: 1, cs: cs[ids[diaIDs[j].atoms[k]]]};
                } else {
                    csByOclID[oclID].nc++;
                    csByOclID[oclID].cs += cs[ids[diaIDs[j].atoms[k]]];
                }
            }
        }

        var idsKeys = Object.keys(ids);
        for (i = 0; i < nspins; i++) {
            tmpCS = csByOclID[atoms[idsKeys[i]]].cs / csByOclID[atoms[idsKeys[i]]].nc;
            result[i] = {
                atomIDs: [idsKeys[i]], //It's not in eln format
                diaIDs: [atoms[idsKeys[i]]],
                nbAtoms: integrals[i],
                delta: tmpCS,
                atomLabel: 'H',
                j: []
            };

            for (j = 0; j < nspins; j++) {
                if (jc[i][j] !== 0) {
                    result[i].j.push({
                        assignment: [idsKeys[j]],
                        diaID: atoms[idsKeys[j]],
                        coupling: jc[i][j],
                        multiplicity: multiplicity[j],
                        distance: distanceMatrix[idsKeys[i]][idsKeys[j]]
                    });
                }
            }
        }
        return result;
    });
}

function spinusParser(result) {
    var lines = result.split('\n');
    var nspins = lines.length - 1;
    var cs = new Array(nspins);
    var integrals = new Array(nspins);
    var ids = {};
    var jc = new Array(nspins);
    var i, j;

    for (i = 0; i < nspins; i++) {
        jc[i] = newArray(nspins, 0);
        var tokens = lines[i].split('\t');
        cs[i] = +tokens[2];
        ids[tokens[0] - 1] = i;
        integrals[i] = 1;//+tokens[5];//Is it always 1??
    }

    for (i = 0; i < nspins; i++) {
        tokens = lines[i].split('\t');
        var nCoup = (tokens.length - 4) / 3;
        for (j = 0; j < nCoup; j++) {
            var withID = tokens[4 + 3 * j] - 1;
            var idx = ids[withID];
            jc[i][idx] = (+tokens[6 + 3 * j]);
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
        multiplicity: newArray(nspins, 'd')
    };
}
