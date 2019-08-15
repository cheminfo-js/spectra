import path from 'path';
import FS from 'fs';

const NMR = require('../../index').NMR;

function createSpectraData(filename) {
  var spectrum = NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}

describe('spectra-data examples Filters', function() {
  it('fourier Tranformation', function() {
    var spectrum = createSpectraData('../../../../../data-test/fftTest/FID.dx');
    spectrum
      .zeroFilling(spectrum.getNbPoints() * 2)
      .digitalFilter({ nbPoints: 67 })
      .fourierTransform();
    spectrum.phaseCorrection(-Math.PI / 2, 0);
    expect(spectrum.getXUnits()).toBe('PPM');
  });
  it('zeroFilling nbPoints', function() {
    var spectrum = createSpectraData('../../../../../data-test/fftTest/FID.dx');
    expect(spectrum
      .zeroFilling(10)
      .getNbPoints()).toBe(10);
    expect(spectrum
      .zeroFilling(20)
      .getNbPoints()).toBe(20);
  });
  it('absoluteValue', function() {
    var spectrum = createSpectraData(
      '../../../../../data-test/ethylvinylether/1h.jdx'
    );
    let absValue = spectrum.getMagnitude();
    expect(absValue.sd.spectra.length).toBe(1);
    let re = Math.pow(spectrum.getY(10), 2);
    spectrum.setActiveElement(1);
    let im = Math.pow(spectrum.getY(10), 2);
    expect(absValue.getY(10)).toBe(Math.sqrt(re + im));
  });
});
