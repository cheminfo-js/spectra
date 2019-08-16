import FS from 'fs';
import path from 'path';

import * as Data from '../..';

function createSpectraData(filename) {
  var spectrum = Data.NMR.fromJcamp(
    FS.readFileSync(path.join(__dirname, filename), 'utf8')
  );
  return spectrum;
}

describe('spectra-data examples getRanges', function() {
  it('number of peaks', function() {
    var spectrum = createSpectraData(
      '/../../../../../data-test/indometacin/1h.dx'
    );
    var ranges = spectrum.getRanges({
      nH: 16,
      realTop: true,
      thresholdFactor: 1,
      clean: 0.5,
      compile: true,
      idPrefix: '1H',
      removeImpurity: { solvent: 'DMSO', nH: 16 }
    });
    expect(ranges.length).toBe(8);
  });
});
