# nmr-simulation
  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Simulate NMR spectra from spin systems

The computational cost for the simulation of NMR spectra grows exponentially with the number of nuclei. Today, the memory available to store the Hamiltonian limits the size of the system that can be studied. Modern computers enable to tackle systems containing up to 13 spins [1], which obviously does not allow to study most molecules of interest in research. This issue can be addressed by identifying groups of spins or fragments that are not or only weakly interacting together, i.e., that only share weakly coupled spin pairs. Such a fragmentation is only permitted in the weak coupling regime, i.e., when the coupling interaction is weak compared to the difference in chemical shift of the coupled spins. Here, we propose a procedure that removes weak coupling interactions in order to split the spin system efficiently and to correct a posteriori for the effect of the neglected couplings. This approach yields accurate spectra when the adequate interactions are removed, i.e., between spins only involved in weak coupling interactions, but fails otherwise. As a result, the computational time for the simulation of 1D spectra grows linearly with the size of the spin system.

This library is a JavaScript implementation of such algorithm. The spin system is specified as a set of magnetically equivalent spins. The description of the input format is illustrated by means of the below example. There we have a spin system composed of 4 spins(11, 12, 5 and 6). Spins 11 and 12 are chemically equivalent, so they must be specified on the same group. nbAtoms stands for the number of atoms in the group. It should math the atomIDs.length. AtomLabel stands for the kind of atom of the group. It could be H, C, N, P referring to nuclei 1H, 13C, 15N and 31P respectively. 

Coupling between atoms could be specified in the j array. Each element represent a coupling from the current group of atoms to the atoms specified by the 'assignment' property. The 'coupling' property stands for the scalar coupling constant in Hertz. The 'multiplicity' property stands for the number of equivalent atoms referred by the 'assignment' property. Actually only 'd' is supported, meaning that only a coupling to a single atom could be specified by each entry in the j array. The 'distance' parameter stands for the number of bonds that separate the atoms involved in the entanglement.

For a better explanation, we show in the example, a very simple spin system of 3 hydrogen atoms AXX: '11', '5' and '6'. There, the atoms '5' and '6' are chemically equivalent, thus, we have a only 2 entries in the array: The first one for the atom with atomIDs: ['11'] and the second one for the atoms with atomIDs: ['5', '6']. The atom '11' resonates at 1.2ppm and the atoms '5' and '6' that resonates at 1.3ppm. The atom '11' has a coupling constant with the other atoms of 7.4 Hz, and the distance between then is of 3 bonds.
The simulator will produce a spectrum at 400.082470657773 Mhz, from 1 to 1.5 ppm, and 3Hz of linewidth. The spectrum will contain 512 points.

## simulate1d

This function simulates a one dimensional nmr spectrum. This function returns an array containing the relative intensities of the spectrum in the specified simulation window (from-to).

### Parameters

*spinSystem*: A JSON object describing a spinSystem ready for simulation. As this object is too complex to be defined manually, we created a helper that formats the systemSystem from a JSON definition.

### Options for simulate1d
| Option | Description |
| --- | --- |
| **frequency** | The frequency in Mhz of the fake spectrometer that records the spectrum. 400 by default|
|**from** | The low limit of the ordinate variable. 0 by default|
|**to** | The upper limit of the ordinate variable. 10 by default|
|**lineWidth** | The linewidth of the output spectrum, expressed in Hz. 1Hz by default|
|**nbPoints** | Number of points of the output spectrum. 1024 by default|
|**maxClusterSize** | Maximum number of atoms on each cluster that can be considered to be simulated together. It affects the the quality and speed of the simulation. 10 by default|
|**output** | ['y' or 'xy'] it specify the output format. if 'y' is specified, the output of the simulation will be a single vector containing the y data of the spectrum. if 'xy' is specified, the output of the simulation will be an object containing {x,[], y:[]}, the x, y of the spectrum. 'y' by default|

## simule2DNmrSpectrum

This function simulates a bidimensional nmr spectrum. This function returns a matrix containing the relative intensities in the bidimensional simulation window.

### Parameters

*table*: A JSON object describing each existing interaction between pair of atoms(spins) in the molecule

