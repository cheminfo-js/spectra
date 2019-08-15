
const predictor = require('..');

const molfile = `Benzene, ethyl-, ID: C100414
  NIST    16081116462D 1   1.00000     0.00000
Copyright by the U.S. Sec. Commerce on behalf of U.S.A. All rights reserved.
  8  8  0     0  0              1 V2000
    0.5015    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
    0.0000    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    1.5046    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
    2.0062    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    3.0092    0.8526    0.0000 C   0  0  0  0  0  0           0  0  0
    1.5046    1.7554    0.0000 C   0  0  0  0  0  0           0  0  0
    0.5015    1.7052    0.0000 C   0  0  0  0  0  0           0  0  0
    3.5108    0.0000    0.0000 C   0  0  0  0  0  0           0  0  0
  1  2  2  0     0  0
  3  1  1  0     0  0
  2  7  1  0     0  0
  4  3  2  0     0  0
  4  5  1  0     0  0
  6  4  1  0     0  0
  5  8  1  0     0  0
  7  6  2  0     0  0
M  END
`;

const path = 'https://raw.githubusercontent.com/cheminfo-js/nmr-predictor/master/data/';

describe('URL JSON 1H prediction', function () {
  it.skip('1H chemical shift prediction expanded', function () {
    predictor.fetchProton(`${path}h1.json`, 'customProton');
    const prediction = predictor.proton(molfile, { group: true, db: 'customProton' });
    expect(prediction.length).toBe(5);
  });
});

describe('URL JSON 13C prediction', function () {
  it.skip('13C chemical shift prediction expanded', function () {
    predictor.fetchCarbon(`${path}nmrshiftdb2-13c.json`, 'customCarbon');
    const prediction = predictor.carbon(molfile, { group: true, db: 'customCarbon' });
    expect(prediction.length).toBe(6);
  });
});
