'use strict';

const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require("openchemlib-extended-minimal");
const autoassigner = require('../../nmr-auto-assignment/src/index');
const predictor = require("nmr-predictor");
const cheminfo = require("./preprocess/cheminfo");
const maybridge = require("./preprocess/maybridge");
const compilePredictionTable = require("./compilePredictionTable");
const stats = require("./stats");

function loadFile(filename) {
    return FS.readFileSync(__dirname + filename).toString();
}

function start() {
    var maxIterations = 10; // Set the number of interations for training
    var ignoreLabile = false;//Set the use of labile protons during training
    var learningRatio = 0.6; //A number between 0 and 1

    var testSet = JSON.parse(loadFile("/../data/assigned298.json"));//File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
    //console.log(JSON.stringify(testSet[0]));
    var dataset1 = cheminfo.load("/home/acastillo/Documents/data/cheminfo443/", "cheminfo", {keepMolecule: true, OCLE: OCLE});
    var dataset2 = [];/*maybridge.load("/home/acastillo/Documents/data/maybridge/", "maybridge", {keepMolecule: true, keepMolfile: true, OCLE: OCLE});*/
    var dataset3 = [];//reiner.load("/data/Reiner", "reiner", {keepMolecule: true, keepMolfile: true});

    var datasets = [dataset1, dataset2, dataset3];
    //var datasetSim = File.parse(testSet);

    var db = {};

    var start, date, prevError = 0, prevCont = 0, dataset, max, ds, i, j, k, l, m;
    var catalogID, datasetName, signals, diaIDsCH, diaID, solvent, nAtoms, asgK, highlight;
    var result, solutions;
    var fastDB = [];
    console.log("Cheminfo All: " + dataset1.length);
    console.log("MayBridge All: " + dataset2.length);
    //Remove the overlap molecules from train and test
    var removed = 0;
    var trainDataset = [];
    for (i = 0; i < testSet.length; i++) {
        for (ds = 0; ds < datasets.length; ds++) {
            dataset = datasets[ds];
            for (j = dataset.length - 1; j >= 0; j--) {
                if (testSet[i].diaID == dataset[j].diaID) {
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
            trainDataset.push(dataset[j]);
        }
    }
    console.log("Cheminfo Final: " + dataset1.length);
    console.log("MayBridge Final: " + dataset2.length);
    console.log("Overlaped molecules: " + removed + ".  They were removed from training datasets");

    //Run the learning process. After each iteration the system has seen every single molecule once
    //We have to use another stop criteria like convergence
    var iteration = 0, convergence = false;
    while (iteration < maxIterations && !convergence) {

        date = new Date();
        start = date.getTime();
        var count = 0;
        dataset = trainDataset;//datasets[ds];
        max = dataset.length;
        // we could now loop on the sdf to add the int index
        for (i = 0; i < max; i++) {
            //console.log(dataset[i]);
            //try {
            predictor.setDb(fastDB, 'proton', 'proton');
            result = autoassigner(dataset[i],
                {
                    minScore: 1,
                    maxSolutions: 3000,
                    errorCS: 0,
                    predictor: predictor,
                    condensed: true,
                    OCLE: OCLE,
                    levels: [5, 4, 3],
                    ignoreLabile: ignoreLabile,
                    learningRatio: learningRatio
                }
            );
            solutions = result.getAssignments();
            if (result.timeoutTerminated || result.nSolutions > solutions.length) {
                console.log("Too much solutions");
                continue;
            }
            //Get the unique assigments in the assignment variable.
            let solution = null;
            if (solutions != null && solutions.length > 0) {
                solution = solutions[0];
                let assignment = solution.assignment;
                if (solutions.length > 1) {
                    nAtoms = assignment.length;
                    for (j = 0; j < nAtoms; j++) {
                        let signalId = assignment[j];
                        if (signalId != "*") {
                            for (k = 1; k < solutions.length; k++) {
                                if (signalId != solutions[k].assignment[j]) {
                                    assignment[j] = "*";
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            //Only save the last state
            result.setAssignmentOnSample(dataset[i], solution);
        }

        //Create the fast prediction table. It contains the prediction at last iteration
        //Becasuse that, the iteration parameter has not effect on the stats
        fastDB = compilePredictionTable(dataset, {iteration, OCLE})["H"];
        console.log(JSON.stringify(fastDB));
        date = new Date();
        //Evalueate the error
        console.log("Iteration " + iteration);
        console.log("Time " + (date.getTime() - start));
        console.log("New entries in the db: " + count);
        start = date.getTime();
        //var error = comparePredictors(datasetSim,{"db":db,"dataset":testSet,"iteration":"="+iteration});
        var histParams = {from: 0, to: 1, nBins: 30};
        var error = stats.cmp2asg(testSet, predictor, {
            "db": fastDB,
            "dataset": testSet,
            "ignoreLabile": ignoreLabile,
            "histParams": histParams,
            "hoseLevels": [5, 4, 3],
            "OCLE": OCLE
        });
        date = new Date();
        console.log("Error: " + error.error + " count: " + error.count + " min: " + error.min + " max: " + error.max);
        var data = error.hist;
        var sumHist = 0
        for (var i = 0; i < data.length; i++) {
            sumHist += data[i].y / error.count;
            console.log(data[i].x + "," + data[i].y + "," + data[i].y / error.count + "," + sumHist);
        }
        console.log("Time comparing " + (date.getTime() - start));

        if (prevCont == count && prevError <= error) {
            //convergence = true;
        }
        prevCont = count;
        prevError = error;

        iteration++;
    }
    console.log("Done");
}

start();