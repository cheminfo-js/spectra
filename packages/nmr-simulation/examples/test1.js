'use strict';

const request = require('request');
const sm = require('..');
const predictor = require("nmr-predictor");

var molfile =
  `CCCC(C)O
JME 2016-03-06 Tue May 24 10:19:11 GMT+200 2016

  6  5  0  0  0  0  0  0  0  0999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124    0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4248    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6373    0.7000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.8497    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6373    2.1000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  4  6  1  0  0  0  0
M  END
`;

//request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
//const predictor = new NmrPredictor("spinus");
predictor.spinus(molfile).then(prediction => {
  const spinSystem = sm.SpinSystem.fromPrediction(prediction);
  //console.log(spinSystem);
  console.time('simulating. It could take several minutes');
  var simulation = sm.simulate1D(spinSystem, {
    frequency: 400.082470657773,
    from: 0,
    to: 11,
    lineWidth: 1,
    nbPoints: 16384,
    maxClusterSize: Infinity
  });
  console.timeEnd('simulate');
});
