const FS = require('fs');
const predictor = require('nmr-predictor');
const OCLE = require('openchemlib-extended');


function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    // var keepMolfile = false || options.keepMolfile;
    // var keepMolecule = false || options.keepMolecule;
    var filter = { filter: '.txt' };
    if (typeof options.filter === 'object') {
        filter = options.filter;
    }

    var parts = FS.readdirSync(path).filter((line) => {
        return line.indexOf(filter.filter) > 0;
    });

    for (var p = 0; p < parts.length; p++) {
        let fileContent = loadFile(path + parts[p]).split('\n');
        var max = fileContent.length - 1;
        // we could now loop on the sdf to add the int index
        for (var i = 1; i < max; i++) {
            let row = fileContent[i].split('\t');
            var molfile = row[1].replace(/\\n/g, '\n');
            var molecule = OCLE.Molecule.fromMolfile(molfile);
            molecule.addImplicitHydrogens();
            molfile = molecule.toMolfile();
            let id = molecule.getIDCode()
            predictor.spinus(molfile, { group: false }).then(prediction => {
                FS.writeFileSync(`${__dirname}/spinus/${id}.mol`, molfile);
                FS.writeFileSync(`${__dirname}/spinus/${id}.json`, JSON.stringify(prediction));
            }).catch(reason => { return new Error(reason) });
        }
    }
}

load('/home/acastillo/Documents/data/maybridge/', 'maybridge', { keepMolecule: true, OCLE: OCLE });
