const predictor = require('..');

import FS from 'fs';

const db1H = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/h1.json`, 'utf8')
);
const db13C = JSON.parse(
  fs.readFileSync(`${__dirname}/../data/nmrshiftdb2-13c.json`, 'utf8')
);

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

describe('Spinus prediction', function () {
  it('1H chemical shift prediction expanded', function () {
    predictor.spinus(molfile).then((prediction) => {
      expect(prediction.length).toBe(10);
    });
  });
  it('1H chemical shift prediction grouped', function () {
    predictor.spinus(molfile, { group: true }).then((prediction) => {
      expect(prediction.length).toBe(5);
    });
  });
  it('1H chemical shift prediction expanded from SMILES', function () {
    predictor.spinus('c1ccccc1').then((prediction) => {
      expect(prediction.length).toBe(6);
    });
  });
  it('1H chemical shift prediction expanded from SMILES ethylbenzene', function () {
    predictor.spinus('c1ccccc1CC').then((prediction) => {
      expect(prediction.length).toBe(10);
    });
  });
});

describe('HOSE assignment prediction', function () {
  it('1H chemical shift prediction expanded', function () {
    const prediction = predictor.proton(molfile, { db: db1H });
    expect(prediction[0].delta).toBeGreaterThan(0);
    expect(prediction.length).toBe(10);
  });
  // commented until fix the format of signals in HOSE assignment predictor
  // it('1H chemical shift prediction grouped', function () {
  //     const prediction = predictor.proton(molfile, {group: true, db: db1H});
  //     prediction[0].delta.should.greaterThan(0);
  //     prediction.length.should.equal(5);
  // });

  it('13C chemical shift prediction expanded', function () {
    const prediction = predictor.carbon(molfile, { db: db13C });
    expect(prediction.length).toBe(8);
    expect(prediction[0].delta).toBeGreaterThan(0);
    expect(prediction[1].delta).toBeGreaterThan(0);
    expect(prediction[2].delta).toBeGreaterThan(0);
    expect(prediction[3].delta).toBeGreaterThan(0);
    expect(prediction[4].delta).toBeGreaterThan(0);
    expect(prediction[5].delta).toBeGreaterThan(0);
    expect(prediction[6].delta).toBeGreaterThan(0);
    expect(prediction[7].delta).toBeGreaterThan(0);
  });
  // commented until fix the format of signals in HOSE assignment predictor
  // it('13C chemical shift prediction grouped', function () {
  //     const prediction = predictor.carbon(molfile, {group: true, db: db13C});
  //     prediction.length.should.eql(6);
  //     prediction[0].delta.should.greaterThan(0);
  //     prediction[1].delta.should.greaterThan(0);
  //     prediction[2].delta.should.greaterThan(0);
  //     prediction[3].delta.should.greaterThan(0);
  //     prediction[4].delta.should.greaterThan(0);
  //     prediction[5].delta.should.greaterThan(0);
  // });
});
