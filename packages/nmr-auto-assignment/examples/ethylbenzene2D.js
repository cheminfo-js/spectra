const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require("openchemlib-extended-minimal");
const autoassigner = require('../src/index');
const predictor = require('../../nmr-predictor/src/index');

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

function loadFile(filename) {
    return FS.readFileSync(__dirname + filename).toString();
}
async function start() {
    var molecule = OCLE.Molecule.fromSmiles("CCc1ccccc1");
    molecule.addImplicitHydrogens();
//if(molecule instanceof Molecule)
    var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, "$1") * 1;
    await predictor.fetchProton();
    var spectrum = createSpectraData("/../../../data-test/ethylbenzene/h1_0.jdx");
    var cosy = createSpectraData2D("/../../../data-test/ethylbenzene/cosy_0.jdx");

    var peakPicking = spectrum.getRanges({
        "nH": nH,
        realTop: true,
        thresholdFactor: 1,
        clean: 0.5,
        compile: true,
        idPrefix: "1H",
        format: "new"
    });

    var cosyZones = cosy.getZones({thresholdFactor: 1.5});

//console.log(JSON.stringify(peakPicking));

//The input structure should fit the ELN JSON format.
    /*
     var result = autoassigner({general: {molfile: molecule.toMolfileV3()},
     spectra: {nmr: [{nucleus: "H", experiment: "1d", range: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")},
     {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}]}},
     {minScore: 0.8, maxSolutions: 3000, errorCS: 0, predictor: predictor, condensed: true, OCLE: OCLE}
     );
     /*
     console.log(result.getAssignments().length);
     console.log(result.getAssignments()[0]);
     console.log(result.getAssignments()[1]);

     result.setAssignmentOnRanges(peakPicking, 0);
     //console.log(JSON.stringify(peakPicking));

     var result = autoassigner({general: {molfile: molecule.toMolfileV3()},
     spectra: {nmr: [{nucleus: "H", experiment: "1d", range: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")},
     {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}]}},
     {minScore: 0.9, maxSolutions: 3000, errorCS: 0, predictor: predictor, condensed: true, OCLE: OCLE}
     ).getAssignments();
     console.log(result.length);
     console.log(result[0]);
     console.log(result[result.length-1]);
     */
    console.log('start assignment');
    var result = autoassigner({
            general: {molfile: molecule.toMolfileV3()},
            spectra: {
                nmr: [{
                    nucleus: "H",
                    experiment: "1d",
                    range: peakPicking,
                    solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")
                }]
            }
        },
        {
            minScore: 1,
            maxSolutions: 3000,
            errorCS: 0,
            predictor: predictor,
            condensed: true,
            OCLE: OCLE,
            levels: [5, 4, 3]
        }
    );
    console.log(result.getAssignments())
}
start();