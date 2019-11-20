import FS from 'fs';
import path from 'path';

import OCLE from 'openchemlib-extended';
import predictor from 'nmr-predictor';

// // const autoassigner = require('../../nmr-auto-assignment/src/index');

const logger = require('./logger');

// const cheminfo = require('./preprocess/cheminfo');
// const maybridge = require('./preprocess/maybridge');
// const compilePredictionTable = require('./compilePredictionTable');
// const stats = require('./stats');

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

async function start() {
  let ignoreLabile = true; // Set the use of labile protons during training
  const levels = [6, 5, 4, 3, 2];

  let testSet = JSON.parse(loadFile('/../data/assigned298.json')); // File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  let dataset1 = JSON.parse(
    FS.readFileSync(
      '/home/acastillo/Documents/data/procjson/cheminfo443_y.json',
    ).toString(),
  );
  let dataset2 = JSON.parse(
    FS.readFileSync(
      '/home/acastillo/Documents/data/procjson/maybridge_y.json',
    ).toString(),
  );
  let dataset3 = []; // JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/big0.json').toString());

  // dataset3.splice(0, 500)

  let datasets = [dataset1, dataset2, dataset3];

  let start, date;
  let dataset, max, ds, i, j;
  // var fastDB = [];
  let fastDB = JSON.parse(loadFile('/../data/h_44.json'));
  logger(`Cheminfo All: ${dataset1.length}`);
  logger(`MayBridge All: ${dataset2.length}`);
  logger(`Other All: ${dataset3.length}`);

  // Remove the overlap molecules from train and test
  let removed = 0;
  let trainDataset = [];
  for (i = 0; i < testSet.length; i++) {
    for (ds = 0; ds < datasets.length; ds++) {
      dataset = datasets[ds];
      for (j = dataset.length - 1; j >= 0; j--) {
        if (
          dataset[j].general.ocl.hasLabile ||
          testSet[i].diaID === dataset[j].general.ocl.id
        ) {
          // if (testSet[i].diaID === dataset[j].general.ocl.id) {
          dataset.splice(j, 1);
          removed++;
          break;
        }
      }
    }
  }
  if (start === 0) {
    start += removed;
  }

  for (ds = 0; ds < datasets.length; ds++) {
    dataset = datasets[ds];
    for (j = 0; j < dataset.length; j++) {
      trainDataset.push(dataset[j]);
    }
  }

  logger(`Cheminfo Final: ${dataset1.length}`);
  logger(`MayBridge Final: ${dataset2.length}`);
  logger(`Other Final: ${dataset3.length}`);
  logger(
    `Overlaped molecules: ${removed}.  They were removed from training datasets`,
  );

  // Run the learning process. After each iteration the system has seen every single molecule once
  // We have to use another stop criteria like convergence
  try {
    for (let level of levels) {
      date = new Date();
      start = date.getTime();
      dataset = trainDataset; // datasets[ds];
      max = dataset.length;
      predictor.setDb(fastDB, 'proton', 'proton');
      // we could now loop on the sdf to add the int index
      for (i = 0; i < max; i++) {
        let predictions = await predictor.proton(dataset[i].general.ocl, {
          condensed: true,
          OCLE: OCLE,
          levels: [level],
          hose: true,
          use: 'median',
          ignoreLabile: ignoreLabile,
          keepMolecule: true,
        });
        // logger(i)
        let ranges = dataset[i].spectra.nmr[0].range;
        for (let k = predictions.length - 1; k >= 0; k--) {
          let pred = predictions[k];
          let hose5 = pred.hose[level - 1];
          if (pred.ncs > 4 && fastDB[level - 1][hose5]) {
            let found = false;
            for (let range of ranges) {
              if (
                Math.abs(range.from + range.to - (pred.min + pred.max)) <
                Math.abs(range.from - range.to) + Math.abs(pred.min - pred.max)
              ) {
                if (!fastDB[level - 1][hose5].p) {
                  fastDB[level - 1][hose5].p = 1;
                } else {
                  fastDB[level - 1][hose5].p++;
                }
                found = true;
                break;
              }
            }
            // logger(hose5)
            if (!found) {
              if (!fastDB[level - 1][hose5].n) {
                fastDB[level - 1][hose5].n = 1;
              } else {
                fastDB[level - 1][hose5].n++;
              }
            }
          } else {
            predictions.splice(k, 1);
          }
        }
      }
      let keys = Object.keys(fastDB[level - 1]);
      let deleted = 0;
      for (let key in keys) {
        let confidence = 0;
        if (fastDB[level - 1][key].p) {
          confidence = 1;
          if (fastDB[level - 1][key].n) {
            confidence =
              fastDB[level - 1][key].p /
              (fastDB[level - 1][key].p + fastDB[level - 1][key].n);
          }
        }
        fastDB[level - 1][key].conf = confidence;
        if (confidence > 0 && confidence < 0.8) {
          logger(`${key}:${JSON.stringify(fastDB[level - 1][key])}`);
          delete fastDB[level - 1][key];
          deleted++;
          // logger(fastDB[4][key]);
        }
      }
      logger(`Deleted at ${level}:${deleted}`);
    }
    FS.writeFileSync(
      `${__dirname}/../data/h_clean.json`,
      JSON.stringify(fastDB),
    );
  } catch (e) {
    logger(e);
  }
  logger('Done');
}

start();
