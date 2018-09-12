# nmr-simulation
  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Simulate NMR spectra from spin systems

The computational cost for the simulation of NMR spectra grows exponentially with the number of nuclei. Today, the memory available to store the Hamiltonian limits the size of the system that can be studied. Modern computers enable to tackle systems containing up to 13 spins [1], which obviously does not allow to study most molecules of interest in research. This issue can be addressed by identifying groups of spins or fragments that are not or only weakly interacting together, i.e., that only share weakly coupled spin pairs. Such a fragmentation is only permitted in the weak coupling regime, i.e., when the coupling interaction is weak compared to the difference in chemical shift of the coupled spins. Here, we propose a procedure that removes weak coupling interactions in order to split the spin system efficiently and to correct a posteriori for the effect of the neglected couplings. This approach yields accurate spectra when the adequate interactions are removed, i.e., between spins only involved in weak coupling interactions, but fails otherwise. As a result, the computational time for the simulation of 1D spectra grows linearly with the size of the spin system.

This library is a JavaScript implementation of such algorithm. The spin system is specified as a set of magnetically equivalent spins. The description of the input format is ilustrated by means of the bellow example. There we have a spin system composed of 4 spins(11, 12, 5 and 6). Spins 11 and 12 are chemically equivalent, so they must be specified on the same group. nbAtoms stands for the number of atoms in the group. It should math the atomIDs.length. AtomLabel stands for the kind of atom of the group. It could be H, C, N, P refering to nuclei 1H, 13C, 15N and 31P respectively. 

Coupling between atoms could be specified in the j array. Each element represent a coupling from the current group of atoms to the atoms specified by the 'assignment' property. The 'coupling' property stands for the scalar coupling constant in Hertz. The 'multiplicity' property stands for the number of equivalent atoms refered by the 'assignment' property. Actually only 'd' is supported, meaning that only a coupling to a single atom could be specified by each entry in the j array. The 'distance' parameter stands for the number of bonds that separate the atoms involved in the entanglement.

For a better explanation, we show in the example, a very simple spin system of 3 hydrogen atoms AXX: '11', '5' and '6'. There, the atoms '5' and '6' are chemically equivalent, thus, we have a only 2 entries in the array: The first one for the atom with atomIDs: ['11'] and the second one for the atoms with atomIDs: ['5', '6']. The atom '11' resonates at 1.2ppm and the atoms '5' and '6' that resonates at 1.3ppm. The atom '11' has a coupling constant with the other atoms of 7.4 Hz, and the distance between then is of 3 bonds.
The simulator will produce a spectrum at 400.082470657773 Mhz, from 1 to 1.5 ppm, and 3Hz of linewidth. The spectrum will contain 512 points.

## Parameters

*spinSystem*: A JSON object describing a spinSystem ready for simulation. As this object is to complex to be defined manually, we created a helper that formats the systemSystem from a JSON definition.

## Options
| Option | Description |
| --- | --- |
| **frequency** | The frequency in Mhz of the fake spectrometer that records the spectrum. 400 by default|
|**from** | The low limit of the ordinate variable. 0 by default|
|**to** | The high limit of the ordinate variable. 10 by default|
|**lineWidth** | The linewidth of the output spectrum, expresed in Hz. 1Hz by default|
|**nbPoints** | Number of points of the output spectrum. 1024 by default|
|**maxClusterSize** | Maximum number of atoms on each cluster that can be considered to be simulated together. It affects the the quality and speed of the simulation. 10 by default|
|**output** | ['y' or 'xy'] it specify the output format. if 'y' is specified, the output of the simulation will be a single vector containing the y data of the spectrum. if 'xy' is specified, the output of the simulation will be an object containing {x,[], y:[]}, the x, y of the spectrum. 'y' by default|


## Installation

`$ npm i nmr-simulation`

## [API Documentation](https://mljs.github.io/spectra/packages/nmr-simulation)

## Example

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

