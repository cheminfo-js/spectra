import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';

import NMR from '../../NMR';

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

let NbPoints = 101;
let cs1 = 2;
let intensity = 1;
let w = 0.1;
let cs2 = 8;
let intensity2 = intensity * 50;
let w2 = w;
let totalIntegral = 0;
let noiseAmplitude = 2;

let line = new Array(NbPoints);
let x = xRange(0, 10, NbPoints);

for (var i = 0; i < NbPoints; i++) {
  line[i] =
    (((2 * intensity) / Math.PI) * w) /
      (4 * Math.pow(cs1 - x[i], 2) + Math.pow(w, 2)) +
    (((2 * intensity2) / Math.PI) * w2) /
      (4 * Math.pow(cs2 - x[i], 2) + Math.pow(w2, 2)) +
    (Math.random() * noiseAmplitude - noiseAmplitude * 0.5);
}

let spectrum = NMR.fromXY(x, line, {});
let options = {
  noiseLevel: spectrum.getNoiseLevel(),
  thresholdFactor: 1,
  compile: false,
  clean: false,
  optimize: false,
  integralType: 'sum',
  nH: 3,
  frequencyCluster: 16,
  widthFactor: 4,
  smoothY: false,
  broadWidth: 0.2,
  functionName: 'lorentzian',
  broadRatio: 0,
};

let ranges = spectrum.getRanges(options);

for (i = 0; i < ranges.length; i++) {
  totalIntegral += ranges[i].integral;
}

function xRange(start, end, NbPoints) {
  let a = new Array(NbPoints).fill(start);
  let jump = (end - start) / (NbPoints - 1);
  for (let i = 0; i < NbPoints; i++) {
    a[i] += jump * i;
  }
  return a;
}

describe('mixed spectrum with small and big peaks', function() {
  it('sum of integral is correct', function() {
    expect(totalIntegral).toBeDeepCloseTo(options.nH, 1);
  });
  it('peakPicking', function() {
    expect(ranges).toHaveLength(2);
  });
});
