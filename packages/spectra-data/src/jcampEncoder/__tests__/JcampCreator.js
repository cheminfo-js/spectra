import FS from 'fs';
import path from 'path';

const Data = require('../../..');

function createSpectraData(filename) {
  var spectrum = Data.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}

var spectrum = createSpectraData(
  '/../../../../../data-test/ethylvinylether/1h.jdx'
);

var createdJcamp0 = spectrum.toJcamp({ type: 'SIMPLE' });
var createdJcamp1 = spectrum.toJcamp({ type: 'NTUPLES' });

describe('toJcamp spectra-data examples', function() {
  var spectrum0 = Data.NMR.fromJcamp(createdJcamp0, { fastParse: false });
  var spectrum1 = Data.NMR.fromJcamp(createdJcamp1, { fastParse: false });

  it('getVector', function() {
    expect(spectrum0
      .getVector({ from: 0.0, to: 10, nbPoints: 4 * 1024 })
      .length).toBe(4 * 1024);
    expect(spectrum1
      .getVector({ from: 0.0, to: 10, nbPoints: 4 * 1024 })
      .length).toBe(4 * 1024);
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
    var x = spectrum0.getXData();
    expect(x).to.be.instanceof(Array).toHaveLength(16384);
    expect(x[0]).toBe(11.00659);
    x = spectrum1.getXData();
    expect(x).to.be.instanceof(Array).toHaveLength(16384);
    expect(x[0]).toBe(11.00659);
  });

  it.skip('Checking Y array', function() {
    var y = spectrum0.getYData();
    expect(y).to.be.instanceof(Array).toHaveLength(16384);
    expect(y[0]).toBe(-119886);
    y = spectrum1.getYData();
    expect(y).to.be.instanceof(Array).toHaveLength(16384);
    expect(y[0]).toBe(-119886);
  });

  it.skip('Checking XY array', function() {
    var xy = spectrum0.getXYData();
    expect(xy).to.be.instanceof(Array).toHaveLength(2);
    expect(xy[0]).to.be.instanceof(Array).toHaveLength(16384);
    expect(xy[1]).to.be.instanceof(Array).toHaveLength(16384);
    expect(xy[0][0]).toBe(11.00659);
    expect(xy[1][0]).toBe(-119886);
    xy = spectrum1.getXYData();
    expect(xy).to.be.instanceof(Array).toHaveLength(2);
    expect(xy[0]).to.be.instanceof(Array).toHaveLength(16384);
    expect(xy[1]).to.be.instanceof(Array).toHaveLength(16384);
    expect(xy[0][0]).toBe(11.00659);
    expect(xy[1][0]).toBe(-119886);
  });

  it('Checking if is2D is false', function() {
    expect(spectrum0.is2D()).toBe(false);
    expect(spectrum1.is2D()).toBe(false);
  });
});
