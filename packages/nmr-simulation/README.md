# nmr-simulation
  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

Simulate NMR spectra from spin systems

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
        atomLabel: 'H
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

