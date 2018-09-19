require('should');
const simulation = require('..');


/** 
 * This example ilustrates the simulation of a sytste (B, AA, C ). Atoms of the group AA, resonating at 2ppm, are coupled with the atom B that resonates at 1ppm. The scalar coupling between them
 * is 7 Hz. Atoms of the group AA are coupled with atom C, that resonates at 3ppm. The scalar coupling between then is 16Hz. There is not direct coupling between atom B and C.
 * This should produce a pattern like the below one:
 *  x:   0.5 1.0 1.5 2.0 2.5 3.0 3.5
 * _____________________________________
 * 0.5 |  0   0   0   0   0   0   0
 * 1.0 |  0   1   0   1   0   0   0
 * 1.5 |  0   0   0   0   0   0   0
 * 2.0 |  0   1   0   1   0   1   0
 * 2.5 |  0   0   0   0   0   0   0
 * 3.0 |  0   0   0   1   0   1   0
 * 3.5 |  0   0   0   0   0   0   0  
*/
const prediction = [{
    fromDiaID: 'A',
    toDiaID: 'A',
    fromAtoms: [8, 14],
    toAtoms: [8, 14],
    fromLabel: 'H',
    toLabel: 'H',
    pathLength: 0,
    fromChemicalShift: 2,
    toChemicalShift: 2,
    fromAtomLabel: 'H',
    toAtomLabel: 'H'
},
{
    fromDiaID: 'B',
    toDiaID: 'B',
    fromAtoms: [9],
    toAtoms: [9],
    fromLabel: 'H',
    toLabel: 'H',
    pathLength: 0,
    fromChemicalShift: 1,
    toChemicalShift: 1,
    fromAtomLabel: 'H',
    toAtomLabel: 'H'
},
{
    fromDiaID: 'C',
    toDiaID: 'C',
    fromAtoms: [10],
    toAtoms: [10],
    fromLabel: 'H',
    toLabel: 'H',
    pathLength: 0,
    fromChemicalShift: 3,
    toChemicalShift: 3,
    fromAtomLabel: 'H',
    toAtomLabel: 'H'
},
{
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
    fromChemicalShift: 2,
    toChemicalShift: 3,
    fromAtomLabel: 'H',
    toAtomLabel: 'H',
    j: 16
}];

var optionsCOSY = {
    frequencyX: 1,
    frequencyY: 1,
    lineWidthX: 0.07, //Hz
    lineWidthY: 0.07, //Hz
    firstX: 0.5,
    lastX: 3.5,
    firstY: 0.5,
    lastY: 3.5,
    nbPointsX: 7,
    nbPointsY: 7,
    symmetrize: true
};

describe('Simulation from signals simple COSY', function () {
  it('simulation 1H-1H gives matrix data', function () {
    var spectrum = simulation.simulate2D(prediction, optionsCOSY);
    //Lets make a logical matrix. Small values are 0
    spectrum = spectrum.map(row => {
        return row.map(value => value < 1e-10 ? 0 : 1);
    });

    spectrum.should.eql([ 
      [ 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 0, 1, 0, 0, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 1, 0, 1, 0, 1, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0 ],
      [ 0, 0, 0, 1, 0, 1, 0 ],
      [ 0, 0, 0, 0, 0, 0, 0 ] ]);
  });
});
