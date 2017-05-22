'use strict';

const patterns = ['s', 'd', 't', 'q', 'quint', 'h', 'sept', 'o', 'n'];
module.exports = function group(prediction) {
    var i, k;
    for (i = 0; i < prediction.length; i++) {
        var j = prediction[i].j;
        if (j && j.length > 0) {
            //It is supposed that multiplicity is always `d`
            for (k = j.length - 2; k >= 0; k--) {
                for (var m = j.length - 1; m > k; m--) {
                    if (j[k].diaID === j[m].diaID &&
                        j[k].coupling === j[m].coupling &&
                        j[k].distance === j[m].distance) {
                        j[k].assignment = j[k].assignment.concat(j[m].assignment);
                        j.splice(m, 1);
                    }
                }
            }
        }
    }
    prediction.sort((a, b) => {
        if (a.diaIDs[0] < b.diaIDs[0]) return -1;
        if (a.diaIDs[0] > b.diaIDs[0]) return 1;
        return 0;
    });

    for (i = prediction.length - 2; i >= 0; i--) {
        if (prediction[i].diaIDs[0] === prediction[i + 1].diaIDs[0]) {
            prediction[i].nbAtoms += prediction[i + 1].nbAtoms;
            prediction[i].atomIDs = prediction[i].atomIDs.concat(prediction[i + 1].atomIDs);
            prediction.splice(i + 1, 1);
        }
    }

    for (i = 0; i < prediction.length; i++) {
        j = prediction[i].j;
        for (k = 0; k < j.length; k++) {
            j[k].multiplicity = patterns[j[k].assignment.length];
        }
    }
    return prediction;
};

