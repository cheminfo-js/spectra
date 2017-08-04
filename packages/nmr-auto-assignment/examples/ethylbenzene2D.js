/**
 * Created by acastillo on 5/7/16.
 */
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

function loadFile(filename){
    return FS.readFileSync(__dirname + filename).toString();
}


var molfile = loadFile("/../../../data-test/ethylbenzene/mol_0.mol");
var molecule = OCLE.Molecule.fromMolfile(molfile);
molecule.addImplicitHydrogens();
//if(molecule instanceof Molecule)
var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/,"$1")*1;
var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
for (var j=0; j<diaIDs.length; j++) {
    diaIDs[j].nbEquivalent=diaIDs[j].atoms.length;
}
//console.log(diaIDs);
diaIDs.sort(function(a,b) {
    if (a.atomLabel==b.atomLabel) {
        return b.nbEquivalent-a.nbEquivalent;
    }
    return a.atomLabel<b.atomLabel?1:-1;
});

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

var infoCOSY = molecule.getAllPaths({fromLabel: "H", toLabel: "H", minLength: 0, maxLength: 3});

//console.log(cosyZones);

var result = autoassigner({molecule: molecule, diaIDs:diaIDs,
        spectra:{h1PeakList: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")}},
    {cosySignals: cosyZones, cosyPaths: infoCOSY, minScore: 1 ,maxSolutions: 3000, errorCS:  0, predictor: predictor, condensed: true, OCLE: OCLE}
);
console.log(result.length);

var result = autoassigner({molecule: molecule, diaIDs:diaIDs,
        spectra:{h1PeakList: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")}},
    {minScore: 1 ,maxSolutions: 3000, errorCS:  0, predictor: predictor, condensed: true, OCLE: OCLE}
);
//console.log(JSON.stringify(peakPicking));
//console.log(JSON.stringify(result));
console.log(result.length);