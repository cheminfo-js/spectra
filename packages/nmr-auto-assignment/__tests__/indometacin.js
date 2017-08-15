/**
 * Created by acastillo on 5/7/16.
 */
/*'use strict';

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


describe('Auto-assignment indometacin', function () {
    var molfile = loadFile("/../../../data-test/indometacin/structure.mol");
    var molecule = OCLE.Molecule.fromMolfile(molfile);
    molecule.addImplicitHydrogens();*/
//    var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/,"$1")*1;
 /*   var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
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

    var spectrum = createSpectraData("/../../../data-test/indometacin/1h.dx");

    spectrum.fillWith(2.48,2.52,0);//Solvent
    spectrum.fillWith(3.28,3.36,0);//Water in solvent
    var peakPicking = spectrum.nmrPeakDetection({
        "nH": nH,
        realTop: true,
        thresholdFactor: 1,
        clean: true,
        compile: true,
        idPrefix: "1H",
        format:"new"
    });

    it('Known patterns for indometacin', function () {
        var result = autoassigner({molecule:molecule, diaIDs:diaIDs,
            spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
            {minScore: 0.8, maxSolutions:3000, errorCS: 5, predictor: predictor, condensed:true}
        );
        //console.log(JSON.stringify(result.length));
    });

    it('condensed for indometacin', function () {
        var result = autoassigner({molecule:molecule, diaIDs:diaIDs,
                spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
                {minScore:1 ,maxSolutions:3000, errorCS: 0 , predictor: predictor, condensed:true}
        );
        //console.log(JSON.stringify(result));
    });

    it('condensed for indometacin from molfile', function () {
        var result = autoassigner({molfile: molfile,
                spectra:{h1PeakList:peakPicking, solvent:spectrum.getParamString(".SOLVENT NAME", "unknown")}},
            {minScore:1 ,maxSolutions:3000, errorCS:0 , predictor: predictor, condensed:true}
        );
        result.length.should.greaterThan(1);
        //console.log(JSON.stringify(result));
    });
});*/