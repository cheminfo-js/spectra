const FS = require('fs');
const predictor = require('nmr-predictor');
const OCLE = require('openchemlib-extended');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

async function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    var k = 0;
    var rows = JSON.parse(loadFile(path)).rows;
    console.log("molecules " + rows.length);
    for (var p = 4847; p <= 5300; p++) {
        var row = rows[p];
        if (p % 50 === 0) {
            console.log(p);
        }
        try {
            let molecule = OCLE.Molecule.fromIDCode(row.value.idCode);
            molecule.addImplicitHydrogens();
            let molfile = molecule.toMolfile();
            let id = molecule.getIDCode();
            let prediction = await predictor.spinus(molfile, { group: false });//.then(prediction => {
                FS.writeFileSync(`${__dirname}/spinus/c6h6_${p}.mol`, molfile);
                FS.writeFileSync(`${__dirname}/spinus/c6h6_${p}.json`, JSON.stringify(prediction));
            //}).catch(reason => { return new Error(reason) });
        } catch (e) {
            console.log(`Could not load this molecule: ${row.value.idCode}`);
        }
    }
}

load("/home/acastillo/Documents/data/data/output.json", "c6h6", { keepMolecule: true, OCLE: OCLE });
