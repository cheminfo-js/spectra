import FS from 'fs';
import path from 'path';

import * as spectraData from 'spectra-data';

function createSpectraData(filename) {
  let spectrum = spectraData.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename)).toString(),
  );
  return spectrum;
}

describe('spectra-data examples peak picking', () => {
  let nH = 8;
  let spectrum = createSpectraData(
    '/../../../../../data-test/ethylvinylether/1h.jdx',
  );
  let peakPicking = spectrum.getRanges({
    nH: nH,
    realTopDetection: true,
    thresholdFactor: 1,
    clean: 0.5,
    compile: true,
  });
  it('patterns for ethylvinylether (OLD)', () => {
    for (let i = 0; i < peakPicking.length; i++) {
      let signal = peakPicking[i].signal[0];
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

  it('Number of patterns', () => {
    expect(peakPicking).toHaveLength(5);
  });

  it('examples integration and multiplet limits', () => {
    expect(peakPicking[4].from).toBeLessThan(1.29);
    expect(peakPicking[4].to).toBeGreaterThan(1.325);
  });
});
