import getOcleFromOptions from './getOcleFromOptions';

const defaultOptions = {
    atomLabel: 'H',
    ignoreLabile: true,
    use: 'median',
    levels: [5, 4, 3, 2],
    keepMolfile: false,
    keepMolecule: false,
    distanceMatrix: false
};

export default function normalizeOptions(molecule, options) {
    options = Object.assign({}, defaultOptions, options);
    let { Molecule, Util } = getOcleFromOptions(options);//(0, getOcleFromOptions.default)(options);
    if (typeof molecule === 'string') {
        if (molecule.split(/[\r\n]+/).length > 2) {
            molecule = Molecule.fromMolfile(molecule);
        } else {
            // it is probably a SMILES
            molecule = Molecule.fromSmiles(molecule);
        }
    }
    if (molecule instanceof Molecule) {
        if (options.atomLabel === 'H') {
            molecule.addImplicitHydrogens();
        }
        //@TODO Should be removed
        if (options.atomLabel === 'C') {
            molecule.removeExplicitHydrogens();
        }
        return [molecule2Json(molecule, Util, options), options];
    }
    if(options.keepMolfile && !molecule.molfile) {
        //console.log(options.OCLE.Molecule)
        let mol = options.OCLE.Molecule.fromIDCode(molecule.id);
        mol.addImplicitHydrogens();
        molecule.molfile = mol.toMolfile();
        if (options.distanceMatrix && !molecule.distanceMatrix) {
            molecule.distanceMatrix = mol.getConnectivityMatrix({ pathLength: true });
        }
    }

    return [molecule, options];
}

function molecule2Json(molecule, Util, options) {
    //molecule.addImplicitHydrogens();
    var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, '$1') * 1;
    var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
    diaIDs.sort(function (a, b) {
        if (a.atomLabel === b.atomLabel) {
            return b.counter - a.counter;
        }
        return a.atomLabel < b.atomLabel ? 1 : -1;
    });

    const linksOH = molecule.getAllPaths({
        fromLabel: 'H',
        toLabel: 'O',
        minLength: 1,
        maxLength: 1
    });

    const linksNH = molecule.getAllPaths({
        fromLabel: 'H',
        toLabel: 'N',
        minLength: 1,
        maxLength: 1
    });

    const linksClH = molecule.getAllPaths({
        fromLabel: 'H',
        toLabel: 'Cl',
        minLength: 1,
        maxLength: 1
    });

    const atoms = {};
    const levels = options.levels;
    let hasLabile = false;
    for (const diaId of diaIDs) {
        delete diaId['_highlight'];
        diaId.hose = Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
            maxSphereSize: levels[0],
            type: 0
        });

        for (const atomID of diaId.atoms) {
            atoms[atomID] = diaId.oclID;
        }

        diaId.isLabile = false;
        
        for (const linkOH of linksOH) {
            if (diaId.oclID === linkOH.fromDiaID) {
                diaId.isLabile = true;
                hasLabile = true;
                break;
            }
        }
        for (const linkNH of linksNH) {
            if (diaId.oclID === linkNH.fromDiaID) {
                diaId.isLabile = true;
                hasLabile = true;
                break;
            }
        }
        for (const linkClH of linksClH) {
            if (diaId.oclID === linkClH.fromDiaID) {
                diaId.isLabile = true;
                hasLabile = true;
                break;
            }
        }
    }

    let toReturn = {id: molecule.getIDCode(), atom: atoms, diaId: diaIDs, nH: nH, hasLabile };

    if (options.distanceMatrix) {
        toReturn.distanceMatrix = molecule.getConnectivityMatrix({pathLength: true});
    } 
    if (options.keepMolfile) {
        toReturn.molfile = molecule.toMolfile();
    }
    if (options.keepMolecule) {
        toReturn.molecule = molecule;
    }

    return toReturn;
}