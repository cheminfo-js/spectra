/**
 * Created by acastillo on 8/11/16.
 */
'use strict';

const request = require('request');
const nmr = require('.');
const NmrPredictor = new require("nmr-predictor");

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

var body = `6	1	4.738	2	8	2	7.597	7	1	2.264
7	1	4.793	2	6	1	2.264	8	2	14.689
8	2	6.707	2	6	1	7.597	7	1	14.689
9	4	3.919	3	11	5	7.012	12	5	7.012	13	5	7.012
10	4	3.919	3	11	5	7.012	12	5	7.012	13	5	7.012
11	5	1.233	2	9	4	7.012	10	4	7.012
12	5	1.233	2	9	4	7.012	10	4	7.012
13	5	1.233	2	9	4	7.012	10	4	7.012
`;

//request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
    const predictor = new NmrPredictor("spinus");
    const prediction = predictor.predict(molfile, body);
    const spinSystem = nmr.SpinSystem.fromPrediction(prediction);
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
    var simulation = nmr.simulate1D(spinSystem, options);
    console.timeEnd('simulate');
    //console.log(JSON.stringify(simulation));
//});
