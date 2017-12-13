
const FS = require('fs');
const SD = require('spectra-data');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;

    var result = [];
    var rows = JSON.parse(loadFile(path)).rows;
    console.log(rows.length);
    for (var p = 0; p < 8000; p++) {
        var row = rows[p];
        if(row.value.nucleus === '1H') {
            try {
                var molecule = OCLE.Molecule.fromIDCode(row.value.idCode);
                //console.log(p + " " +molecule.getIDCode());
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
        
                let ocl = {value: molecule};
                ocl.diaIDs = diaIDs;
                ocl.diaID = row.value.idCode;//molecule.getIDCode();
                ocl.nH = nH;
                
                var signals = row.value.range;
                for (var j = signals.length - 1; j >= 0; j--) {
                    if (signals[j].from < 0 || signals[j].from > 16) {
                        signals.splice(j, 1);
                    }
                }
        
                signals.forEach((range, index)=> {
                    range.signalID = "1H_" + index;
                });
        
                let sample = {
                    general: {ocl: ocl},//: molecule.toMolfile()},
                    spectra: {
                        nmr: [{
                            nucleus: 'H',
                            experiment: '1d',
                            range: signals,
                            solvent: row.value.solvent
                        }]
                    }
                }
    
                result.push(sample);
            }
            catch(e) {
                console.log("Could not load this molecule: " + row.value.idCode)
            }
        }

    }
    return result;
}

module.exports = {load: load};
