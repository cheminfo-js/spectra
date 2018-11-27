import numSort from 'num-sort';

export default function queryByHose(molecule, db, options) {
  // const { Util } = getOcleFromOptions(options);
  const {
    atomLabel = 'H',
    use = null,
    levels = [4, 3, 2, 1, 0]
  } = options;

  levels.sort(numSort.desc);

  const diaIds = molecule.diaId;

  const toReturn = [];
  for (const element of diaIds) {
    if (element.atomLabel === options.atomLabel && (!element.isLabile || !options.ignoreLabile)) {
      let res;
      let k = 0;
      while (!res && k < levels.length) {
        if (db[levels[k] - 1]) {
          res = db[levels[k] - 1][element.hose[levels[k] - 1]];// atom['hose' + levels[k]]];
        }
        k++;
      }
      if (!res) {
        res = { cs: null, ncs: 0, std: 0, min: 0, max: 0 };
        k = 0;
      }

      for (const atomNumber of element.atoms) {
        // console.log(element)
        let atom = { diaIDs: [element.oclID] };
        atom.atomLabel = atomLabel;
        atom.level = levels[k - 1];
        if (use === 'median') {
          atom.delta = res.median;
        } else if (use === 'mean') {
          atom.delta = res.mean;
        }
        // atom.integral = 1;
        atom.atomIDs = [atomNumber];
        atom.ncs = res.ncs;
        atom.std = res.std;
        atom.min = res.min;
        atom.max = res.max;
        atom.nbAtoms = 1;

        if (options.hose) {
          atom.hose = element.hose;
        }

        toReturn.push(atom);
      }
    }
  }

  return toReturn;
}
