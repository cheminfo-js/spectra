'use strict';

const OCLE = require('openchemlib-extended');

module.exports = function queryByHose(molecule, db, options) {
    var {
        atomLabel = 'H',
        use = null,
        algorithm = 0,
        levels = [6, 5, 4, 3, 2]
    } = options;

    levels.sort(function (a, b) {
        return b - a;
    });

    var diaIDs = molecule.getGroupedDiastereotopicAtomIDs({atomLabel});
    var infoCOSY = [];

    var atoms = {};
    var atomNumbers = [];
    var i, k, j, atom, hosesString;
    for (j = diaIDs.length - 1; j >= 0; j--) {
        hosesString = OCLE.Util.getHoseCodesFromDiastereotopicID(diaIDs[j].oclID, {
            maxSphereSize: levels[0],
            type: algorithm
        });
        atom = {
            diaIDs: [diaIDs[j].oclID + '']
        };
        for (k = 0; k < levels.length; k++) {
            if (hosesString[levels[k] - 1]) {
                atom['hose' + levels[k]] = hosesString[levels[k] - 1] + '';
            }
        }
        for (k = diaIDs[j].atoms.length - 1; k >= 0; k--) {
            atoms[diaIDs[j].atoms[k]] = JSON.parse(JSON.stringify(atom));
            atomNumbers.push(diaIDs[j].atoms[k]);
        }
    }
    //Now, we twoD the chimical shift by using our copy of NMRShiftDB
    //var script2 = 'select chemicalShift FROM assignment where ';//hose5='dgH`EBYReZYiIjjjjj@OzP`NET'';
    var toReturn = new Array(atomNumbers.length);
    for (j = 0; j < atomNumbers.length; j++) {
        atom = atoms[atomNumbers[j]];
        var res = null;
        k = 0;
        //A really simple query
        while (!res && k < levels.length) {
            if (db[levels[k]]) {
                res = db[levels[k]][atom['hose' + levels[k]]];
            }
            k++;
        }
        if (!res) {
            res = {cs: null, ncs: 0, std: 0, min: 0, max: 0};//Default values
        }
        atom.atomLabel = atomLabel;
        atom.level = levels[k - 1];
        atom.delta = res.cs;
        if (use === 'median' && res.median) {
            atom.delta = res.median;
        } else if (use === 'mean' && res.mean) {
            atom.delta = res.mean;
        }
        atom.integral = 1;
        atom.atomIDs = ['' + atomNumbers[j]];
        atom.ncs = res.ncs;
        atom.std = res.std;
        atom.min = res.min;
        atom.max = res.max;
        atom.j = [];

        //Add the predicted couplings
        //console.log(atomNumbers[j]+' '+infoCOSY[0].atom1);
        for (i = infoCOSY.length - 1; i >= 0; i--) {
            if (infoCOSY[i].atom1 - 1 === atomNumbers[j] && infoCOSY[i].coupling > 2) {
                atom.j.push({
                    assignment: infoCOSY[i].atom2 - 1 + '', //Put the diaID instead
                    diaID: infoCOSY[i].diaID2,
                    coupling: infoCOSY[i].coupling,
                    multiplicity: 'd'
                });
            }
        }
        toReturn[j] = atom;
    }
    //TODO this will not work because getPaths is not implemented yet!!!!
    if (options.ignoreLabile) {
        var linksOH = molecule.getAllPaths({
            fromLabel: 'H',
            toLabel: 'O',
            minLength: 1,
            maxLength: 1
        });
        var linksNH = molecule.getAllPaths({
            fromLabel: 'H',
            toLabel: 'N',
            minLength: 1,
            maxLength: 1
        });
        for (j = toReturn.length - 1; j >= 0; j--) {
            for (k = 0; k < linksOH.length; k++) {
                if (toReturn[j].diaIDs[0] === linksOH[k].fromDiaID) {
                    toReturn.splice(j, 1);
                    break;
                }
            }
        }

        for (j = toReturn.length - 1; j >= 0; j--) {
            for (k = 0; k < linksNH.length; k++) {
                if (toReturn[j].diaIDs[0] === linksNH[k].fromDiaID) {
                    toReturn.splice(j, 1);
                    break;
                }
            }
        }
    }
    return toReturn;
};
