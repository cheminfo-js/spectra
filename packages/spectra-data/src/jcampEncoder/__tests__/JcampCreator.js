import FS from 'fs';
import path from 'path';

import * as Data from '../..';

function createSpectraData(filename) {
  let spectrum = Data.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString(),
  );
  return spectrum;
}

let spectrum = createSpectraData(
  '/../../../../../data-test/ethylvinylether/1h.jdx',
);

let createdJcamp0 = spectrum.toJcamp({ type: 'SIMPLE' });
let createdJcamp1 = spectrum.toJcamp({ type: 'NTUPLES' });

describe('toJcamp spectra-data examples', function() {
  let spectrum0 = Data.NMR.fromJcamp(createdJcamp0, { fastParse: false });
  let spectrum1 = Data.NMR.fromJcamp(createdJcamp1, { fastParse: false });

  it('getVector', function() {
    expect(
      spectrum0.getVector({ from: 0.0, to: 10, nbPoints: 4 * 1024 }),
    ).toHaveLength(4 * 1024);
    expect(
      spectrum1.getVector({ from: 0.0, to: 10, nbPoints: 4 * 1024 }),
    ).toHaveLength(4 * 1024);
  });

  it('getNucleus', function() {
    expect(spectrum0.getNucleus()).toBe('1H');
    expect(spectrum1.getNucleus()).toBe('1H');
  });
  it('getSolventName', function() {
    expect(spectrum0.getSolventName()).toBe('DMSO');
    expect(spectrum1.getSolventName()).toBe('DMSO');
  });
  it('getFirstX', function() {
    expect(spectrum0.getFirstX()).toBe(11.00659);
    expect(spectrum1.getFirstX()).toBe(11.00659);
  });

  it('getLastX', function() {
    expect(spectrum0.getLastX()).toBe(-1.009276326659311);
    expect(spectrum1.getLastX()).toBe(-1.009276326659311);
  });

  it('getFirstY', function() {
    expect(spectrum0.getFirstY()).toBe(-119886);
    expect(spectrum1.getFirstY()).toBe(-119886);
  });

  it('getLastY', function() {
    // console.log(spectrum.getLastY());
    expect(spectrum0.getLastY()).toBe(-109159);
    expect(spectrum1.getLastY()).toBe(-109159);
  });

  it('getTitle', function() {
    expect(spectrum0.getTitle()).toBe('109-92-2');
    expect(spectrum1.getTitle()).toBe('109-92-2');
  });

  it.skip('Checking X array', function() {
    let x = spectrum0.getXData();
    expect(x).toBeInstanceOf(Array);
    expect(x).toHaveLength(16384);
    expect(x[0]).toBe(11.00659);
    x = spectrum1.getXData();
    expect(x).toBeInstanceOf(Array);
    expect(x).toHaveLength(16384);
    expect(x[0]).toBe(11.00659);
  });

  it.skip('Checking Y array', function() {
    let y = spectrum0.getYData();
    expect(y).toBeInstanceOf(Array);
    expect(y).toHaveLength(16384);
    expect(y[0]).toBe(-119886);
    y = spectrum1.getYData();
    expect(y).toBeInstanceOf(Array);
    expect(y).toHaveLength(16384);
    expect(y[0]).toBe(-119886);
  });

  it.skip('Checking XY array', function() {
    let xy = spectrum0.getXYData();
    expect(xy).toBeInstanceOf(Array);
    expect(xy[0]).toBeInstanceOf(Array);
    expect(xy[0]).toHaveLength(16384);
    expect(xy[1]).toBeInstanceOf(Array);
    expect(xy[1]).toHaveLength(16384);
    expect(xy[0][0]).toBe(11.00659);
    expect(xy[1][0]).toBe(-119886);
    xy = spectrum1.getXYData();
    expect(xy).toBeInstanceOf(Array);
    expect(xy).toHaveLength(2);
    expect(xy[0]).toBeInstanceOf(Array);
    expect(xy[0]).toHaveLength(16384);
    expect(xy[1]).toBeInstanceOf(Array);
    expect(xy[1]).toHaveLength(16384);
    expect(xy[0][0]).toBe(11.00659);
    expect(xy[1][0]).toBe(-119886);
  });

  it('Checking if is2D is false', function() {
    expect(spectrum0.is2D()).toBe(false);
    expect(spectrum1.is2D()).toBe(false);
  });
});
