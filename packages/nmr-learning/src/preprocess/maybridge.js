
const FS = require('fs');
const SD = require('spectra-data');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    //var keepMolfile = false || options.keepMolfile;
    //var keepMolecule = false || options.keepMolecule;
    var filter = {filter: '.txt'};
    if (typeof options.filter === 'object') {
        filter = options.filter;
    }

    var parts = FS.readdirSync(path).filter(line => {
        return line.indexOf(filter.filter) > 0;
    });

    var result = [];
    for (var p = 0; p < parts.length; p++) {
        let fileContent = loadFile(path + parts[p]).split('\n');
        var max = 2//fileContent.length - 1;
        // we could now loop on the sdf to add the int index
        for (var i = 1; i < max; i++) {
            let row = fileContent[i].split('\t');
            //result.push(row);
            //try {
            //var sdfi = {dataset: datasetName, id: p + "_" + i + "_" + molFiles[i].catalogID};
            var molfile = row[1].replace(/\\n/g, '\n');
            var molecule = OCLE.Molecule.fromMolfile(molfile);
            //let ocl = {value: molecule};

            molecule.addImplicitHydrogens();
            var nH = molecule.getMolecularFormula().formula.replace(/.*H([0-9]+).*/, '$1') * 1;
            var diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
            diaIDs.sort(function (a, b) {
                if (a.atomLabel === b.atomLabel) {
                    return b.counter - a.counter;
                }
                return a.atomLabel < b.atomLabel ? 1 : -1;
            });

            /*const diaIdsH = molecule.getGroupedDiastereotopicAtomIDs("H");
            const atoms = {};
            const atomNumbers = [];
            const levels = [5, 4, 3, 2];
            for (const diaId of diaIdsH) {
                const hoseCodes = OCLE.Util.getHoseCodesFromDiastereotopicID(diaId.oclID, {
                    maxSphereSize: 5,
                    type: 0
                });
                const atom = {
                    diaIDs: [diaId.oclID]
                };
                for (const level of levels) {
                    if (hoseCodes[level]) {
                        atom['hose' + level] = hoseCodes[level];
                    }
                }
                for (const diaIdAtom of diaId.atoms) {
                    atoms[diaIdAtom] = JSON.parse(JSON.stringify(atom));
                    atomNumbers.push(diaIdAtom);
                }
            }

            molecule.___atoms = atoms;
            molecule.___atomNumbers = atomNumbers;
            molecule.___diaIdsH = diaIdsH;*/

            let ocl = {value: molecule};
            ocl.diaIDs = diaIDs;
            ocl.diaID = molecule.getIDCode();
            ocl.nH = nH;

            //console.log(i / max * 100 );
            var spectraData1H = SD.NMR.fromJcamp(row[2].replace(/\\n/g, '\n'));
            //
            //console.log(spectraData1H.getParamString('.SOLVENTNAME', 'unknown'));
            try {
                spectraData1H.fillImpurity(spectraData1H.getParamString('.SOLVENTNAME', 'DMSO'));                
            }
            catch (e) {}
            
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


            for (var j = signals.length - 1; j >= 0; j--) {
                if (signals[j].from < 0 || signals[j].from > 16) {
                    signals.splice(j, 1);
                }
            }

            signals.forEach((range, index)=> {
                range.signalID = "1H_" + index;
            });

            let sample = {
                general: {ocl: ocl},
                spectra: {
                    nmr: [{
                        nucleus: 'H',
                        experiment: '1d',
                        range: signals,
                        solvent: spectraData1H.getParamString('.SOLVENT NAME', 'unknown')
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

module.exports = {load: load};
