const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require('openchemlib-extended');
const autoassigner = require('../src/index');
const predictor = require('nmr-predictor');

//console.log( process.cwd());
function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(process.cwd() + filename).toString()
    );
    return spectrum;
};

function createSpectraData2D(filename, label, data) {
    var spectrum = SD.NMR2D.fromJcamp(
        FS.readFileSync(process.cwd() + filename).toString()
    );
    return spectrum;
};

function loadFile(filename) {
    return FS.readFileSync(process.cwd() + filename).toString();
}

async function start() {
    //var molecule = OCLE.Molecule.fromSmiles("CCc1ccccc1");
    var molecule = OCLE.Molecule.fromSmiles("C(=C)OCC");
    molecule.addImplicitHydrogens();
    //if(molecule instanceof Molecule)
    var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, "$1") * 1;
    console.log(molecule.getMolecularFormula().formula )
    const db = JSON.parse(loadFile('/packages/nmr-predictor/data/h1.json'));
    //console.log(db)
    predictor.setDb(db, 'proton', 'proton');
    //await predictor.fetchProton();
    var spectrum = createSpectraData("/data-test/ethylvinylether/1h.jdx");
    //var spectrum = createSpectraData("/data-test/ethylbenzene/h1_0.jdx");
    //var cosy = createSpectraData2D("/data-test/ethylbenzene/cosy_0.jdx");

    var peakPicking = spectrum.getRanges({
        "nH": nH,
        realTop: true,
        thresholdFactor: 1,
        clean: 0.5,
        compile: true,
        idPrefix: "1H",
        format: "new"
    });

    peakPicking.forEach((range, index)=> {
        range.signalID = "1H_" + index;
    })

    console.log('start assignment');
    var result = await autoassigner({
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
            minScore: 0.8,
            maxSolutions: 3000,
            errorCS: 1,
            predictor: predictor,
            condensed: true,
            OCLE: OCLE,
            levels: [6, 5, 4, 3, 2]
        }
    );
    console.log(result)
    console.log(result.getAssignments().length)
}
start();