const simulation = require('..');

const prediction = [
    {
        atomIDs: ['11'],
        nbAtoms: 1,
        delta: 1.2,
        atomLabel: 'H',
        j:[{'assignment':['5'],'coupling':7.4,'multiplicity':'d','distance':3}, 
           {'assignment':['6'],'coupling':7.4,'multiplicity':'d','distance':3}]
    }, {
        atomIDs: ['5', '6'],
        nbAtoms: 2,
        delta: 1.3,
        atomLabel: 'H'
    }
];

var options1h = {
    frequency: 400.082470657773,
    from: 1,
    to: 1.5,
    lineWidth: 3,
    nbPoints: 512,
    maxClusterSize: 8,
    output: 'xy'
};

const spinSystem = simulation.SpinSystem.fromPrediction(prediction);
spinSystem.ensureClusterSize(options1h);
var spectrum = simulation.simulate1D(spinSystem, options1h);
console.log(JSON.stringify(spectrum.x));// x in PPM
console.log(JSON.stringify(spectrum.y));// y in arbitrary units