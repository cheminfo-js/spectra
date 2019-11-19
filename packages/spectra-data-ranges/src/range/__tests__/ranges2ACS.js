import { readFileSync } from 'fs';
import { join } from 'path';

import * as spectraData from 'spectra-data';

function createSpectraData(filename) {
  let spectrum = spectraData.NMR.fromJcamp(
    readFileSync(join(__dirname, filename)).toString(),
  );
  return spectrum;
}

describe('spectra-data examples peak picking in ACS format', () => {
  let spectrum = createSpectraData(
    '/../../../../../data-test/ethylbenzene/h1_0.jdx',
  );
  it('format ACS new input format', () => {
    let peakPicking2 = spectrum.createRanges({
      nH: 10,
      realTopDetection: true,
      thresholdFactor: 1,
      clean: 0.5,
      compile: true,
      optimize: true,
      damping: 0.0001,
      gradientDifference: 10e-2,
      maxIterations: 500,
      errorTolerance: 10e-4,
    });
    let acs = peakPicking2.getACS({
      nucleus: spectrum.getNucleus(),
      frequencyObserved: spectrum.observeFrequencyX(),
      ascending: false,
    });
    expect(acs).toBe(
      '<sup>1</sup>H NMR (400 MHz): δ 7.28 (2H, m), 7.20 (3H, m), 2.60 (2H, q, <i>J</i> = 7.6 Hz), 1.19 (3H, t, <i>J</i> = 7.6 Hz).',
    );
  });
});
