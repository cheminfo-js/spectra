/**
 * Created by acastillo on 8/11/16.
 */
'use strict';

const sm = require('nmr-simulation');
const predictor = require("nmr-predictor");


var molfile = `Benzene, ethyl-, ID: C100414
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

//Predict and simulate 1H and COSY for Ethylbenzene
predictor.spinus(molfile, { group: false }).then(prediction => {
  const spinSystem = sm.SpinSystem.fromPrediction(prediction);
  var options = {
    frequency: 400.082470657773,
    from: 0,
    to: 11,
    lineWidth: 1,
    nbPoints: 16384,
    maxClusterSize: 8
  }
  spinSystem.ensureClusterSize(options);

  //Simulate 1H spectrum
  var simulation1D = sm.simulate1D(spinSystem, options);

  //Predict 2D components. It will allow to observe interaction between atoms from 0 to 3 bond of distance
  const prediction2D = predictor.twoD(prediction, prediction, molfile, { minLength: 0, maxLength: 3 });
  var optionsCOSY = {
    frequencyX: 400.08,
    frequencyY: 400.08,
    lineWidthX: 2, //Hz
    lineWidthY: 2, //Hz
    firstX: 0,
    lastX: 11,
    firstY: 0,
    lastY: 11,
    nbPointsX: 512,
    nbPointsY: 512,
    symmetrize: true
  };

  //Simulate COSY spectrum
  var spectrum2D = sm.simulate2D(prediction2D, optionsCOSY);
}, reject => { console.log(reject) });

