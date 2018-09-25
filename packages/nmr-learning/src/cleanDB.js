const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');
const stats = require('./stats');


function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

async function start() {
  let setup = {ignoreLabile: true, levels: [5,4,3] };

  var testSet = JSON.parse(loadFile('/../data/assigned298.json'));// File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  var fastDB = JSON.parse(loadFile('/../data/h_44.json'));

  var convergence = false;
  try {
    //for (let level of setup.levels) {
      predictor.setDb(fastDB, 'proton', 'proton');
      var error = getPerformance(testSet, fastDB, {ignoreLabile: true, levels: [6,5,4,3]});
    //}
  } catch(e) {
    console.log("A problem " + e)
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
      OCLE: OCLE
  });

  date = new Date();

  console.log(`Error: ${error.error} count: ${error.count} min: ${error.min} max: ${error.max}`);

  var data = error.hist;
  var sumHist = 0;
  for (let k = 0; k < data.length; k++) {
      sumHist += data[k].y / error.count;
      if (sumHist > 0) {
          sumHist *= 1;
      }
      console.log(`${data[k].x},${data[k].y},${data[k].y / error.count},${sumHist}`);
  }

  console.log(`Time comparing ${date.getTime() - start}`);

  return error;
}