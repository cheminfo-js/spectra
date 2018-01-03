
const FS = require('fs');
const SD = require('spectra-data');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function createSpectraData(filename) {
    var spectrum = SD.NMR.fromJcamp(
        FS.readFileSync(filename).toString()
    );
    return spectrum;
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    //var keepMolfile = false || options.keepMolfile;
    //var keepMolecule = false || options.keepMolecule;
    var filter = {filter: '.mol'};
    if (typeof options.filter === 'object') {
        filter = options.filter;
    }

    //var datasetName = "learningDataSet";
    //var path = "/Research/NMR/AutoAssign/data/"+datasetName;
    var molFiles = FS.readdirSync(path).filter(line => {
        return line.endsWith(filter.filter);
    });

    var max = molFiles.length;
    var result = [];//new Array(max);
    // we could now loop on the sdf to add the int index
    for (var i = 0; i < max; i++) {
        try {
            var molfile = loadFile(path + molFiles[i]);
            var molecule = OCLE.Molecule.fromMolfile(molfile);
            molecule.addImplicitHydrogens();
            var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, '$1') * 1;
            var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
            diaIDs.sort(function (a, b) {
                if (a.atomLabel === b.atomLabel) {
                    return b.counter - a.counter;
                }
                return a.atomLabel < b.atomLabel ? 1 : -1;
            });
            
            //const diaIdsH = molecule.getGroupedDiastereotopicAtomIDs("H");
            const atoms = {};
            const levels = [5, 4, 3];
            for (const diaId of diaIDs) {
                const hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
                    maxSphereSize: levels[0],
                    type: 0
                });
                const atom = {
                    diaID: diaId.oclID,
                    hose: hoseCodes
                };
                //for (const level of levels) {
                //    if (hoseCodes[level]) {
                //        atom['hose' + level] = hoseCodes[level];
                //    }
                //}
                for (const atomID of diaId.atoms) {
                    atoms[atomID] = JSON.parse(JSON.stringify(atom));
                }
            }

            molecule._atoms = atoms;
            molecule._diaIdsH = diaIdsH; 

            let ocl = {value: molecule};
            ocl.diaIDs = diaIDs;
            ocl.diaID = molecule.getIDCode();
            ocl.nH = nH;

            //Simulate and process the 1H-NMR spectrum at 400MHz
            var jcampFile = molFiles[i].replace('mol_', 'h1_').replace('.mol', '.jdx');
            var spectraData1H = createSpectraData(path + jcampFile);

            var signals = spectraData1H.getRanges(
                {
                    nH: nH,
                    realTop: true,
                    thresholdFactor: 1,
                    clean: true,
                    compile: true,
                    idPrefix: '1H',
                    format: 'new'
                }
            );

            signals.forEach((range, index)=> {
                range.signalID = "1H_" + index;
            });
            
            //console.log(JSON.stringify(signals));
            let sample = {general: {ocl: ocl}, //{ocl: ocl, molfile: molecule.toMolfileV3()},
                spectra: {nmr: [{nucleus: 'H', experiment: '1d', range: signals, solvent: spectraData1H.getParamString('.SOLVENT NAME', 'unknown')}]}};
            // {nucleus: ["H", "H"],  experiment: "cosy", region: cosyZones, solvent: cosy.getParamString(".SOLVENT NAME", "unknown")}
            result.push(sample);
        } catch (e) {
            //console.log('Could not load the entry ' + i + ' ' + e);
        }
    }
    return result;
}
module.exports = {load};
