const histogram = require('./histogram');
const logger = require('./logger');


function compare(A, B, hist, options) {
  var error = 0;
  var count = 0;
  var max = 0;
  var min = 9999999;
  var tmp = 0;
  var i, j;
  // console.log(A.length+" "+B.length);

  for (i = A.length - 1; i >= 0; i--) {
    for (j = B.length - 1; j >= 0; j--) {
      if (A[i].diaIDs[0] === B[j].diaIDs[0]) {
        if (typeof A[i].delta !== 'undefined' && typeof B[j].delta !== 'undefined') {
          tmp = Math.abs(A[i].delta - B[j].delta);
          if (options.hose && tmp > 2) {
            // console.log(A[i].level + " " + A[i].delta + " " + B[j].delta + " " + A[i].diaIDs[0] + " " + A[i].hose[A[i].level - 1]);
            logger(`delete fastDB[${A[i].level - 1}][${JSON.stringify(A[i].hose[A[i].level - 1])}]; //${tmp} ${A[i].delta} ${B[j].delta}`);
          }

          hist.push(tmp);
          error += tmp;
          count++;
          if (tmp > max) {
            max = tmp;
          }
          if (tmp < min) {
            min = tmp;
          }
        }
        break;
      }
    }
  }

  if (count !== 0) {
    return { error: error / count, count: count, min: min, max: max };
  }
  return { error: 0, count: 0, min: 0, max: 0 };
}

function addObserved(A, B) {
  var i, j;
  for (i = A.length - 1; i >= 0; i--) {
    A[i].delta2 = null;
    for (j = B.length - 1; j >= 0; j--) {
      if (A[i].diaIDs[0] === B[j].diaIDs[0]) {
        if (typeof A[i].delta !== 'undefined' && typeof B[j].delta !== 'undefined') {
          A[i].delta2 = B[j].delta;
        }
        break;
      }
    }
    if (A[i].delta2 == null) {
      A.splice(i, 1);
    }
  }
  return A;
}
/*
function countByLevel(A, result) {
    var i, j;
    for (i = A.length - 1; i >= 0; i--) {
        result[A[i].level]++;
    }
}*/

function hoseStats(dataSet, nmrShiftDBPred1H, options) {
  // console.log(options);
  // var db = new DB.MySQL("localhost","mynmrshiftdb3","nmrshiftdb","xxswagxx");
  let ACT = options.ACT;
  var molecule, h1pred, i, j;
  var result = [0, 0, 0, 0, 0, 0];
  var db = options.db;
  var predictions = new Array(dataSet.length);
  for (i = 0; i < dataSet.length; i++) {
    if (!dataSet[i].molecule) {
      molecule = ACT.load(dataSet[i].molfile.replace(/\\n/g, '\n'));
      molecule.expandHydrogens();
      dataSet[i].molecule = molecule;
    } else {
      molecule = dataSet[i].molecule;
    }

    h1pred = nmrShiftDBPred1H(molecule, {
      db: db,
      debug: true,
      iterationQuery: options.iterationQuery,
      ignoreLabile: options.ignoreLabile,
      hoseLevels: options.hoseLevels
    });

    for (j = h1pred.length - 1; j >= 0; j--) {
      result[h1pred[j].level]++;
    }

    predictions[i] = addObserved(h1pred, dataSet[i].assignment);
  }
  return { hoseStats: result, predictions: predictions };
}


