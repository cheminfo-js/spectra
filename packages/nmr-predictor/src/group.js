'use strict';

module.exports = function group(prediction, connectivityMatrix) {
    var i, k;
    var c = connectivityMatrix;
    for (i = 0; i < prediction.length; i++) {
        var j = prediction[i].j;
        var atom = prediction[i].atomIDs[0];
        if (j && j.length > 0) {
            //It is supposed that multiplicity is always `d`
            for (k = j.length - 2; k >= 0; k--) {
                for (var m = j.length - 1; m > k; m--) {
                    if (j[k].diaID === j[m].diaID &&
                        j[k].coupling === j[m].coupling &&
                        c[j[k].assignment][atom] === c[j[m].assignment][atom]) {
                        j[k].multiplicity += j[m].multiplicity;
                        j[k].atoms = !j[k].atoms ? [j[k].assignment, j[m].assignment] : j[k].concat(j[m].assignment);
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
            prediction[i].integral += prediction[i + 1].integral;
            prediction[i].atomIDs = prediction[i].atomIDs.concat(prediction[i + 1].atomIDs);
            prediction.splice(i + 1, 1);
        }
    }

    return prediction;
};
