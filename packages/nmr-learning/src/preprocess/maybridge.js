'use strict';
const FS = require('fs');
const SD = require('spectra-data');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(filename).toString()
    );
    return spectrum;
};


function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    var keepMolfile = false || options.keepMolfile;
    var keepMolecule = false || options.keepMolecule;
    var filter = {filter: ".txt"};
    if (typeof options.filter === "object") {
        filter = options.filter;
    }

    var parts = FS.readdirSync(path).filter(line => {
        return line.indexOf(filter.filter) > 0;
    });

    var result = [];
    for (var p = 0; p < 1; p++) {
        let fileContent = loadFile(path + parts[p]).split("\n");
        var max = fileContent.length - 1;
        // we could now loop on the sdf to add the int index
        for (var i = 1; i < 10; i++) {
            let row = fileContent[i].split("\t");
            //try {
                //var sdfi = {dataset: datasetName, id: p + "_" + i + "_" + molFiles[i].catalogID};
                var molfile = row[1].replace(/\\n/g, "\n");
                var molecule = OCLE.Molecule.fromMolfile(molfile);
                molecule.addImplicitHydrogens();
                var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, "$1") * 1;
                var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
                diaIDs.sort(function (a, b) {
                    if (a.atomLabel === b.atomLabel) {
                        return b.counter - a.counter;
                    }
                    return a.atomLabel < b.atomLabel ? 1 : -1;
                });

                let ocl = {value: molecule};
                ocl.diaIDs = diaIDs;
                ocl.diaID = molecule.getIDCode();
                ocl.nH = nH;

                console.log(i / max * 100 );
                var spectraData1H = SD.NMR.fromJcamp(row[2].replace(/\\n/g, "\n"));

                var signals = spectraData1H.getRanges(
                    {
                        "nH": nH,
                        realTop: true,
                        thresholdFactor: 1,
                        clean: true,
                        compile: true,
                        idPrefix: "1H",
                        format: "new"
                    }
                );

                for (var j = signals.length - 1; j >= 0; j--) {
                    if (signals[j].delta1 < 0 || signals[j].delta1 > 16) {
                        signals.splice(j, 1);
                    }
                }

                let sample = {
                    general: {ocl: ocl, molfile: molecule.toMolfile()},
                    spectra: {
                        nmr: [{
                            nucleus: "H",
                            experiment: "1d",
                            range: signals,
                            solvent: spectraData1H.getParamString(".SOLVENT NAME", "unknown")
                        }]
                    }
                };
                // {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}

                result.push(sample);
            //}
            //catch (e) {
            //    console.log("Could not load the entry " + p + " " + i + " " + e);
            //}
        }
    }
    return result;
}

module.exports = {"load": load};
