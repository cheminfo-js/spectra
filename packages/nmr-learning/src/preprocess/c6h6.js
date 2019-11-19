import FS from 'fs';

const logger = require('../logger');

function loadFile(filename) {
  return FS.readFileSync(filename).toString();
}

export function load(path, datasetName, options) {
  let OCLE = options.OCLE;

  let result = [];
  let k = 0;
  let rows = JSON.parse(loadFile(path)).rows;
  logger(rows.length);
  for (let p = 0; p < rows.length; p++) {
    let row = rows[p];
    if (p % 500 === 0) {
      logger(p);
    }
    if (row.value.nucleus === '1H') {
      try {
        let molecule = OCLE.Molecule.fromIDCode(row.value.idCode);
        // logger(p + " " +molecule.getIDCode());
        // let ocl = {value: molecule};

        molecule.addImplicitHydrogens();
        let nH =
          molecule
            .getMolecularFormula()
            .formula.replace(/.*H([0-9]+).*/, '$1') * 1;
        let diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
        diaIDs.sort(function(a, b) {
          if (a.atomLabel === b.atomLabel) {
            return b.counter - a.counter;
          }
          return a.atomLabel < b.atomLabel ? 1 : -1;
        });

        const linksOH = molecule.getAllPaths({
          fromLabel: 'H',
          toLabel: 'O',
          minLength: 1,
          maxLength: 1,
        });
        const linksNH = molecule.getAllPaths({
          fromLabel: 'H',
          toLabel: 'N',
          minLength: 1,
          maxLength: 1,
        });
        const linksClH = molecule.getAllPaths({
          fromLabel: 'H',
          toLabel: 'Cl',
          minLength: 1,
          maxLength: 1,
        });
        const atoms = {};
        const levels = [6, 5, 4, 3];
        let hasLabile = false;
        for (const diaId of diaIDs) {
          delete diaId._highlight;
          diaId.hose = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
            maxSphereSize: levels[0],
            type: 0,
          });

          for (const atomID of diaId.atoms) {
            atoms[atomID] = diaId.oclID;
          }

          diaId.isLabile = false;

          for (const linkOH of linksOH) {
            if (diaId.oclID === linkOH.fromDiaID) {
              diaId.isLabile = true;
              break;
            }
          }
          for (const linkNH of linksNH) {
            if (diaId.oclID === linkNH.fromDiaID) {
              diaId.isLabile = true;
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

        let signals = row.value.range;
        for (let j = signals.length - 1; j >= 0; j--) {
          if (signals[j].from < 0 || signals[j].from > 16) {
            signals.splice(j, 1);
          }
        }

        signals.forEach((range, index) => {
          range.signalID = `1H_${index}`;
        });

        let sample = {
          general: {
            ocl: {
              id: molecule.getIDCode(),
              atom: atoms,
              diaId: diaIDs,
              nH: nH,
              hasLabile,
            },
          }, // : molecule.toMolfile()},
          spectra: {
            nmr: [
              {
                nucleus: 'H',
                experiment: '1d',
                range: signals,
                solvent: row.value.solvent,
              },
            ],
          },
        };

        result.push(sample);

        if (result.length === 1000) {
          FS.writeFileSync(
            `${__dirname}/big${k++}.json`,
            JSON.stringify(result),
          );
          result = [];
        }
      } catch (e) {
        logger(`Could not load this molecule: ${row.value.idCode}`);
      }
    }
  }
  if (result.length > 0) {
    FS.writeFileSync(`${__dirname}/big${k}.json`, JSON.stringify(result));
  }

  return result;
}
