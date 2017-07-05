/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const OCLE = require('openchemlib-extended-minimal');
const stat = require('ml-stat/array');

const maxSphereSize = 5;
const SPECTRUM13C = 'Spectrum 13C 0';

const sdf = fs.readFileSync(__dirname + '/nmrshiftdb2withsignals.sd', 'utf8');
const parser = new OCLE.SDFileParser(sdf, ['Solvent', SPECTRUM13C, 'nmrshiftdb2 ID']);

let missingAssignment = 0;
let total = 0;
const db = [];
for (let k = 0; k < maxSphereSize; k++) {
    db.push({});
}

let i = 0;

while (parser.next()) {
    if (i++ % 100 === 0) {
        console.log(i);
    }
    const assignments = parser.getField(SPECTRUM13C);
    if (assignments) {
        total++;
        const mol = parser.getMolecule();
        const diaIds = mol.getGroupedDiastereotopicAtomIDs({atomLabel: 'C'});
        const atoms = {};
        for (const diaId of diaIds) {
            const hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {maxSphereSize, type: 0});
            for (const atom of diaId.atoms) {
                atoms[atom] = hoseCodes;
            }
        }

        const splitAssignments = assignments.split('|');
        splitAssignments.pop(); // last element is the empty string
        for (const assignment of splitAssignments) {
            const signal = assignment.split(';');
            const chemicalShift = +signal[0];
            const atomId = signal[2];
            const refAtom = atoms[atomId];
            if (refAtom) {
                for (let k = 0; k < maxSphereSize; k++) {
                    const hoseCode = refAtom[k];
                    if (hoseCode) {
                        if (!db[k][hoseCode]) {
                            db[k][hoseCode] = [chemicalShift];
                        } else {
                            db[k][hoseCode].push(chemicalShift);
                        }
                    }
                }
            }
        }
    } else {
        missingAssignment++;
    }
}

db.forEach((hoseMap) => {
    for (const hose of Object.keys(hoseMap)) {
        hoseMap[hose] = getStats(hoseMap[hose]);
    }
});

fs.writeFileSync(__dirname + '/../data/nmrshiftdb2.json', JSON.stringify(db));

if (missingAssignment) {
    console.error(`${missingAssignment} entries with a missing assignment`);
}

console.error(`${total} entries imported`);

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