### Options for simule2DNmrSpectrum
| Option | Description |
| --- | --- |
| **frequencyX** | The  spectrometer frequency for the direct dimension. Default: 400Mhz for 1H and 100 Mhz for 13C|
| **frequencyY** | The  spectrometer frequency for the indirect dimension. Default: 400Mhz for 1H and 100 Mhz for 13C|
|**firstX** | The low limit of the simulation window in the direct dimension. Minimum chemical shift for the direct dimension by default|
|**lastX** | The upper limit of the simulation window in the direct dimension. Maximum chemical shift for the direct dimension by default|
|**firstY** | The low limit of the simulation window in the indirect dimension. Minimum chemical shift for the indirect dimension by default|
|**lastY** | The upper limit of the simulation window in the indirect dimension. Maximum chemical shift for the indirect dimension by default|
|**lineWidthX** | The linewidth of the output spectrum in the direct dimension, expressed in Hz. 10 Hz by default|
|**lineWidthY** | The linewidth of the output spectrum in the indirect dimension, expressed in Hz. 10 Hz by default|
|**nbPointsX** | Number of points of the output spectrum in the direct dimension. 512 by default|
|**nbPointsY** | Number of points of the output spectrum in the indirect dimension. 512 by default|


## Installation

`$ npm i nmr-simulation`

## Deployment

