const FS = require('fs');
const predictor = require('nmr-predictor');
const OCLE = require('openchemlib-extended');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    var k = 0;
    var rows = JSON.parse(loadFile(path)).rows;
    console.log(rows.length);
    for (var p = 0; p < rows.length; p++) {
        var row = rows[p];
        if (p % 500 === 0) {
            logger(p);
        }
        try {
            let molecule = OCLE.Molecule.fromIDCode(row.value.idCode);
            molecule.addImplicitHydrogens();
            let molfile = molecule.toMolfile();
            let id = molecule.getIDCode();
            predictor.spinus(molfile, { group: false }).then(prediction => {
                FS.writeFileSync(`${__dirname}/spinus/${id}.mol`, molfile);
                FS.writeFileSync(`${__dirname}/spinus/${id}.json`, JSON.stringify(prediction));
            }).catch(reason => { return new Error(reason) });
        } catch (e) {
            console.log(`Could not load this molecule: ${row.value.idCode}`);
        }
    }
}

load("/home/acastillo/Documents/data/output.json", "c6h6", { keepMolecule: true, OCLE: OCLE });
