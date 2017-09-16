'use strict';

module.exports.ACSParser = function (totalString, options = {}) {
    var {
        frequency = 400,
        nucleus = '1H',
        solvent = null
    } = options;
    var allSignals = [];
    // console.log('original', totalString);
    totalString = totalString.replace(/[<sup></sup><sub></sub><i></i>]/gi, '');
    totalString = totalString.replace(/\u0096/gi, '-'); // review it
    totalString = totalString.replace(/\u03B4/gi, '');


    totalString = totalString.replace(/([0-9]),([0-9])/gi, '$1.$2'); // It's ok
    // totalString = totalString.replace(/[\r\n]*/gi, " "); //review it
    // console.log(totalString)
    totalString = totalString.replace(/^([\w\W]*NMR *\([\W\w]*\)) *[:]{0,1} *([0-9]+[\w\W]*)$/gi, '$1:$2'); //It's ok

    if (totalString.indexOf(':') > 0) {
        let index = totalString.indexOf(':');
        var experiment = totalString.substring(0, index);
        totalString = totalString.substring(index + 1);
        if (experiment.indexOf(' ') > 0) { //review it because we can have this 13C-NMR (CDCl3, 75 MHz) 46
            var begin = experiment.substring(0, experiment.indexOf(' '));
            if (begin.match(/[0-9]{1,3}[A-Z a-z]?/)) {
                determineNucleus(begin);
                nucleus = 2; //define the nucleus;
            }
        }
        if (experiment.indexOf('(') > 0) {
            experiment = experiment.substring(experiment.indexOf('(') + 1);
            if (experiment.indexOf(')') > 0) {
                experiment = experiment.substring(0, experiment.indexOf(')'));
                let parts = experiment.split(',');
                for (let part of parts) {
                    if (part.toLowerCase().indexOf('mhz') > 0) {
                        try {
                            frequency = parseFloat(part.replace('[^0-9.]', '')); // @TODO A TEST
                        } catch (err) {
                            console.log(err);
                        }
                    } else {
                        solvent = part.replace(' ', '');
                    }
                }
            }
        }
    }
    // totalString = totalString.replace("([^a-zA-Z])app[^ ,]*", "$1");//I don't know how to do
    // totalString = totalString.replace("([^a-zA-Z])exch[^ ,]*", "$1");
    totalString = totalString.replace(/([^a-zA-Z])J[0-9]*[ =]+/gi, '$1J=');
    totalString = totalString.replace(/ */gi, '');
    totalString = totalString.replace(/\[/gi, '('); //I don't understand what it means
    totalString = totalString.replace(/\]/gi, ')');

    let newString = replaceParenthesis(totalString);
    totalString = newString.replace(/,(?!([^\[]*\]))/gi, '|');

    totalString = totalString.replace(/,/gi, '/');

    var parts = totalString.split('\|');
    var delta = '';
    for (let part of parts) {
        var ppmValueA = null;
        var ppmValueB = null;
        var couplings = [];
        var intensity = 0;
        var multString = '';
        var assignment = '';
        var indexOf = part.indexOf('[');
        if (indexOf > 0) {
            delta = part.substring(0, indexOf);
            part = part.substring(indexOf + 1);
            indexOf = part.indexOf(']');
            if (indexOf > 0) {
                part = part.substring(0, indexOf);
                // part = part.replace(/\/(?!([^0-9]))/gi, '|'); // It's when we have more than one coupling constant
                let signalParts = part.split('/');
                var currentStatus = 'statusUnknow';
                for (let signalPart of signalParts) {
                    if (signalPart.match(/^[a-z]+/g) && multString === '') {
                        currentStatus = 'statusMultiplicity';
                        multString = signalPart;
                    } else if (signalPart.match(/^[0-9][a-z|A-Z]/g) && intensity === 0) {
                        currentStatus = 'statusIntegration';
                        intensity = parseFloat(part.replace('[^0-9.]', ''));
                    } else if (signalPart.indexOf('Hz') > 0) {
                        currentStatus = 'statusCouplingConstant';
                        signalPart = signalPart.replace(/^[0-9]*J=/gi, '');
                        couplings.push(parseFloat(signalPart.replace('[^0-9.]', '')));
                    }
                }
            }
        } else {
            delta = part;
        }
        // delta = delta.replace(/[ï¿½]*/gi, "-");
        delta = delta.replace("to", "-");
        delta = delta.replace(/(^.[^-]*)-/gi, '$1|');
        indexOf = delta.indexOf("|");
        if (indexOf > 0) {
            ppmValueA = parseFloat(delta.substring(0, indexOf));
            ppmValueB = parseFloat(delta.substring(indexOf + 1));
        } else {
            ppmValueB = parseFloat(delta);
            ppmValueA = ppmValueB;
        }
        allSignals.push(createNmrSignal1D(multString, ppmValueA, ppmValueB, couplings, intensity, assignment,
            frequency, nucleus));
    }

};

function createNmrSignal1D(multString, ppmValueA, ppmValueB, couplings, intensity, assignment,
                           frequency, nucleus) {
    var signal = {
        nbAtoms: intensity,
        multiplicity: multString
    };


}

function determineNucleus(string) {

};

function replaceParenthesis(totalString) {
    var parenthesisLevel = 0;
    var newString = '';
    for (let i = 0; i < totalString.length; i++) {
        if (totalString.charAt(i) === '(') {
            parenthesisLevel++;
            if (parenthesisLevel === 1) {
                newString += '[';
            } else {
                newString += '(';
            }
        } else if (totalString.charAt(i) === ')') {
            parenthesisLevel--;
            if (parenthesisLevel === 0) {
                newString += ']';
            } else {
                newString += ')';
            }
        } else {
            newString += totalString.charAt(i);
        }
    }
    return newString;
}