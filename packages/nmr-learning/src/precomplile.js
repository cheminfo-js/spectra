const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor-dev');
const Parallel = require('paralleljs');

const autoassigner = require('../../nmr-auto-assignment/src/index');

const cheminfo = require('./preprocess/cheminfo');
const maybridge = require('./preprocess/maybridge');
const home = require('./preprocess/home');
const c6h6 = require('./preprocess/c6h6');
const compilePredictionTable = require('./compilePredictionTable');
const stats = require('./stats');

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}
const maxIterations = 5; // Set the number of interations for training
const ignoreLabile = true;// Set the use of labile protons during training
const learningRatio = 0.8; // A number between 0 and 1
var iteration = 0;


async function start() {
  // var testSet = JSON.parse(loadFile('/../data/assigned298.json'));//File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  // var dataset1 = cheminfo.load('/home/acastillo/Documents/data/cheminfo443/', 'cheminfo', {keepMolecule: true, OCLE: OCLE});
  // var dataset2 = maybridge.load('/home/acastillo/Documents/data/maybridge/', 'maybridge', {keepMolecule: true, OCLE: OCLE});
  // var dataset3 = c6h6.load("/home/acastillo/Documents/data/output.json", "c6h6", {keepMolecule: true, OCLE: OCLE});
  var dataset4 = home.load('/home/acastillo/Documents/DataSet/', 'home', { keepMolecule: true, OCLE: OCLE });


  // FS.writeFileSync('/home/acastillo/Documents/data/procjson/cheminfo443_y.json', JSON.stringify(dataset1));
  // FS.writeFileSync('/home/acastillo/Documents/data/procjson/maybridge_y.json', JSON.stringify(dataset2));
  FS.writeFileSync('/home/acastillo/Documents/data/procjson/home_y.json', JSON.stringify(dataset4));
}

start();
