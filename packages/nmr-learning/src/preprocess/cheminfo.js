/**
 * Created by acastillo on 9/16/15.
 */
const FS = require('fs');

function loadFile(filename){
    return FS.readFileSync(__dirname + filename).toString();
}

function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(__dirname + filename).toString()
    );
    return spectrum;
};

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    var keepMolfile = false || options.keepMolfile;
    var keepMolecule = false || options.keepMolecule;
    var filter = {filter: ".mol"};
    if (typeof options.filter === "object") {
        filter = options.filter;
    }

    //var datasetName = "learningDataSet";
    //var path = "/Research/NMR/AutoAssign/data/"+datasetName;
    var molFiles = fs.readdirSync(path);
    var max = 100;//molFiles.length;
    var result = [];//new Array(max);
    // we could now loop on the sdf to add the int index
    for (var i = 0; i < max; i++) {
        try {
            var sdfi = {dataset: datasetName, id: i + ""};
            var molfile = loadFile(molFiles[i]);

            var molecule = OCLE.Molecule.fromMolfile(molfile);
            molecule.addImplicitHydrogens();
            var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/,"$1")*1;
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

            //Simulate and process the 1H-NMR spectrum at 400MHz
            var jcampFile = molFiles[i].replace("mol_", "h1_").replace(".mol", ".jdx");
            var spectraData1H = createSpectraData(jcampFile);

            var signals = spectraData1H.getRanges(
                {
                    "nH": nH,
                    realTop: true,
                    thresholdFactor: 1,
                    clean: true,
                    compile: true,
                    idPrefix: "1H",
                    format:"new"
                }
            );
            let sample = {general: {ocl: ocl, molfile: molecule.toMolfile()},
                             spectra: {nmr: [{nucleus: "H", experiment: "1d", range: peakPicking, solvent: spectrum.getParamString(".SOLVENT NAME", "unknown")}]}};
                            // {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}

            result.push(sample);
        }
        catch (e) {
            console.log("Could not load the entry " + i + " " + e);
        }
    }
    return result;
}
module.exports = {load};
