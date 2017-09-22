# nmr-auto-assignment

Pure JavaScript NMR automatic assignment. Detail of the algorithm are described in the paper: 
[Fully automatic assignment of small molecules' NMR spectra without relying on chemical shift predictions]
(http://onlinelibrary.wiley.com/doi/10.1002/mrc.4272/abstract)

This program can use as input the list of peaks given by the automatic peak picking routines from the spectra-data project: [spectra-data](https://github.com/cheminfo-js/spectra)

#Example

```
'use strict';

const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require("openchemlib-extended-minimal");
const autoassigner = require('../src/index');
const predictor = require("nmr-predictor");

function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(__dirname + filename).toString()
    );
    return spectrum;
};

function createSpectraData2D(filename, label, data) {
    var spectrum = SD.NMR2D.fromJcamp(
        FS.readFileSync(__dirname + filename).toString()
    );
    return spectrum;
};

var molecule = OCLE.Molecule.fromSmiles("CCc1ccccc1");
molecule.addImplicitHydrogens();
var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/,"$1")*1;

const db = JSON.parse(loadFile("/../src/h1_database.json"));
predictor.setDb(db, 'proton', 'proton');

var spectrum = createSpectraData("/../../../data-test/ethylbenzene/h1_0.jdx");
var cosy = createSpectraData2D("/../../../data-test/ethylbenzene/cosy_0.jdx");

var peakPicking = spectrum.getRanges({
    "nH": nH,
    realTop: true,
    thresholdFactor: 1,
    clean: true,
    compile: true,
    idPrefix: "1H",
    format:"new"
});

var cosyZones = cosy.getZones({thresholdFactor:1.5});
//The input structure should fit the ELN JSON format.

var result = autoassigner({general: {molfile: molecule.toMolfileV3()},
        spectra: {nmr: [{nucleus: "H", experiment: "1d", range: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")},
                       {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}]}},
    {minScore: 0.8, maxSolutions: 3000, errorCS: 1, predictor: predictor, condensed: true, OCLE: OCLE}
);

console.log(result.getAssignments().length);
console.log(result.getAssignments()[0]);
console.log(result.getAssignments()[1]);
result.setAssignmentOnRanges(peakPicking, 0);

```