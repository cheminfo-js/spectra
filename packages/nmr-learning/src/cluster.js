var cluster = require('cluster');
const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');

//const autoassigner = require('../../nmr-auto-assignment/src/index');

// const cheminfo = require('./preprocess/cheminfo');
// const maybridge = require('./preprocess/maybridge');
const compilePredictionTable = require('./compilePredictionTable');
const stats = require('./stats');

function loadFile(filename) {
    return FS.readFileSync(path.join(__dirname, filename)).toString();
}

//const prior = JSON.parse(loadFile('/../data/histogram_0_15ppm.json'));

const looksLike = function (id1, id2, signals, tolerance) {
    if (id1 == id2) {
        return true;
    }
    else {
        if (Math.abs(signals[id1].signal[0].delta - signals[id2].signal[0].delta) < tolerance) {
            return true;
        }
    }
}


if (cluster.isMaster) {

    const setup = {
        iteration0: 45, iterationM: 55, ignoreLabile: true, learningRatio: 0.8,
        levels: [6, 5, 4, 3], dataPath: "/home/acastillo/Documents/data/", minScore: 1,
        errorCS: -0.25, timeout: 2000, maxSolutions: 2500, nUnassigned: 1
    };

    var numWorkers = require('os').cpus().length;

    console.log('Master cluster setting up ' + numWorkers + ' workers...');
    let workers = [];
    for (var i = 0; i < numWorkers; i++) {
        let worker = cluster.fork();
        workers.push(worker);
    }

    cluster.on('message', async function (worker, message, handle) {
        responses.push(message);

        if (responses.length == setup.max) {
            
            let iteration = setup.iteration;
            //Print the black list
            //console.log("Too much solutions in " + blackList.length + " molecules");
            //FS.writeFileSync(`${__dirname}/../data/blackList.json`, JSON.stringify(blackList));

            // Create the fast prediction table. It contains the prediction at last iteration
            // Becasuse that, the iteration parameter has not effect on the stats
            let fastDB = compilePredictionTable(responses, { iteration, OCLE }).H;
            predictor.setDb(fastDB, 'proton', 'proton');

            FS.writeFileSync(`${__dirname}/../data/h_${iteration}.json`, JSON.stringify(fastDB));

            console.log(`${Object.keys(fastDB[1]).length} ${Object.keys(fastDB[2]).length} ${Object.keys(fastDB[3]).length} ${Object.keys(fastDB[4]).length} ${Object.keys(fastDB[5]).length}`);

            date = new Date();
            // Evalueate the error
            console.log(`Iteration ${iteration}`);
            console.log(`Time ${date.getTime() - start}`);

            let error = getPerformance(data.test, fastDB, setup);
            setup.iteration++;
            
            responses = [];
            if (setup.iteration < setup.iterationM) {
                let date = new Date();
                start = date.getTime();
                nextIteration(data.train, fastDB, setup, workers);
            }
        }
    });

    cluster.on('online', function (worker) {
        console.log('Worker ' + worker.process.pid + ' is online');
    });

    cluster.on('exit', function (worker, code, signal) {
        console.log('Starting a new worker');
        cluster.fork();
    });

    // Be notified when worker processes die.
    cluster.on('death', function (worker) {
        console.log('Worker ' + worker.process.pid + ' died.');
    });


    var data = loadData(setup);
    //setup.predictor = predictor;
    //Initial value of db
    let fastDB = JSON.parse(loadFile('/../data/h_clean.json'));
    let date = new Date();
    start = date.getTime();
    var responses = [];
    setup.max = data.train.length;
    setup.iteration = setup.iteration0;
    //Iteration 0
    nextIteration(data.train, fastDB, setup, workers);

}
if (cluster.isWorker) {
    // Receive messages from the master process.
    const autoassigner = require('../../nmr-auto-assignment/src/index');
    const OCLE = require('openchemlib-extended');
    const predictor = require('nmr-predictor');


    process.on('message', async function (msg) {
        let entry = msg.entry;
        let setup = msg.setup;
        predictor.setDb(msg.fastDB, 'proton', 'proton');
        let result = await autoassigner(entry, {
            minScore: setup.minScore,
            unassigned: setup.nUnassigned,
            maxSolutions: setup.maxSolutions,
            timeout: setup.timeout,
            errorCS: setup.errorCS,
            predictor: predictor,
            condensed: true,
            OCLE: OCLE,
            levels: setup.levels,
            use: 'median',
            ignoreLabile: setup.ignoreLabile,
            learningRatio: setup.learningRatio,
            iteration: msg.iteration
        });

        let solutions = result.getAssignments();
        if (result.timeoutTerminated || result.nSolutions > solutions.length) {
            //blackList.push(dataset[i].general.ocl.id);
            console.log(entry.general.ocl.id);
        }
        else {
            // Get the unique assigments in the assignment variable.
            let solution = null;
            if (solutions !== null && solutions.length > 0) {
                let targetsConstains = result.spinSystem.targetsConstains;
                solution = solutions[0];
                let assignment = solution.assignment;
                if (solutions.length > 1) {
                    let nAtoms = assignment.length;
                    for (let j = 0; j < nAtoms; j++) {
                        let signalId = assignment[j];
                        //let csi = dataset[i];
                        if (signalId !== '*') {
                            for (let k = 1; k < solutions.length; k++) {
                                if (!looksLike(signalId, solutions[k].assignment[j], targetsConstains, 0.6)) {
                                    assignment[j] = '*';
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            // Only save the last state
            result.setAssignmentOnSample(entry, solution);
        }

        // Return a a promise to the master
        process.send(entry);
    });
}



async function nextIteration(dataset, fastDB, setup, workers) {
    // Run the learning process. After each iteration the system has seen every single molecule once
    try {
        //console.log(predictor.databases);
        // we could now loop on the sdf to add the int index
        for (let i = 0; i < setup.max; i++) {
            workers[i % workers.length].send({ entry: dataset[i], setup: setup, fastDB: fastDB, iteration: setup.iteration });
        }
    } catch (e) {
        console.log(e);
    }
}

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


function loadData(setup) {

    // var dataset1 = JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/big4.json').toString());//JSON.parse(FS.readFileSync('/home/acastillo/Documents/data/procjson/cheminfo443_y.json').toString());
    var dataset1 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/cheminfo443.json').toString()));
    var dataset2 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/maybridge.json').toString()));
    var dataset3 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/big0.json').toString()));
    var dataset4 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/big1.json').toString()));
    var dataset5 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/big2.json').toString()));
    var dataset6 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/big3.json').toString()));
    var dataset7 = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'procjson/big4.json').toString()));
    var blackList = JSON.parse(FS.readFileSync(path.join(setup.dataPath, 'blackList.json').toString()));

    var testSet = JSON.parse(loadFile('/../data/assigned298.json')); // File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";

    var datasets = [dataset1, dataset2, dataset3, dataset4, dataset5, dataset6, dataset7];

    var i, j, k, ds, dataset;
    console.log(`Cheminfo All: ${dataset1.length}`);
    console.log(`MayBridge All: ${dataset2.length}`);
    console.log(`Other All: ${dataset3.length + dataset4.length}`);

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

    for (ds = 0; ds < datasets.length; ds++) {
        dataset = datasets[ds];
        for (j = 0; j < dataset.length; j++) {
            //Remove also the molecules in the black list
            if (!blackList.includes(dataset[j].general.ocl.id)) {
                trainDataset.push(dataset[j]);
            } else {
                removed++;
            }
        }
    }

    console.log(`Cheminfo Final: ${dataset1.length}`);
    console.log(`MayBridge Final: ${dataset2.length}`);
    console.log(`Other Final: ${dataset3.length + dataset4.length}`);
    console.log(`Total Final: ${trainDataset.length}`);
    console.log(`Overlaped molecules: ${removed}.  They were removed from training datasets`);

    return { train: trainDataset, test: testSet, blackList: blackList };
}