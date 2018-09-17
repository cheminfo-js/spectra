
const FS = require('fs');

const OCLE = require('openchemlib-extended-minimal');
const predictor = require('nmr-predictor');

const autoassigner = require('../../nmr-auto-assignment/src/index');

// const cheminfo = require('./preprocess/cheminfo');
// const maybridge = require('./preprocess/maybridge');
const compilePredictionTable = require('./compilePredictionTable');
const stats = require('./stats');

function loadFile(filename) {
  return FS.readFileSync(__dirname + filename).toString();
}

const prior = JSON.parse(loadFile('/../data/histogram_0_15ppm.json'));

async function start() {
  var maxIterations = 15; // Set the number of interations for training
  var ignoreLabile = true; // Set the use of labile protons during training
  var learningRatio = 0.8; // A number between 0 and 1
  const levels = [5, 4, 3];

  var testSet = JSON.parse(loadFile('/../data/assigned298.json')); // File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  // var dataset1 = JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/big4.json').toString());//JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/cheminfo443_y.json').toString());
  var dataset1 = JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/cheminfo443_y.json').toString());
  var dataset2 = JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/maybridge_y.json').toString());
  var dataset3 = []; // JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/big0.json').toString());

  // dataset3.splice(0, 500)

  var datasets = [dataset1, dataset2, dataset3];

  var start, date;
  var prevError = 0;
  var prevCont = 0;
  var dataset, max, ds, i, j, k, nAtoms;
  var result, solutions;
  // var fastDB = [];
  var fastDB = JSON.parse(loadFile('/../data/h_13.json'));
  console.log(`Cheminfo All: ${dataset1.length}`);
  console.log(`MayBridge All: ${dataset2.length}`);
  console.log(`Other All: ${dataset3.length}`);

  // Remove the overlap molecules from train and test
  var removed = 0;
  var trainDataset = [];
  for (i = 0; i < testSet.length; i++) {
    for (ds = 0; ds < datasets.length; ds++) {
      dataset = datasets[ds];
      for (j = dataset.length - 1; j >= 0; j--) {
        if (dataset[j].general.ocl.hasLabile || testSet[i].diaID === dataset[j].general.ocl.id) {
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

  console.log(`Cheminfo Final: ${dataset1.length}`);
  console.log(`MayBridge Final: ${dataset2.length}`);
  console.log(`Other Final: ${dataset3.length}`);
  console.log(`Overlaped molecules: ${removed}.  They were removed from training datasets`);

  // Run the learning process. After each iteration the system has seen every single molecule once
  // We have to use another stop criteria like convergence
  var iteration = 14;
  maxIterations = 20;
  var convergence = false;
  try {
    while (iteration < maxIterations && !convergence) {
      date = new Date();
      start = date.getTime();
      var count = 0;
      dataset = trainDataset; // datasets[ds];
      max = dataset.length;
      predictor.setDb(fastDB, 'proton', 'proton');
      // we could now loop on the sdf to add the int index
      for (i = 0; i < max; i++) {
        // console.log(dataset[i]);
        // try {
        result = await autoassigner(dataset[i], {
          minScore: 1,
          unassigned: 1,
          maxSolutions: 2500,
          timeout: 2000,
          errorCS: -0.01,
          predictor: predictor,
          condensed: true,
          OCLE: OCLE,
          levels: [5],
          use: 'median',
          ignoreLabile: ignoreLabile,
          learningRatio: learningRatio,
          iteration: iteration
        });
        solutions = result.getAssignments();
        if (result.timeoutTerminated || result.nSolutions > solutions.length) {
          console.log(`${i} Too much solutions`);
          continue;
        }
        // Get the unique assigments in the assignment variable.
        // if(solutions.length > 0)
        //    console.log(solutions.length)
        let solution = null;
        if (solutions !== null && solutions.length > 0) {
          solution = solutions[0];
          let assignment = solution.assignment;
          if (solutions.length > 1) {
            nAtoms = assignment.length;
            for (j = 0; j < nAtoms; j++) {
              let signalId = assignment[j];
              if (signalId !== '*') {
                for (k = 1; k < solutions.length; k++) {
                  if (signalId !== solutions[k].assignment[j]) {
                    assignment[j] = '*';
                    break;
                  }
                }
              }
            }
          }
        }
        // Only save the last state
        result.setAssignmentOnSample(dataset[i], solution);
        // console.log(JSON.stringify(dataset[i].spectra.nmr[0]))
      }

      // Create the fast prediction table. It contains the prediction at last iteration
      // Becasuse that, the iteration parameter has not effect on the stats
      fastDB = compilePredictionTable(dataset, { iteration, OCLE }).H;
      predictor.setDb(fastDB, 'proton', 'proton');

      FS.writeFileSync(`${__dirname}/../data/h_${iteration}.json`, JSON.stringify(fastDB));

      console.log(`${Object.keys(fastDB[1]).length} ${Object.keys(fastDB[2]).length} ${Object.keys(fastDB[3]).length} ${Object.keys(fastDB[4]).length} ${Object.keys(fastDB[5]).length}`);

      // predictor.setDb(fastDB, 'proton', 'proton');
      // console.log(JSON.stringify(fastDB));
      date = new Date();
      // Evalueate the error

      console.log(`Iteration ${iteration}`);
      console.log(`Time ${date.getTime() - start}`);
      console.log(`New entries in the db: ${count}`);

      start = date.getTime();
      // var error = comparePredictors(datasetSim,{"db":db,"dataset":testSet,"iteration":"="+iteration});
      var histParams = { from: 0, to: 1, nBins: 30 };
      var error = await stats.cmp2asg(testSet, predictor, {
        db: fastDB,
        dataset: testSet,
        ignoreLabile: ignoreLabile,
        histParams: histParams,
        levels: [5, 4, 3, 2],
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

      if (prevCont === count && prevError <= error) {
        // convergence = true;
      }
      prevCont = count;
      prevError = error;

      iteration++;
    }
  } catch (e) {
    console.log(e);
  }
  console.log('Done');
}

start();
