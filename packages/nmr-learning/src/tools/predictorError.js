const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');

const logger = require('../logger');
const dbutils = require('../../../nmr-predictor/scripts/dbutils');

const stats = require('../stats');

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

const setup = {
    iteration0: 23, iterationM: 30, ignoreLabile: true, learningRatio: 0.8,
    levels: [6, 5, 4, 3], dataPath: '/home/acastillo/Documents/data/', minScore: 1,
    errorCS: -0.15, timeout: 2000, maxSolutions: 2500, nUnassigned: 1
  };
  
var data = loadData();
let fastDB = JSON.parse(loadFile('../../../nmr-predictor/data/db-1h.json'));
getPerformance(data, fastDB, setup);


async function getPerformance(testSet, fastDB, setup) {
  let date = new Date();
  let start = date.getTime();
  predictor.setDb(fastDB, 'proton', 'proton');
  // var error = comparePredictors(datasetSim,{"db":db,"dataset":testSet,"iteration":"="+iteration});
  var histParams = { from: 0, to: 1, nBins: 30 };
  var error = await stats.cmp2asg(testSet, predictor, {
    db: fastDB,
    dataset: testSet,
    ignoreLabile: setup.ignoreLabile,
    histParams: histParams,
    levels: setup.levels,
    use: 'median',
    OCLE: OCLE
  });

  date = new Date();

  logger(`Error: ${error.error} count: ${error.count} min: ${error.min} max: ${error.max}`);

  var data = error.hist;
  var sumHist = 0;
  for (let k = 0; k < data.length; k++) {
    sumHist += data[k].y / error.count;
    if (sumHist > 0) {
      sumHist *= 1;
    }
    logger(`${data[k].x},${data[k].y},${data[k].y / error.count},${sumHist}`);
  }

  logger(`Time comparing ${date.getTime() - start}`);

  return error;
}


function loadData() {
  return JSON.parse(loadFile('/../../data/assigned298.json')); // File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
}
