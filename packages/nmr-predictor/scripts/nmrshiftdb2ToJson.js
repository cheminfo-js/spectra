/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const OCLE = require('openchemlib-extended-minimal');
const stat = require('ml-stat/array');
const sdfParser = require('sdf-parser');

const maxSphereSize = 5;

const sdf = fs.readFileSync(__dirname + '/nmrshiftdb2withsignals.sd', 'utf8');
const parsedSdf = sdfParser(sdf, {mixedEOL: true});

const db13C = [];
const db1H = [];
for (let k = 0; k < maxSphereSize; k++) {
    db13C.push({});
    db1H.push({});
}

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

fs.writeFileSync(__dirname + '/../data/nmrshiftdb2-13c.json', JSON.stringify(db13C));
fs.writeFileSync(__dirname + '/../data/nmrshiftdb2-1h.json', JSON.stringify(db1H));

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
    if (atomLabel === 'H') return; // todo make it work with 1H
    fields = fields.filter((field) => field.startsWith(fieldLabel));
    if (fields.length === 0) return;
    const allAssignments = fields
        .map((field) => molecule[field])
        .reduce((result, assignmentString) => {
            const splitAssignments = assignmentString.split('|');
            splitAssignments.pop(); // last element is the empty string
            return result.concat(splitAssignments);
        }, []);

    const diaIds = mol.getGroupedDiastereotopicAtomIDs({atomLabel});
    const atoms = {};
    for (const diaId of diaIds) {
        const hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {maxSphereSize, type: 0});
        for (const atom of diaId.atoms) {
            atoms[atom] = {hoseCodes, values: []};
        }
    }

    for (const assignment of allAssignments) {
        const signal = assignment.split(';');
        const chemicalShift = +signal[0];
        const atomId = signal[2];
        const refAtom = atoms[atomId];
        if (!refAtom) throw new Error(`could not identify atom ${atomId} in entry ${molecule['nmrshiftdb2 ID']}`);
        refAtom.values.push(chemicalShift);
    }

    for (const atom of Object.values(atoms)) {
        if (atom.values.length > 0) {
            const chemicalShift = stat.mean(atom.values);
            for (let k = 0; k < maxSphereSize; k++) {
                const hoseCode = atom[k];
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
