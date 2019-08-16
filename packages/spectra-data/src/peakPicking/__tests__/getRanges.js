import {toBeDeepCloseTo,toMatchCloseTo} from 'jest-matcher-deep-close-to';
expect.extend({toBeDeepCloseTo, toMatchCloseTo});

import NMR from '../../NMR';

var NbPoints = 101;
var cs1 = 2;
var intensity = 1;
var w = 0.1;
var cs2 = 8;
var intensity2 = intensity * 50;
var w2 = w;
var totalIntegral = 0;
var noiseAmplitude = 2;

var line = new Array(NbPoints);
var x = xRange(0, 10, NbPoints);

for (var i = 0; i < NbPoints; i++) {
  line[i] = 2 * intensity / Math.PI * w / (4 * Math.pow(cs1 - x[i], 2) + Math.pow(w, 2))
        + 2 * intensity2 / Math.PI * w2 / (4 * Math.pow(cs2 - x[i], 2) + Math.pow(w2, 2))
        + (Math.random() * noiseAmplitude - noiseAmplitude * 0.5);
}

var spectrum = NMR.fromXY(x, line, {});
var options = {
  noiseLevel: spectrum.getNoiseLevel(),
  thresholdFactor: 1,
  compile: false,
  clean: false,
  optimize: false,
  integralType: 'sum',
  nH: 3,
  frequencyCluster: 16,
  widthFactor: 4, smoothY: false, broadWidth: 0.2,
  functionName: 'lorentzian',
  broadRatio: 0
};

var ranges = spectrum.getRanges(options);

for (i = 0; i < ranges.length; i++) {
  totalIntegral += ranges[i].integral;
}

function xRange(start, end, NbPoints) {
  var a = new Array(NbPoints).fill(start);
  var jump = (end - start) / (NbPoints - 1);
  for (let i = 0; i < NbPoints; i++) {
    a[i] += jump * i;
  }
  return a;
}

describe('mixed spectrum with small and big peaks', function () {
  it('sum of integral is correct', function () {
    expect(totalIntegral).toBeDeepCloseTo(options.nH, 1);
  });
  it('peakPicking', function () {
    expect(ranges.length).toBe(2);
  });
});
