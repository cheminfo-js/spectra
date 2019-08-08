import FS from 'fs';
import path from 'path';

const spectraData = require('spectra-data');

function createSpectraData(filename) {
  var spectrum = spectraData.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString()
  );
  return spectrum;
}

describe('spectra-data examples peak picking ', () => {
  var nH = 8;
  var spectrum = createSpectraData(
    '/../../../../../data-test/ethylvinylether/1h.jdx'
  );
  var peakPicking = spectrum.getRanges({
    nH: nH,
    realTopDetection: true,
    thresholdFactor: 1,
    clean: 0.5,
    compile: true
  });
  test('patterns for ethylvinylether (OLD)', () => {
    for (var i = 0; i < peakPicking.length; i++) {
      var signal = peakPicking[i].signal[0];
      if (Math.abs(signal.delta1 - 1.308) < 0.01) {
        expect(signal.multiplicity).toBe('t');
      }
      if (Math.abs(signal.delta1 - 3.77) < 0.01) {
        expect(signal.multiplicity).toBe('q');
      }
      if (Math.abs(signal.delta1 - 3.99) < 0.01) {
        expect(signal.multiplicity).toBe('dd');
      }
      if (Math.abs(signal.delta1 - 4.2) < 0.01) {
        expect(signal.multiplicity).toBe('dd');
      }
      if (Math.abs(signal.delta1 - 6.47) < 0.01) {
        expect(signal.multiplicity).toBe('dd');
      }
    }
  });

  test('Number of patterns', () => {
    expect(peakPicking.length).toBe(5);
  });

  test('examples integration and multiplet limits', () => {
    expect(peakPicking[4].from).toBeLessThan(1.29);
    expect(peakPicking[4].to).toBeGreaterThan(1.325);
  });
});
