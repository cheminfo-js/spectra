/**
 * Created by acastillo on 8/11/16.
 */
'use strict';

const request = require('request');
const sm = require('..');
const predictor = require("nmr-predictor");

var molfile = `CCCC(C)O
JME 2016-03-06 Tue Aug 16 14:43:07 GMT-500 2016

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

//!!NOT WORKING. There is a problem with openchemlib and this molecule

/*
predictor.spinus(molfile).then(prediction => {
    console.log(prediction)
    const spinSystem = sm.SpinSystem.fromPrediction(prediction);
    //console.log(spinSystem);
    //console.log(body.replace(/\t/g,"\\t"));
    var options = {
        frequency: 400.082470657773,
        from: 0,
        to: 10,
        lineWidth: 1.25,
        nbPoints: 16 * 1024,//16384,
        maxClusterSize: 15,
        output: "xy"
    }
    //spinSystem.ensureClusterSize(options);
    console.log(spinSystem);
    console.time('simulate');
    var simulation = sm.simulate1D(spinSystem, options);
    console.timeEnd('simulate');
    //console.log(JSON.stringify(simulation));
}, reject => { console.log(reject) });*/
