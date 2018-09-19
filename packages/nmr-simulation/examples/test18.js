/**
 * Created by acastillo on 8/11/16.
 */
'use strict';

const request = require('request');
const sm = require('..');
const predictor = require("nmr-predictor");

var molfile = `CC(C)C(C)C(C)C
JME 2016-03-06 Mon Aug 22 08:46:01 GMT-500 2016

  8  7  0  0  0  0  0  0  0  0999 V2000
    0.0000    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124    2.1000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4248    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6373    2.1000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    4.8497    1.4000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    2.4249    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.6373    3.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.2124    3.5000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
  4  5  1  0  0  0  0
  3  6  1  0  0  0  0
  4  7  1  0  0  0  0
  2  8  1  0  0  0  0
M  END
`;

var body = `7	1	0.880	2	10	2	7.118	11	2	7.118
8	1	0.880	2	10	2	7.118	11	2	7.118
9	1	0.880	2	10	2	7.118	11	2	7.118
10	2	1.351	5	7	1	7.118	8	1	7.118	9	1	7.118	12	3	6.915	13	3	6.915
11	2	1.351	5	7	1	7.118	8	1	7.118	9	1	7.118	12	3	6.915	13	3	6.915
12	3	1.457	3	10	2	6.915	11	2	6.915	14	4	6.163
13	3	1.457	3	10	2	6.915	11	2	6.915	14	4	6.163
14	4	3.616	5	12	3	6.163	13	3	6.163	15	5	6.163	16	5	6.163	17	5	6.163
15	5	1.183	1	14	4	6.163
16	5	1.183	1	14	4	6.163
17	5	1.183	1	14	4	6.163
`;

//request.post("http://www.nmrdb.org/service/predictor",{form:{molfile:molfile}},function(error, response, body){
//const predictor = new NmrPredictor("spinus");
predictor.spinus(molfile).then(prediction => {
  ;
  const spinSystem = sm.SpinSystem.fromPrediction(prediction);    //console.log(spinSystem);
  //console.log(body.replace(/\t/g,"\\t"));
  var options = {
    frequency: 400.082470657773,
    from: 0,
    to: 10,
    lineWidth: 1.25,
    nbPoints: 16 * 1024,//16384,
    maxClusterSize: 6,
    output: "xy"
  }
  //spinSystem.ensureClusterSize(options);
  console.log(spinSystem);
  console.time('simulate');
  var simulation = sm.simulate1D(spinSystem, options);
  console.timeEnd('simulate');
  //console.log(JSON.stringify(simulation));
});
