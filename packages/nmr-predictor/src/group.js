'use strict';

const patterns = ['s', 'd', 't', 'q', 'quint', 'h', 'sept', 'o', 'n'];

module.exports = function group(signals, options = {}) {
    var i, k;
    for (i = 0; i < signals.length; i++) {
        var j = signals[i].j;
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
    signals.sort((a, b) => {
        if (a.diaIDs[0] < b.diaIDs[0]) return -1;
        if (a.diaIDs[0] > b.diaIDs[0]) return 1;
        return 0;
    });

    for (i = signals.length - 2; i >= 0; i--) {
        if (signals[i].diaIDs[0] === signals[i + 1].diaIDs[0]) {
            signals[i].nbAtoms += signals[i + 1].nbAtoms;
            signals[i].atomIDs = signals[i].atomIDs.concat(signals[i + 1].atomIDs);
            signals.splice(i + 1, 1);
        }
    }

    for (i = 0; i < signals.length; i++) {
        j = signals[i].j;
        for (k = 0; k < j.length; k++) {
            j[k].multiplicity = patterns[j[k].assignment.length];
        }
        signals[i].multiplicity = compilePattern(signals[i], options.tolerance);
    }
    return signals;
};


function compilePattern(signal, tolerance = 0.05) {
    var jc = signal.j;
    var cont = jc[0].assignment.length;
    var pattern = '';
    if (jc && jc.length > 1) {
        jc.sort(function (a, b) {
            return b.coupling - a.coupling;
        });
        for (var i = 0; i < jc.length - 1; i++) {
            if (Math.abs(jc[i].coupling - jc[i + 1].coupling) < tolerance) {
                cont += jc[i + 1].assignment.length;
            } else {
                pattern += patterns[cont];
                cont = jc[i + 1].assignment.length;
            }
        }
        pattern += patterns[cont];
    } else {
        pattern = patterns[cont];
    }
    return pattern;
}