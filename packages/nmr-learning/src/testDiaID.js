
const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require('openchemlib-extended-minimal');
const autoassigner = require('../../nmr-auto-assignment/src/index');
const predictor = require('nmr-predictor');
const cheminfo = require('./preprocess/cheminfo');
//const maybridge = require("./preprocess/maybridge");
const compilePredictionTable = require('./compilePredictionTable');
const stats = require('./stats');

function loadFile(filename) {
    return FS.readFileSync(__dirname + filename).toString();
}

function start() {
    var maxIterations = 10; // Set the number of interations for training
    var ignoreLabile = true;//Set the use of labile protons during training
    var learningRatio = 0.8; //A number between 0 and 1

    var testSet = JSON.parse(loadFile('/../data/assigned298.json'));//File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
    testSet.forEach(row => {
        var molecule = OCLE.Molecule.fromMolfile(row.molfile.replace(/\\n/g, '\n'));
        molecule.addImplicitHydrogens();

        let diaID = molecule.getIDCode();
        if (diaID != row.diaID) {
            console.log(diaID + ' ' + row.diaID);
        }
    });
}

start();
