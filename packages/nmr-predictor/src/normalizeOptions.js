import getOcleFromOptions from './getOcleFromOptions';

const defaultOptions = {
    atomLabel: 'H',
    ignoreLabile: true,
    use: 'median'
};

export default function normalizeOptions(molecule, options) {
    options = Object.assign({}, defaultOptions, options);
    let {Molecule} = getOcleFromOptions(options);
    if (typeof molecule === 'string') {
        if (molecule.split(/[\r\n]+/).length > 2) {
            molecule = Molecule.fromMolfile(molecule);
        } else { // it is probably a SMILES
            molecule = Molecule.fromSmiles(molecule);
        }
    } else if (!(molecule instanceof Molecule)) {
        throw new Error('molecule must be a molfile string or Molecule instance');
    }

    if (options.atomLabel === 'H') {
        molecule.addImplicitHydrogens();
    }
    //@TODO Should be removed
    if (options.atomLabel === 'C') {
        molecule.removeExplicitHydrogens();
    }

    return [molecule, options];
}
