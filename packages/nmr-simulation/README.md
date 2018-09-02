# nmr-simulation
  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Simulate NMR spectra from spin systems

The computational cost for the simulation of NMR spectra grows exponentially with the number of nuclei. Today, the memory available to store the Hamiltonian limits the size of the system that can be studied. Modern computers enable to tackle systems containing up to 13 spins [1], which obviously does not allow to study most molecules of interest in research. This issue can be addressed by identifying groups of spins or fragments that are not or only weakly interacting together, i.e., that only share weakly coupled spin pairs. Such a fragmentation is only permitted in the weak coupling regime, i.e., when the coupling interaction is weak compared to the difference in chemical shift of the coupled spins. Here, we propose a procedure that removes weak coupling interactions in order to split the spin system efficiently and to correct a posteriori for the effect of the neglected couplings. This approach yields accurate spectra when the adequate interactions are removed, i.e., between spins only involved in weak coupling interactions, but fails otherwise. As a result, the computational time for the simulation of 1D spectra grows linearly with the size of the spin system.
This library is a JavaScript implementation of such algorithm. The spin system is specified as a set of magnetically equivalent spins. The description of the input format is ilustrated by means of the bellow example. There we have a spin system composed of 4 spins(11, 12, 5 and 6). Spins 11 and 12 are chemically equivalent, so they must be specified on the same group. nbAtoms stands for the number of atoms in the group. It should math the atomIDs.length. AtomLabel stands for the kind of atom of the group. It could be H, C, N, P refering to nuclei 1H, 13C, 15N and 31P respectively. Coupling between atoms should be specified in the j array.

## Installation

`$ npm i nmr-simulation`

## [API Documentation](https://mljs.github.io/spectra/packages/nmr-simulation)

## Example

```js

const simulation = require('nmr-simulation');

const prediction = [
    {
        atomIDs: ['11', '12'],
        nbAtoms: 2,
        delta: 1,
        atomLabel: 'H'
    }, {
        atomIDs: ['5', '6'],
        nbAtoms: 2,
        delta: 1,
        atomLabel: 'H'
    }
];

var options1h = {
    frequency: 400.082470657773,
    from: 0,
    to: 3,
    lineWidth: 3,
    nbPoints: 16384,
    maxClusterSize: 8,
    output: 'xy'
};

const spinSystem = nmr.SpinSystem.fromPrediction(prediction1h);
spinSystem.ensureClusterSize(options1h);
var spectrum = nmr.simulate1D(spinSystem, options1h);
console.log(spectrum.x);// x in PPM
console.log(spectrum.y);// y in arbitrary units
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

