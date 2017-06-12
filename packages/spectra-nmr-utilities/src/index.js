'use strict';

const patterns = ['s', 'd', 't', 'q', 'quint', 'h', 'sept', 'o', 'n'];

module.exports.nmrJ = function nmrJ(Js, options = {}) {
    var jString = '';
    options = Object.assign({}, {separator: ', ', nbDecimal: 2}, options);
    let j, i;
    for (i = 0; i < Js.length; i++) {
        j = Js[i];
        if (j.length > 11) {
            j += options.separator;
        }
        jString += j.multiplicity + ' ' + j.coupling.toFixed(options.nbDecimal);
    }
    return jString;
}

module.exports.joinCoupling = function joinCoupling(signal, tolerance = 0.05) {
    var jc = signal.j;
    if (jc && jc.length > 0) {
        var cont = jc[0].assignment ? jc[0].assignment.length : 1;
        var pattern = '';
        var newNmrJs = [];
        var diaIDs = [];
        var atoms = [];
        jc.sort(function (a, b) {
            return b.coupling - a.coupling;
        });
        if (jc[0].diaID) {
            diaIDs = [jc[0].diaID];
        }
        if (jc[0].assignment) {
            atoms = jc[0].assignment;
        }
        for (var i = 0; i < jc.length - 1; i++) {
            if (Math.abs(jc[i].coupling - jc[i + 1].coupling) < tolerance) {
                cont += jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
                diaIDs.push(jc[i].diaID);
                atoms = atoms.concat(jc[i + 1].assignment);
            } else {
                let jTemp = {
                    coupling: Math.abs(jc[i].coupling),
                    multiplicity: patterns[cont]
                };
                if (diaIDs.length > 0) {
                    jTemp.diaID = diaIDs;
                }
                if (atoms.length > 0) {
                    jTemp.assignment = atoms;
                }
                newNmrJs.push(jTemp);
                if (jc[0].diaID) {
                    diaIDs = [jc[i].diaID];
                }
                if (jc[0].assignment) {
                    atoms = jc[i].assignment;
                }
                pattern += patterns[cont];
                cont = jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
            }
        }
        let jTemp = {
            coupling: Math.abs(jc[i].coupling),
            multiplicity: patterns[cont]
        };
        if (diaIDs.length > 0) {
            jTemp.diaID = diaIDs;
        }
        if (atoms.length > 0) {
            jTemp.assignment = atoms;
        }
        newNmrJs.push(jTemp);

        pattern += patterns[cont];
        signal.j = newNmrJs;

    } else if (signal.delta) {
        pattern = 's';
    } else {
        pattern = 'm';
    }
    return pattern;
}

module.exports.group = function group(signals, options = {}) {
    var i, k;
    for (i = 0; i < signals.length; i++) {
        var j = signals[i].j;
        if (j && j.length > 0) {
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
        signals[i].multiplicity = module.exports.compilePattern(signals[i], options.tolerance);
    }
    return signals;
};


module.exports.compilePattern = function compilePattern(signal, tolerance = 0.05) {
    var jc = signal.j;
    var pattern = '';
    if (jc && jc.length > 0) {
        var cont = jc[0].assignment ? jc[0].assignment.length : 0;
        jc.sort(function (a, b) {
            return b.coupling - a.coupling;
        });
        for (var i = 0; i < jc.length - 1; i++) {
            if (Math.abs(jc[i].coupling - jc[i + 1].coupling) < tolerance) {
                cont += jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
            } else {
                pattern += patterns[cont];
                cont = jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
            }
        }
        pattern += patterns[cont];
    } else if (signal.delta) {
        pattern = 's';
    } else {
        pattern = 'm';
    }
    return pattern;
}