Install the npm package [cheminfo-tools](https://www.npmjs.com/package/cheminfo-tools)

Build the nmr-simulation.js auto contained ECMA-5 javascript for the browser

  `$ cheminfo build`

Build and publish a new release of nmr-simulation on www.npmjs.com

  `$ cheminfo publish`


## [API Documentation](https://mljs.github.io/spectra/packages/nmr-simulation)

## Example 1

```js

const simulation = require('nmr-simulation');

const prediction = [
    {
        atomIDs: ['11'],
        nbAtoms: 1,
        delta: 1.2,
        atomLabel: 'H',
        j:[{'assignment':['5'],'coupling':7.4,'multiplicity':'d','distance':3}, 
           {'assignment':['6'],'coupling':7.4,'multiplicity':'d','distance':3}]
    }, {
        atomIDs: ['5', '6'],
        nbAtoms: 2,
        delta: 1.3,
        atomLabel: 'H'
    }
];

var options1h = {
    frequency: 400.082470657773,
    from: 1,
    to: 1.5,
    lineWidth: 3,
    nbPoints: 512,
    maxClusterSize: 8,
    output: 'xy'
};

const spinSystem = simulation.SpinSystem.fromPrediction(prediction);
spinSystem.ensureClusterSize(options1h);
var spectrum = simulation.simulate1D(spinSystem, options1h);
console.log(JSON.stringify(spectrum.x));// x in PPM
console.log(JSON.stringify(spectrum.y));// y in arbitrary units
```

A plot of the output spectrum

<img width="300" alt="output" src="https://github.com/cheminfo-js/spectra/blob/master/packages/nmr-simulation/examples/spectrum.png"> 

## Example 2: Simulating a 2D spectrum. 

 This example illustrates the simulation of a system (B, AA, C ). Atoms of the group AA, resonating at 2 ppm, are coupled with the atom B that resonates at 1 ppm. The scalar coupling between them
 is 7 Hz. Atoms of the group AA are coupled with atom C, that resonates at 3ppm. The scalar coupling between then is 16Hz. There is not direct coupling between atom B and C.
 This should produce a pattern like the below in the code:

```js
/*
  x:   0.5 1.0 1.5 2.0 2.5 3.0 3.5
 ____________________________________
 0.5 |  0   0   0   0   0   0   0
 1.0 |  0   1   0   1   0   0   0
 1.5 |  0   0   0   0   0   0   0
 2.0 |  0   1   0   1   0   1   0
 2.5 |  0   0   0   0   0   0   0
 3.0 |  0   0   0   1   0   1   0
 3.5 |  0   0   0   0   0   0   0  
*/
const simulation = require('nmr-simulation');

const prediction = [{
    fromDiaID: 'A', toDiaID: 'A', fromAtoms: [8, 14], toAtoms: [8, 14],
    fromLabel: 'H', toLabel: 'H', pathLength: 0,
    fromChemicalShift: 2, toChemicalShift: 2,
    fromAtomLabel: 'H', toAtomLabel: 'H'
},
{
    fromDiaID: 'B', toDiaID: 'B', fromAtoms: [9], toAtoms: [9],
    fromLabel: 'H', toLabel: 'H', pathLength: 0,
    fromChemicalShift: 1, toChemicalShift: 1,
    fromAtomLabel: 'H', toAtomLabel: 'H'
},
{
    fromDiaID: 'C', toDiaID: 'C', fromAtoms: [10], toAtoms: [10],
    fromLabel: 'H', toLabel: 'H', pathLength: 0,
    fromChemicalShift: 3, toChemicalShift: 3,
    fromAtomLabel: 'H', toAtomLabel: 'H'
},
{
    fromDiaID: 'A', toDiaID: 'B', fromAtoms: [8, 14], toAtoms: [9],
    fromLabel: 'H', toLabel: 'H', pathLength: 3,
    fromChemicalShift: 2, toChemicalShift: 1,
    fromAtomLabel: 'H', toAtomLabel: 'H', j: 7
},
{
    fromDiaID: 'A', toDiaID: 'C', fromAtoms: [8, 14], toAtoms: [10],
    fromLabel: 'H', toLabel: 'H', pathLength: 3,
    fromChemicalShift: 2, toChemicalShift: 3,
    fromAtomLabel: 'H', toAtomLabel: 'H', j: 16
}];

var optionsCOSY = {
    frequencyX: 1, frequencyY: 1,
    lineWidthX: 0.07, lineWidthY: 0.07, //Hz
    firstX: 0.5, lastX: 3.5,
    firstY: 0.5, lastY: 3.5,
    nbPointsX: 7, nbPointsY: 7,
    symmetrize: true
};

var spectrum = simulation.simulate2D(prediction, optionsCOSY);
//Lets make a logical matrix. Smaller values than 1e-1 are 0, greather that that are 1
spectrum = spectrum.map(row => {
    return row.map(value => value < 1e-1 ? 0 : 1);
})
console.log(spectrum);
```


## Example 3: Simulating 1H and COSY spectra for Ethylbenzene. 

Chemical shift and coupling constants are predicted using Spinus, through our prediction library nmr-predictor

```js
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
    frequencyX: 400.08, frequencyY: 400.08,
    lineWidthX: 2, lineWidthY: 2, //Hz
    firstX: 0, lastX: 11,
    firstY: 0, lastY: 11,
    nbPointsX: 512, nbPointsY: 512,
    symmetrize: true
  };

  //Simulate COSY spectrum
  var spectrum2D = sm.simulate2D(prediction2D, optionsCOSY);
}, reject => { console.log(reject) });
```

## Example 3: Simulating 1H for Ethylbenzene and store the result in a JCAMP-DX file. 
```js
'use strict';

const sm = require('nmr-simulation');
const predictor = require("nmr-predictor");
const sd = require("spectra-data")

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
    maxClusterSize: 8, 
    output: 'xy'
  }
  spinSystem.ensureClusterSize(options);

  //Simulate 1H spectrum
  var data = sm.simulate1D(spinSystem, options);
  
  //Create an spectra-data object from xy
  spectrum = sd.NMR.fromXY(data.x, data.y, options);
  
  //Print the content of the jcamp-dx file
  console.log(spectrum.toJcamp({ type: 'NTUPLES' }));

}, reject => { console.log(reject) });
```


## License

[MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/nmr-simulation.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/nmr-simulation.
[travis-image]: https://img.shields.io/travis/mljs/nmr-simulation./master.svg?style=flat-square
[travis-url]: https://travis-ci.org/mljs/nmr-simulation
[david-image]: https://img.shields.io/david/mljs/nmr-simulation.svg?style=flat-square
[david-url]: https://david-dm.org/mljs/nmr-simulation
[download-image]: https://img.shields.io/npm/dm/nmr-simulation.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/nmr-simulation

