/**
 * Created by acastillo on 5/7/16.
 */

const FS = require('fs');
const OCLE = require('openchemlib-extended-minimal');
const autoassigner = require('../src/index');
const predictor = require('../../nmr-predictor/src/index');
const SD = require('spectra-data');

require('should');

function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(__dirname + filename).toString()
    );
    return spectrum;
};

function loadFile(filename) {
    return FS.readFileSync(__dirname + filename).toString();
}

describe('Auto-assignment 109-92-2', function () {
    var spectrum = createSpectraData("/examples/109-92-2.jdx");

    var molecule = OCLE.Molecule.fromMolfile(loadFile('/examples/109-92-2.mol'));
    molecule.addImplicitHydrogens();
    var molfile = molecule.toMolfile();
    var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, '$1') * 1;
    var peakPicking = spectrum.getRanges({
        "nH": nH,
        realTop: true,
        thresholdFactor: 1,
        clean: 0.5,
        compile: true,
        format: "new"
    });
        

    peakPicking.forEach((range, index)=> {
        range.signalID = "1H_" + index;
    })

    //console.log("jhere");

    const db = JSON.parse(loadFile('/../../nmr-predictor/data/h1.json'));
    predictor.setDb(db, 'proton', 'proton');

    it('condensed for 109-92-2 from molfile', async function () {
        const result = await autoassigner({
            general: {molfile: molecule.toMolfileV3()},
            spectra: {
                nmr: [{
                    nucleus: 'H',
                    experiment: '1d',
                    range: peakPicking,
                    solvent: 'unknown'
                }]
            }
        },
        {
            minScore: 0.9,
            maxSolutions: 3000,
            errorCS: 1,
            predictor: predictor,
            condensed: true,
            OCLE: OCLE,
            levels: [5, 4, 3, 2]
        }
        );//.getAssignments();
        /*console.log(result.setAssignmentOnRanges(peakPicking, 0));
        console.log(JSON.stringify(peakPicking));
        console.log(result.setAssignmentOnRanges(peakPicking, 1));
        console.log(JSON.stringify(peakPicking));
        console.log(JSON.stringify(result.getAssignments()));*/
        result.getAssignments().length.should.equal(6);

        //console.log(result.getAssignments()[0].score == result.getAssignments()[1].score)
       // result.getAssignments()[0].score.should.equal(1);
    });
});
