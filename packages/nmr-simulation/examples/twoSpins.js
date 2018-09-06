const simulation = require('nmr-simulation');

const prediction = [
    {
        atomIDs: ['11', '12'],
        nbAtoms: 2,
        delta: 1,
        atomLabel: 'H'
    }, {
        atomIDs: ['5', '6'],
        nbAtoms: 2,
        delta: 1,
        atomLabel: 'H'
    }
];

var options1h = {
    frequency: 400.082470657773,
    from: 0,
    to: 3,
    lineWidth: 3,
    nbPoints: 16384,
    maxClusterSize: 8,
    output: 'xy'
};

const spinSystem = simulation.SpinSystem.fromPrediction(prediction1h);
spinSystem.ensureClusterSize(options1h);
var spectrum = simulation.simulate1D(spinSystem, options1h);
console.log(spectrum.x);// x in PPM
console.log(spectrum.y);// y in arbitrary units