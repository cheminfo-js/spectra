/**
 * Created by acastillo on 5/7/16.
 */
'use strict';

const SD = require('spectra-data');
const FS = require('fs');
const OCLE = require("openchemlib-extended");
const autoassigner = require('../src/index');
const predictor = require("nmr-predictor");


function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(__dirname + filename).toString()
    );
    return spectrum;
};

function loadFile(filename){
    return FS.readFileSync(__dirname + filename).toString();
}


describe('Auto-assignment ethylbenzene', function () {
    var molfile = loadFile("/../../../data-test/ethylbenzene/mol_0.mol");
    var molecule = OCLE.Molecule.fromMolfile(molfile);
    molecule.addImplicitHydrogens();
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
    predictor.dataBases = {'proton': db};

    var spectrum = createSpectraData("/../../../data-test/ethylbenzene/z1h_0.jdx");
    var peakPicking = spectrum.nmrPeakDetection({
        "nH": nH,
        realTop: true,
        thresholdFactor: 1,
        clean: true,
        compile: true,
        idPrefix: "1H",
        format:"new"
    });

    it('Known patterns for ethylbenzene', function () {
        var result = autoassigner({molecule:molecule, diaIDs:diaIDs,
            spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
            {predictor:predictor}
        );
        //console.log(JSON.stringify(result));
    });

    it('condensed for ethylbenzene', function () {
        var result = autoassigner({molecule:molecule, diaIDs:diaIDs,
                spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
                {minScore:1 ,maxSolutions:3000, errorCS:-1 , predictor: predictor, condensed:true}
        );
        //console.log(JSON.stringify(result));
    });

    it('condensed for ethylbenzene from molfile', function () {
        var result = autoassigner({molfile: molfile,
                spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
            {minScore:1 ,maxSolutions:1, errorCS:1 , predictor: predictor, condensed:true}
        );
        //console.log(JSON.stringify(result));
    });
});