# nmr-predictor

  [![NPM version][npm-image]][npm-url]
  [![build status][travis-image]][travis-url]
  [![David deps][david-image]][david-url]
  [![npm download][download-image]][download-url]

NMR chemical shift predictor

This library provide function for predicting nmr chemical shift for 1H and 13C. The predictions could be made from 2 different ways: 1. By the use of a local database of molecular fragments that are paired with is corresponding chemical shifts, and 2. by the use of Spinus too.
The predictor accepts a molfile as input data, and produces a set of predictions for each of the atoms in the molecule. Prediction of coupling constants are supported aswell, by means of the Karplus equation.

## Installation

```
$ npm install nmr-predictor
```

## Example: Prediction of 1H and 13C chemical shifts for the Ethylbenzene. 

In this example, we made use of our local databases for the chemical shift prediction. If you don't have your own databases, you may use our precompiled libraries for 1H and 13C, available in our github project by means of the fecthProton and fetchCarbon functions. fetchCarbon retrieves a compiled version of NMRShiftDB2 database. fetchProton retrieves an inhouse beta library for 1H predictions.

```js
'use strict';

const predictor = require('..');

const molfile = `Benzene, ethyl-, ID: C100414
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

// 1D proton prediction
predictor.fetchProton().then(function () {
    console.log(predictor.proton(molfile));
});

// 2D HSQC prediction
Promise.all([
  predictor.fetchProton(),
  predictor.fetchCarbon()
]).then(function (dbs) {
  return predictor.twod(predictor.proton(molfile), predictor.carbon(molfile), molfile);
});

// 2D HSQC with spinus
Promise.all([
  predictor.spinus(molfile),
  predictor.fetchCarbon()
]).then(function (results) {
  return predictor.twod(results[0], predictor.carbon(molfile), molfile);
});
```

## License

  [MIT](./LICENSE)

[npm-image]: https://img.shields.io/npm/v/nmr-predictor.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/nmr-predictor
[travis-image]: https://img.shields.io/travis/cheminfo-js/nmr-predictor/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/cheminfo-js/nmr-predictor
[david-image]: https://img.shields.io/david/cheminfo-js/nmr-predictor.svg?style=flat-square
[david-url]: https://david-dm.org/cheminfo-js/nmr-predictor
[download-image]: https://img.shields.io/npm/dm/nmr-predictor.svg?style=flat-square
[download-url]: https://www.npmjs.com/package/nmr-predictor
