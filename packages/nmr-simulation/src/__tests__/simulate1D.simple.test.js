import * as nmr from '../index';

import filterX from 'ml-array-xy-filter-x';
import maxY from 'ml-array-xy-max-y';

let options1h = {
  frequency: 400,
  from: 0,
  to: 4,
  lineWidth: 1,
  nbPoints: 40001,
  maxClusterSize: 8,
  output: 'xy',
};

describe('Simple simulation', () => {
  it('1 and 2 ppm, no coupling', () => {
    const prediction1h = [
      {
        atomIDs: ['1'],
        nbAtoms: 1,
        delta: 1,
        atomLabel: 'H',
        multiplicity: 'd',
      },
      {
        atomIDs: ['2'],
        nbAtoms: 1,
        delta: 2,
        atomLabel: 'H',
        multiplicity: 'd',
      },
    ];
    const spinSystem = nmr.SpinSystem.fromPrediction(prediction1h);
    spinSystem.ensureClusterSize(options1h);
    let simulation = nmr.simulate1D(spinSystem, options1h);
    let first = filterX(simulation, { from: 0.5, to: 1.5 });
    const maxFirst = maxY(first);
    expect(first.x[maxFirst.index]).toEqual(1);
    let second = filterX(simulation, { from: 1.5, to: 2.5 });
    const maxSecond = maxY(second);
    expect(second.x[maxSecond.index]).toEqual(2);
  });

  it('1 and 3 ppm', function() {
    const prediction1h = [
      {
        atomIDs: ['1'],
        nbAtoms: 1,
        delta: 1,
        atomLabel: 'H',
        multiplicity: 'd',
        j: [{ assignment: [2], coupling: 100 }],
      },
      {
        atomIDs: ['2'],
        nbAtoms: 1,
        delta: 2,
        atomLabel: 'H',
        multiplicity: 'd',
      },
    ];
    const spinSystem = nmr.SpinSystem.fromPrediction(prediction1h);
    spinSystem.ensureClusterSize(options1h);
    let simulation = nmr.simulate1D(spinSystem, options1h);
    let firstLeft = filterX(simulation, { from: 0.5, to: 1 });
    const maxFirstLeft = maxY(firstLeft);
    let firstRight = filterX(simulation, { from: 1, to: 1.5 });
    const maxFirstRight = maxY(firstRight);
    let firstDelta =
      firstRight.x[maxFirstRight.index] - firstLeft.x[maxFirstLeft.index];
    expect(firstDelta * options1h.frequency).toBeCloseTo(100, 10);

    let secondLeft = filterX(simulation, { from: 0.5, to: 1 });
    const maxSecondLeft = maxY(secondLeft);
    let secondRight = filterX(simulation, { from: 1, to: 1.5 });
    const maxSecondRight = maxY(secondRight);
    let secondDelta =
      secondRight.x[maxSecondRight.index] - secondLeft.x[maxSecondLeft.index];
    expect(secondDelta * options1h.frequency).toBeCloseTo(100, 10);
  });
});
