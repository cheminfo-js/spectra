import {toBeDeepCloseTo,toMatchCloseTo} from 'jest-matcher-deep-close-to';
expect.extend({toBeDeepCloseTo, toMatchCloseTo});

// const Data = require('..');
import * as Data from '..';

import path from 'path';
import FS from 'fs';

function createSpectraData(filename) {
  return Data.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
}

describe('spectra-data examples ethylvinylether/1h.jdx', () => {
  var spectrum;
  beforeEach(() => {
    spectrum = createSpectraData(
      '/../../../../data-test/ethylvinylether/1h.jdx'
    );
  });

  it('getNucleus', () => {
    expect(spectrum.getNucleus()).toBe('1H');
  });

  it('getSolventName', () => {
    expect(spectrum.getSolventName()).toBe('DMSO');
  });

  it('getFirstX', () => {
    expect(spectrum.getFirstX()).toBe(11.00659);
  });

  it('getLastX', () => {
    expect(spectrum.getLastX()).toBe(-1.009276326659311);
  });

  it('getFirstY', () => {
    expect(spectrum.getFirstY()).toBe(-119886);
  });

  it('getLastY', () => {
    expect(spectrum.getLastY()).toBe(-109159);
  });

  it('getTitle', () => {
    expect(spectrum.getTitle()).toBe('109-92-2');
  });

  it('Checking X array', () => {
    var x = spectrum.getXData();
    expect(x).toBeInstanceOf(Array);
    expect(x).toHaveLength(16384);
    expect(x[0]).toBe(11.00659);
  });

  it('Checking Y array', () => {
    var y = spectrum.getYData();
    expect(y).toBeInstanceOf(Array);
    expect(y).toHaveLength(16384);
    expect(y[0]).toBe(-119886);
  });

  it('Checking XY array', () => {
    var xy = spectrum.getXYData();
    expect(xy).toBeInstanceOf(Array);
    expect(xy).toHaveLength(2);
    expect(xy[0]).toBeInstanceOf(Array);
    expect(xy[0]).toHaveLength(16384);
    expect(xy[1]).toBeInstanceOf(Array);
    expect(xy[1]).toHaveLength(16384);
    expect(xy[0][0]).toBe(11.00659);
    expect(xy[1][0]).toBe(-119886);
  });

  it('Checking if is2D is false', () => {
    expect(spectrum.is2D()).toBe(false);
  });

  it('Check peak-picking', () => {
    var peakPicking = spectrum.getRanges({
      nH: 8,
      realTop: true,
      thresholdFactor: 1,
      clean: 0.5,
      compile: true,
      idPrefix: '1H',
      format: 'new',
      keepPeaks: true
    });
    expect(peakPicking[0].signal[0].peak.length).toBe(4);
  });

  it('Check peak-picking in zone', () => {
    var peakPicking = spectrum.getRanges({
      nH: 8,
      realTop: true,
      thresholdFactor: 1,
      clean: 0.5,
      compile: true,
      idPrefix: '1H',
      format: 'new',
      from: 1,
      to: 2
    });
    expect(peakPicking.length).toBe(1);
    expect(peakPicking[0].signal[0].multiplicity).toBe('t');
  });

  it('getVector', () => {
    expect(spectrum
      .getVector({ from: 0, to: 10, nbPoints: 4 * 1024 })
      .length).toBe(4 * 1024);
  });

  it('updateIntegrals', () => {
    var nH = 8;
    var ranges = spectrum.getRanges({
      nH: nH,
      realTop: true,
      thresholdFactor: 1,
      clean: 0.5,
      compile: true,
      idPrefix: '1H',
      format: 'new'
    });
    ranges[0].to = 6.47;
    var integral0 = ranges[0].integral;
    spectrum.updateIntegrals(ranges, { nH: nH });
    expect(ranges[0].integral).toBeDeepCloseTo(integral0 / 2, 1)
  });
});
