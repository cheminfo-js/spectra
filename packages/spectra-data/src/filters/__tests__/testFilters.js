require('should');
const path = require('path');
const FS = require('fs');

const NMR = require('../../index').NMR;

function createSpectraData(filename) {
  var spectrum = NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}


describe('spectra-data examples Filters', function () {
  it('fourier Tranformation', function () {
    var spectrum = createSpectraData('../../../../../data-test/fftTest/FID.dx');
    spectrum.zeroFilling(spectrum.getNbPoints() * 2).digitalFilter({ nbPoints: 67 }).fourierTransform();
    spectrum.phaseCorrection(-Math.PI / 2, 0);
    spectrum.getXUnits().should.equal('PPM');
  });
  it('zeroFilling nbPoints', function () {
    var spectrum = createSpectraData('../../../../../data-test/fftTest/FID.dx');
    spectrum.zeroFilling(10).getNbPoints().should.equal(10);
    spectrum.zeroFilling(20).getNbPoints().should.equal(20);
  });
  it('absoluteValue', function () {
    var spectrum = createSpectraData('../../../../../data-test/ethylvinylether/1h.jdx');
    let absValue = spectrum.getMagnitude();
    absValue.sd.spectra.length.should.equal(1);
    let re = Math.pow(spectrum.getY(10), 2);
    spectrum.setActiveElement(1);
    let im = Math.pow(spectrum.getY(10), 2);
    absValue.getY(10).should.equal(Math.sqrt(re + im));
  });
});

