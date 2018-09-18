const simulation = require('nmr-simulation');
/** 
 * This example ilustrates the simulation of a sytste (B, AA, C ). Atoms of the group AA, resonating at 2ppm, are coupled with the atom B that resonates at 1ppm. The scalar coupling between them
 * is 7 Hz. Atoms of the group AA are coupled with atom C, that resonates at 3ppm. The scalar coupling between then is 16Hz. There is not direct coupling between atom B and C.
 * This should produce a pattern like the below one:
 *  x:   0.5 1.0 1.5 2.0 2.5 3.0 3.5
 * _____________________________________
 * 0.5 |  0   0   0   0   0   0   0   0
 * 1.0 |  0   0   1   0   1   0   0   0
 * 1.5 |  0   0   0   0   0   0   0   0
 * 2.0 |  0   0   1   0   1   0   1   0
 * 2.5 |  0   0   0   0   0   0   0   0
 * 3.0 |  0   0   0   0   1   0   1   0
 * 3.5 |  0   0   0   0   0   0   0   0  
*/
const prediction = [{
    fromDiaID: 'A',
    toDiaID: 'B',
    fromAtoms: [8, 14],
    toAtoms: [9],
    fromLabel: 'H',
    toLabel: 'H',
    pathLength: 3,
    fromChemicalShift: 2,
    toChemicalShift: 1,
    fromAtomLabel: 'H',
    toAtomLabel: 'H',
    j: 7
},
{
    fromDiaID: 'A',
    toDiaID: 'C',
    fromAtoms: [8, 14],
    toAtoms: [10],
    fromLabel: 'H',
    toLabel: 'H',
    pathLength: 3,
    fromChemicalShift: 1,
    toChemicalShift: 3,
    fromAtomLabel: 'H',
    toAtomLabel: 'H',
    j: 16
}];

var optionsCOSY = {
    frequencyX: 400,
    frequencyY: 400,
    lineWidthX: 75, //Hz
    lineWidthY: 75, //Hz
    firstX: 0.5,
    toX: 3.5,
    firsY: 0.5,
    toY: 3.5,
    nbPointsX: 8,
    nbPointsY: 8
};

var spectrum = simulation.simulate2D(prediction, optionsCOSY);
console.log(spectrum);
