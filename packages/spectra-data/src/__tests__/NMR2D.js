import {toBeDeepCloseTo,toMatchCloseTo} from 'jest-matcher-deep-close-to';
expect.extend({toBeDeepCloseTo, toMatchCloseTo});

import path from 'path';
import FS from 'fs';

// const Data = require('..');
import * as Data from '..';

function createSpectraData(filename) {
  var spectrum = Data.NMR2D.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}

describe('spectra-data examples indometacin/hmbc.dx', function() {
  var spectrum = createSpectraData(
    '/../../../../data-test/indometacin/hmbc.dx'
  );

  it('getNucleus', function() {
    expect(spectrum.getNucleus(1)).toBe('1H');
    expect(spectrum.getNucleus(2)).toBe('13C');
  });

  it('Check observeFrequencyX SFO1', function() {
    expect(spectrum.observeFrequencyX()).toBe(399.682956295637);
  });

  it('Check observeFrequencyY SFO2', function() {
    expect(spectrum.observeFrequencyY()).toBe(100.509649895251);
  });

  it('Checking if is2D is true', function() {
    expect(spectrum.is2D()).toBe(true);
  });

  it('getFirstX', function() {
    expect(spectrum.getFirstX()).toBeDeepCloseTo(13.35119, 4);
  });

  it('getLastX', function() {
    expect(spectrum.getLastX()).toBeDeepCloseTo(1.436984, 4);
  });

  it('getFirstY', function() {
    expect(spectrum.getFirstY()).toBeDeepCloseTo(210.871341, 4);
  });

  it('getLastY', function() {
    expect(spectrum.getLastY()).toBeDeepCloseTo(-11.211101, 4);
  });

  it('getTitle', function() {
    expect(spectrum.getTitle()).toBe('B1284/010/ucb80031  RED5179');
  });

  it('Checking first X array', function() {
    var x = spectrum.getXData();
    expect(x).toBeInstanceOf(Array)
    expect(x).toHaveLength(1024);
    expect(x[0]).toBeDeepCloseTo(13.35119,4);
  });

  it('Checking first Y array', function() {
    var y = spectrum.getYData();
    expect(y).toBeInstanceOf(Array)
    expect(y).toHaveLength(1024);
    expect(y[0]).toBe(5108);
  });

  it('Checking number of sub-spectra', function() {
    expect(spectrum.getNbSubSpectra()).toBe(1024);
  });

  it('Checking first XY array', function() {
    var xy = spectrum.getXYData();
    expect(xy).toBeInstanceOf(Array);
    expect(xy).toHaveLength(2);
    expect(xy[0]).toBeInstanceOf(Array);
    expect(xy[0]).toHaveLength(1024);
    expect(xy[1]).toBeInstanceOf(Array);
    expect(xy[1]).toHaveLength(1024);
    expect(xy[0][0]).toBeDeepCloseTo(13.35119, 4);
    expect(xy[1][0]).toBe(5108);
  });

  it('Peak picking 2D', function() {
    var signals2D = spectrum.getZones({
      thresholdFactor: 1,
      idPrefix: 'hmbc_',
      format: 'new'
    });
    expect(signals2D.length).toBeGreaterThan(1);
    // console.log(signals2D[1].signal[0].peak);
  });
});

describe('spectra-data examples generated', function() {
  let nPoints = 1024;
  var data = new Array(nPoints);
  for (let i = 0; i < nPoints; i++) {
    data[i] = new Array(nPoints);
    for (let j = 0; j < nPoints; j++) {
      data[i][j] = 0;
    }
  }

  for (let i = 412; i < 612; i++) {
    for (let j = 412; j < 612; j++) {
      data[i][j] = -Math.abs(-i + 512) + 200 - Math.abs(-j + 512);
    }
  }

  var spectrum = Data.NMR2D.fromMatrix(data, {
    firsY: 0,
    lastY: 150,
    firstX: 0,
    lastX: 15,
    xType: '1H',
    yType: '13C',
    xUnit: 'PPM',
    yUnit: 'PPM',
    zUnit: 'Intensity',
    frequencyX: 400,
    frequencyY: 100
  });

  it('getNucleus', function() {
    expect(spectrum.getNucleus(1)).toBe('1H');
    expect(spectrum.getNucleus(2)).toBe('13C');
  });
});
