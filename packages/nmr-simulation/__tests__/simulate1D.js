import * as nmr from '../src/index';

const prediction1h = [
  {
    atomIDs: ['15', '16', '17'],
    diaIDs: ['did@`@fTeYWaj@@@GzP`HeT'],
    nbAtoms: 3,
    delta: 0.992,
    atomLabel: 'H',
    multiplicity: 't',
  },
  {
    atomIDs: ['9'],
    diaIDs: ['did@`@fTfUvf`@h@GzP`HeT'],
    nbAtoms: 1,
    delta: 7.196,
    atomLabel: 'H',
    multiplicity: 'tt',
  },
  {
    atomIDs: ['10', '13'],
    diaIDs: ['did@`@fTfYUn`HH@GzP`HeT'],
    nbAtoms: 2,
    delta: 7.162,
    atomLabel: 'H',
    multiplicity: 'dddd',
  },
  {
    atomIDs: ['11', '12'],
    diaIDs: ['did@`@fTf[Waj@@bJ@_iB@bUP'],
    nbAtoms: 2,
    delta: 2.653,
    atomLabel: 'H',
    multiplicity: 'q',
  },
  {
    atomIDs: ['8', '14'],
    diaIDs: ['did@`@f\\bbRaih@J@A~dHBIU@'],
    nbAtoms: 2,
    delta: 7.26,
    atomLabel: 'H',
    multiplicity: 'tdd',
  },
];

let options1h = {
  frequency: 400.082470657773,
  from: 0,
  to: 11,
  lineWidth: 1,
  nbPoints: 16384,
  maxClusterSize: 8,
  output: 'xy',
};

const prediction13c = [
  {
    atomIDs: ['11', '12'],
    nbAtoms: 2,
    delta: 100,
    atomLabel: 'C',
  },
  {
    atomIDs: ['5', '6'],
    nbAtoms: 2,
    delta: 150,
    atomLabel: 'C',
  },
];

let options13c = {
  frequency: 100,
  from: 0,
  to: 200,
  lineWidth: 1,
  nbPoints: 16384,
  maxClusterSize: 8,
  output: 'xy',
};

describe('Simulation from signals', function() {
  it('simulation 1H gives {x,y} data', function() {
    const spinSystem = nmr.SpinSystem.fromPrediction(prediction1h);
    spinSystem.ensureClusterSize(options1h);
    let simulation = nmr.simulate1D(spinSystem, options1h);
    expect(simulation).toHaveProperty('x');
    expect(simulation).toHaveProperty('y');
    expect(simulation.x).toHaveLength(16384);
    expect(simulation).to.toMatchSnapshot();
  });

  it('simulation 13C gives {x,y} data', function() {
    const spinSystem = nmr.SpinSystem.fromPrediction(prediction13c);
    spinSystem.ensureClusterSize(options13c);
    let simulation = nmr.simulate1D(spinSystem, options13c);
    expect(simulation).toHaveProperty('x');
    expect(simulation).toHaveProperty('y');
    expect(simulation.x).toHaveLength(16384);
    expect(simulation).to.toMatchSnapshot();
  });
});
