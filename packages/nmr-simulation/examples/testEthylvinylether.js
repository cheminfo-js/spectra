/**
 * Created by acastillo on 8/11/16.
 */
'use strict';

const request = require('request');
const sm = require('..');
const predictor = require("nmr-predictor");

var molfile = `ethylvinylether.mol


  5  4  0  0  0  0  0  0  0  0999 V2000
   -1.4289    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
   -0.7145   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    0.0000    0.2062    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
    0.7145   -0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.4289    0.2062    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  2  1  2  0
  3  2  1  0
  4  3  1  0
  5  4  1  0
M  END

`;

predictor.spinus(molfile).then(prediction => {
    const spinSystem = sm.SpinSystem.fromPrediction(prediction);
    //console.log(body.replace(/\t/g,"\\t"));
    var options = {
        frequency: 400.082470657773,
        from: 0,
        to: 11,
        lineWidth: 1,
        nbPoints: 16384,
        maxClusterSize: 6
    };

    spinSystem.ensureClusterSize(options);
    console.log(spinSystem);
    console.time('simulate');
    var simulation = sm.simulate1D(spinSystem, options);
    console.timeEnd('simulate');
    //console.log(JSON.stringify(simulation));
});
