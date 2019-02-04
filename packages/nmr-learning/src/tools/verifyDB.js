const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');

const stats = require('../stats');
const logger = require('../logger');


function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

function loadFile2(filename) {
  return FS.readFileSync(filename).toString();
}

async function start() {
  var testSet = JSON.parse(loadFile('/../../data/assigned298.json'));// File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  let fastDB = JSON.parse(loadFile('../../../nmr-predictor/data/nmrshiftdb2-1h.json'));
  
  // var fastDB = JSON.parse(loadFile2('/home/acastillo/Documents/workspaces/cheminfo/nemo2/data/prediction/h1.json'));
  // fastDB.splice(0, 1);
  
  // var fastDB = JSON.parse(loadFile2('/home/acastillo/Documents/data/data/h_clean.json'));/////'/../../data/h_clean.json'));

  logger(`${fastDB.length} ${Object.keys(fastDB[0]).length} ${Object.keys(fastDB[1]).length} ${Object.keys(fastDB[2]).length
  } ${Object.keys(fastDB[3]).length} ${Object.keys(fastDB[4]).length}`);//  + " " + Object.keys(fastDB[5]).length);

  // logger(fastDB[3]);
  let setup = { ignoreLabile: true, levels: [5, 4, 3, 2] };

  // FS.writeFileSync(`${__dirname}/../../data/h_28x.json`, JSON.stringify(fastDB));

  try {
    predictor.setDb(fastDB, 'proton', 'proton');
    getPerformance(testSet, fastDB, { ignoreLabile: true, levels: setup.levels });
    /* var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: setup.levels });
    for (let level of setup.levels) {
      logger("Level. " + level);
      var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: [level] });
    }*/
  } catch (e) {
    logger(`A problem ${e}`);
  }
}

start();

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
    OCLE: OCLE,
    hose: false
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
