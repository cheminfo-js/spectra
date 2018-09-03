
require('should');
const FS = require('fs');
const path = require('path');

const spectraData = require('spectra-data');

function createSpectraData(filename) {
  var spectrum = spectraData.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}


describe('spectra-data examples peak picking ', function () {
  var nH = 8;
  var spectrum = createSpectraData('/../../../../../data-test/ethylvinylether/1h.jdx');
  var peakPicking = spectrum.getRanges({ nH: nH, realTopDetection: true, thresholdFactor: 1, clean: 0.5, compile: true });
  it('patterns for ethylvinylether (OLD)', function () {
    for (var i = 0; i < peakPicking.length; i++) {
      var signal = peakPicking[i].signal[0];
      if (Math.abs(signal.delta1 - 1.308) < 0.01) {
        signal.multiplicity.should.equal('t');
      }
      if (Math.abs(signal.delta1 - 3.77) < 0.01) {
        signal.multiplicity.should.equal('q');
      }
      if (Math.abs(signal.delta1 - 3.99) < 0.01) {
        signal.multiplicity.should.equal('dd');
      }
      if (Math.abs(signal.delta1 - 4.2) < 0.01) {
        signal.multiplicity.should.equal('dd');
      }
      if (Math.abs(signal.delta1 - 6.47) < 0.01) {
        signal.multiplicity.should.equal('dd');
      }
    }
  });

  it('Number of patterns', function () {
    peakPicking.length.should.equal(5);
  });

  it('examples integration and multiplet limits', function () {
    peakPicking[4].from.should.lessThan(1.290);
    peakPicking[4].to.should.greaterThan(1.325);
  });
});

