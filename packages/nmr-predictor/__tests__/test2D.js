'use strict';

require('should');
const predictor = require('..');
const fs = require('fs');

const db1H = JSON.parse(fs.readFileSync(__dirname + '/../data/h1.json', 'utf8'));
const db13C = JSON.parse(fs.readFileSync(__dirname + '/../data/nmrshiftdb2.json', 'utf8'));

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

describe('2D prediction', function () {
    it('COSY', function () {
        const h1 = predictor.proton(molfile, {db: db1H});
        const prediction = predictor.twoD(h1, h1, molfile, {minLength: 1, maxLength: 3});
        let count = 0;
        prediction.forEach(element => {
            if (element.fromDiaID === 'did@`@f\\bbRaih@J@A~dHBIU@'
                && element.toDiaID === 'did@`@fTfUvf`@h@GzP`HeT' && element.pathLength === 3) {
                count++;
            }
            if (element.toDiaID === 'did@`@f\\bbRaih@J@A~dHBIU@'
                && element.fromDiaID === 'did@`@fTfUvf`@h@GzP`HeT' && element.pathLength === 3) {
                count++;
            }
            if (element.fromDiaID === 'did@`@f\\bbRaih@J@A~dHBIU@'
                && element.toDiaID === 'did@`@fTfYUn`HH@GzP`HeT' && element.pathLength === 3) {
                count++;
            }
            if (element.toDiaID === 'did@`@f\\bbRaih@J@A~dHBIU@'
                && element.fromDiaID === 'did@`@fTfYUn`HH@GzP`HeT' && element.pathLength === 3) {
                count++;
            }
            if (element.fromDiaID === 'did@`@fTf[Waj@@bJ@_iB@bUP'
                && element.toDiaID === 'did@`@fTeYWaj@@@GzP`HeT' && element.pathLength === 3) {
                count++;
            }
            if (element.toDiaID === 'did@`@fTf[Waj@@bJ@_iB@bUP'
                && element.fromDiaID === 'did@`@fTeYWaj@@@GzP`HeT' && element.pathLength === 3) {
                count++;
            }

            if (element.toDiaID === 'did@`@fTf[Waj@@bJ@_iB@bUP'
                && element.fromDiaID === 'did@`@fTf[Waj@@bJ@_iB@bUP' && element.pathLength === 2) {
                count++;
            }
            if (element.toDiaID === 'did@`@fTeYWaj@@@GzP`HeT'
                && element.fromDiaID === 'did@`@fTeYWaj@@@GzP`HeT' && element.pathLength === 2) {
                count++;
            }
        });

        prediction.length.should.equal(count);
    });

    it('HSQC', function () {
        const c13 = predictor.carbon(molfile, {db: db13C});
        const h1 = predictor.proton(molfile, {db: db1H});
        // console.log(c13);
        // console.log(h1);
        const prediction = predictor.twoD(h1, c13, molfile, {minLength: 1, maxLength: 4});
        prediction.length.should.equal(24);
        prediction[0].fromChemicalShift.should.greaterThan(0);
        prediction[0].toChemicalShift.should.greaterThan(0);
    });
});
