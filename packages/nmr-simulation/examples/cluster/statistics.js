const FS = require('fs');
const sm = require('../..');
const stat = require('ml-stat/array');

//const OCLE = require('openchemlib-extended');

function loadFile(filename) {
  return FS.readFileSync(filename).toString();
}


var options = {
  frequency: 400.082470657773,
  from: 0,
  to: 10,
  lineWidth: 1.25,
  maxClusterSize: 6,
}

var filter = { filter: '.json' };
var path = `${__dirname}/spinus/`;
var spinus = FS.readdirSync(path).filter((line) => {
  return line.indexOf(filter.filter) > 0;
});


console.log("n molecules " + spinus.length)
let maxSize = 15;
let histogram = [];
for(let i = 0; i <= maxSize; i++) {
  histogram[i] = [];
}
for (var p = 0; p < spinus.length; p++) {
  let prediction = JSON.parse(loadFile(path + spinus[p]));
  const spinSystem = sm.SpinSystem.fromPrediction(prediction);    //console.log(spinSystem);
  let betas = spinSystem._calculateBetas(spinSystem.couplingConstants, options.frequency);
  for (let size = 7; size <= maxSize; size++) {
    options.maxClusterSize = size;
    spinSystem.ensureClusterSize(options);
    let clusters = spinSystem.clusters;
    clusters.forEach(value => {
      if (value.length <= size) {
        for (let i = 0; i < value.length; i++) {
          if(value[i] < 0) {
            histogram[value.length].push(maxBeta(value, betas));
            break;
          }
        }
      }
      else {
        console.log("X " + value.length);
      }
    });
  }
}
for(let i = 0; i <= maxSize; i++) {
  histogram[i] = getStats(histogram[i]);
  console.log(histogram[i]);
}

function maxBeta(value, betas) {
  let max = 0;
  for (let i = 0; i < value.length; i++ ) {
    for (let j = i + 1; j < value.length; j++) {
      if(value[i] >= 0) {
        if(value[j] < 0 ) {
          max = Math.max(max, beta = 1-betas[value[i]][-value[j] - 1]);
        }
      } else {
        if(value[j] >= 0 ) {
          max = Math.max( max, beta = 1-betas[-value[i] - 1][value[j]]);
        }
      }
    }
  } 
  return max;
}

function getStats(entry) {
  const minMax = stat.minMax(entry);
  return {
    min: minMax.min,
    max: minMax.max,
    n: entry.length,
    mean: stat.mean(entry),
    median: stat.median(entry),
    std: stat.standardDeviation(entry, false)
  };
}
