'use strict';

const {Molecule} = require('openchemlib-extended-minimal');

const defaultOptions = {
    atomLabel: 'H',
    ignoreLabile: true,
    use: 'median'
};

module.exports = function options(molecule, options) {
    if (typeof molecule === 'string') {
        if (molecule.split(/[\r\n]+/).length > 2) {
            molecule = Molecule.fromMolfile(molecule);
        } else { // it is probably a SMILES
            molecule = Molecule.fromSmiles(molecule);
        }
    } else if (!(molecule instanceof Molecule)) {
        throw new Error('molecule must be a molfile string or Molecule instance');
    }
    options = Object.assign({}, defaultOptions, options);

    if (options.atomLabel === 'H') {
        molecule.addImplicitHydrogens();
    }
    //@TODO Should be removed
    if (options.atomLabel === 'C') {
        //molecule.addImplicitHydrogens();
        molecule.removeExplicitHydrogens();
    }

    return [molecule, options];
};
