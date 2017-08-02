'use strict';

const numSort = require('num-sort');

const getOcleFromOptions = require('./getOcleFromOptions');

module.exports = function queryByHose(molecule, db, options) {
    const {Util} = getOcleFromOptions(options);
    const {
        atomLabel = 'H',
        use = 'median',
        algorithm = 0,
        levels = [5, 4, 3, 2, 1, 0]
    } = options;

    levels.sort(numSort.desc);

    const diaIds = molecule.getGroupedDiastereotopicAtomIDs({atomLabel});
    const atoms = {};
    const atomNumbers = [];
    for (const diaId of diaIds) {
        const atom = {
            diaIDs: [diaId.oclID]
        };

        atom.hose = Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
            maxSphereSize: levels[0],
            type: algorithm
        });
        /*for (const level of levels) {
            if (hoseCodes[level]) {
                atom['hose' + level] = hoseCodes[level];
            }
        }*/
        for (const diaIdAtom of diaId.atoms) {
            atoms[diaIdAtom] = JSON.parse(JSON.stringify(atom));
            atomNumbers.push(diaIdAtom);
        }
    }

    const toReturn = [];
    for (const atomNumber of atomNumbers) {
        const atom = atoms[atomNumber];
        let res;
        let k = 0;
        while (!res && k < levels.length) {
            if (db[levels[k]]) {
               res = db[levels[k]][atom['hose'][levels[k] - 1]];
            }
            k++;
        }
        if (!res) {
            res = {cs: null, ncs: 0, std: 0, min: 0, max: 0};
        }
        atom.atomLabel = atomLabel;
        atom.level = levels[k - 1];
        if (use === 'median') {
            atom.delta = res.median;
        } else if (use === 'mean') {
            atom.delta = res.mean;
        }
        atom.nbAtoms = 1;
        atom.atomIDs = [atomNumber + ''];
        atom.ncs = res.ncs;
        atom.std = res.std;
        atom.min = res.min;
        atom.max = res.max;

        toReturn.push(atom);
    }

    if (options.ignoreLabile) {
        const linksOH = molecule.getAllPaths({
            fromLabel: 'H',
            toLabel: 'O',
            minLength: 1,
            maxLength: 1
        });
        const linksNH = molecule.getAllPaths({
            fromLabel: 'H',
            toLabel: 'N',
            minLength: 1,
            maxLength: 1
        });
        for (let j = toReturn.length - 1; j >= 0; j--) {
            for (const linkOH of linksOH) {
                if (toReturn[j].diaIDs[0] === linkOH.fromDiaID) {
                    toReturn.splice(j, 1);
                    break;
                }
            }
        }

        for (let j = toReturn.length - 1; j >= 0; j--) {
            for (const linkNH of linksNH) {
                if (toReturn[j].diaIDs[0] === linkNH.fromDiaID) {
                    toReturn.splice(j, 1);
                    break;
                }
            }
        }
    }
    return toReturn;
};
