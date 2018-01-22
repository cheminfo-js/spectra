import numSort from 'num-sort';

export default function queryByHose(molecule, db, options) {
    const {
        atomLabel = 'H',
        use = null,
        algorithm = 0,
        levels = [5, 4, 3, 2]
    } = options;

    levels.sort(_numSort2.default.desc);
    const diaIds = molecule.diaId;
    const atoms = molecule.atom;
    const atomNumbers = Object.keys(atoms);

    const toReturn = [];
    for (const element of diaIds) {
        if (element.atomLabel === options.atomLabel && (!element.isLabile || !options.ignoreLabile)) {
            let res;
            let k = 0;
            //console.log(element.hose)
            while (!res && k < levels.length) {
                if (db[levels[k]]) {
                    res = db[levels[k] - 1][element.hose[levels[k] - 1]];//atom['hose' + levels[k]]];
                }
                k++;
            }
            if (!res) {
                res = { cs: null, ncs: 0, std: 0, min: 0, max: 0 };
                k = 0;
            }

            for (const atomNumber of element.atoms) {
                //console.log(element)
                let atom = {diaIDs: [element.oclID]};
                atom.atomLabel = atomLabel;
                atom.level = levels[k - 1];
                if (use === 'median') {
                    atom.delta = res.median;
                } else if (use === 'mean') {
                    atom.delta = res.mean;
                }
                //atom.integral = 1;
                atom.atomIDs = [atomNumber];
                atom.ncs = res.ncs;
                atom.std = res.std;
                atom.min = res.min;
                atom.max = res.max;
                atom.nbAtoms = 1;
                toReturn.push(atom);
            }
        }
        
    }

    return toReturn;

}
