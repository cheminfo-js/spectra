import normalizeOptions from './normalizeOptions';

export default function twoD(dim1, dim2, molecule, options) {
    options = Object.assign({}, {keepMolecule: true}, options);
    [molecule, options] = normalizeOptions(molecule, options);
   
    let mol = molecule.molecule;
    var fromAtomLabel = '';
    var toAtomLabel = '';
    if (dim1 && dim1.length > 0) {
        fromAtomLabel = dim1[0].atomLabel;
    }
    if (dim2 && dim2.length > 0) {
        toAtomLabel = dim2[0].atomLabel;
    }

    options = Object.assign({minLength: 1, maxLength: 3}, options, {fromLabel: fromAtomLabel, toLabel: toAtomLabel});

    var paths = mol.getAllPaths(options);
    var inverseMap = {};
    if (fromAtomLabel === 'C' || toAtomLabel === 'C') {
        mol.removeExplicitHydrogens();
        var diaIDsC = mol.getGroupedDiastereotopicAtomIDs({atomLabel: 'C'});
        diaIDsC.forEach(diaID => {
            inverseMap[diaID.atoms.join(',')] = diaID.oclID;
        });
    }

    paths.forEach(path => {
        if (path.fromLabel === 'C') {
            path.fromDiaID = inverseMap[path.fromAtoms.join(',')];
        }
        if (path.toLabel === 'C') {
            path.toDiaID = inverseMap[path.toAtoms.join(',')];
        }
    });

    var idMap1 = {};
    dim1.forEach(prediction => idMap1[prediction.diaIDs[0]] = prediction);

    var idMap2 = {};
    dim2.forEach(prediction => idMap2[prediction.diaIDs[0]] = prediction);

    paths.forEach(element => {
        element.fromChemicalShift = idMap1[element.fromDiaID].delta;
        element.toChemicalShift = idMap2[element.toDiaID].delta;
        element.fromAtomLabel = fromAtomLabel;
        element.toAtomLabel = toAtomLabel;
        //@TODO Add the coupling constants in any case!!!!!!
        element.j = getCouplingConstant(idMap1, element.fromDiaID, element.toDiaID);
    });

    return paths;
}

function getCouplingConstant(idMap, fromDiaID, toDiaID) {
    const j = idMap[fromDiaID].j;
    if (j) {
        var index = j.length - 1;
        while (index-- > 0) {
            if (j[index].diaID === toDiaID) {
                return j[index].coupling;
            }
        }
    }
    return 0;
}