async function cmp2asg(dataSet, predictor, options) {
  let OCLE = options.OCLE;
  var h1pred, result;
  var avgError = 0;
  var count = 0;
  var min = 9999999;
  var max = 0;
  var molfile = "";
  var hist = [];
  var lng = dataSet.length;
  for (var i = 0; i < lng; i++) {
    if (!dataSet[i].ocl) {
      var molecule = OCLE.Molecule.fromIDCode(dataSet[i].diaID);
      molecule.addImplicitHydrogens();
      //molfile = molecule.toMolfile();
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
        fromLabel: 'Cl',
        toLabel: 'N',
        minLength: 1,
        maxLength: 1
      });
      const atoms = {};
      const levels = options.levels;
      for (const diaId of diaIDs) {
        delete diaId._highlight;
        diaId.hose = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
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
            break;
          }
        }
        for (const linkNH of linksNH) {
          if (diaId.oclID === linkNH.fromDiaID) {
            diaId.isLabile = true;
            break;
          }
        }
        for (const linkCl of linksClH) {
          if (diaId.oclID === linkCl.fromDiaID) {
            diaId.isLabile = true;
            break;
          }
        }
      }
      dataSet[i].ocl = { id: molecule.getIDCode(), atom: atoms, diaId: diaIDs, nH: nH };
    }

    molecule = dataSet[i].ocl;

    //console.log(i)
    h1pred = await predictor.proton(molecule, {
      ignoreLabile: options.ignoreLabile,
      levels: options.levels,
      hose: options.hose
    });


    // console.log(dataSet[i].assignment);
    // console.log(h1pred);
    // console.log(molecule.diaId);
    result = compare(h1pred, dataSet[i].assignment, hist, options);

    // if(result.error > 1)
    //  console.log(result.error + " " + JSON.stringify(h1pred));
    avgError += result.error;
    count += result.count;
    if (result.min < min) {
      min = result.min;
    }
    if (result.max > max) {
      max = result.max;
    }
  }

  var histParams = options.histParams || { from: 0, to: 1, nBins: 100 };
  return {
    error: avgError / dataSet.length, count: count, min: min, max: max, hist: histogram({
      data: hist,
      bins: linspace(histParams.from, histParams.to, histParams.nBins)
    })
  };
}
/*
function comparePredictors(dataSet, nmrShiftDBPred1H, options) {
    //console.log(options);
    //var db = new DB.MySQL("localhost","mynmrshiftdb3","nmrshiftdb","xxswagxx");
    let ACT = options.ACT;
    var other = 'h1';
    var db = options.db;
    var folder = options.dataset;
    var avgError = 0;
    var count = 0;
    var min = 9999999;
    var max = 0;
    var spinus, molecule, diaIDs, h1pred, result;
    var molecules = FS.dir(folder, {filter: '.mol'});//"/Research/NMR/AutoAssign/data/test"
    var firstTime = false;
    if (dataSet.length === 0) {
        firstTime = true;
    }
    for (var i = 0; i < molecules.length; i++) {
        //console.log(firstTime+" "+dataSet.length);
        if (!firstTime) {
            spinus = dataSet[i].spinus;
            molecule = dataSet[i].molecule;
        } else {
            molecule = ACT.load(FS.load(molecules[i]));
            molecule.expandHydrogens();

            if (FS.exists(molecules[i].replace('.mol', '.' + other))) {
                spinus = FS.loadJSON(molecules[i].replace('.mol', '.' + other));
            } else {
                diaIDs = molecule.getDiastereotopicAtomIDs('H');
                spinus = SD.spinusPred1H(molecule.toMolfile(), {diaIDs: diaIDs});
                //console.log('Saving...');
                FS.save(molecules[i].replace('.mol', '.' + other), JSON.stringify(spinus));
            }
            dataSet.push({spinus: spinus, molecule: molecule});
        }

        if (spinus.length > 0) {
            var hist = [];
            h1pred = nmrShiftDBPred1H(molecule, {
                db: db,
                debug: false,
                iterationQuery: options.iterationQuery,
                ignoreLabile: options.ignoreLabile,
                hoseLevels: options.hoseLevels
            });
            result = compare(h1pred, spinus, hist);
            avgError += result.error;
            count += result.count;
            if (result.min < min) {
                min = result.min;
            }
            if (result.max > max) {
                max = result.max;
            }
        }

    }
    var histParams = options.histParams || {from: 0, to: 1, nBins: 100};
    return {
        error: avgError / dataSet.length, count: count, min: min, max: max, hist: histogram({
            data: hist,
            bins: linspace(histParams.from, histParams.to, histParams.nBins)
        })
    };
}*/

function linspace(a, b, n) {
  if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1);
  if (n < 2) {
    return n === 1 ? [a] : [];
  }
  var i;
  var ret = Array(n);
  n--;
  for (i = n; i >= 0; i--) {
    ret[i] = (i * b + (n - i) * a) / n;
  }
  return ret;
}

module.exports = {
  cmp2asg: cmp2asg,
  hoseStats: hoseStats
  // comparePredictors: comparePredictors
};
