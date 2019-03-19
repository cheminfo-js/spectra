const FS = require('fs');
const predictor = require('nmr-predictor');
const OCLE = require('openchemlib-extended');

function loadFile(filename) {
    return FS.readFileSync(filename).toString();
}

function load(path, datasetName, options) {
    let OCLE = options.OCLE;
    var filter = { filter: '.mol' };
    if (typeof options.filter === 'object') {
        filter = options.filter;
    }

    // var datasetName = "learningDataSet";
    // var path = "/Research/NMR/AutoAssign/data/"+datasetName;
    var molFiles = FS.readdirSync(path).filter((line) => {
        return line.endsWith(filter.filter);
    });

    var max = molFiles.length;
    var result = [];// new Array(max);
    // we could now loop on the sdf to add the int index
    for (var i = 0; i < max; i++) {
        try {
            var molfile = loadFile(path + molFiles[i]);
            var molecule = OCLE.Molecule.fromMolfile(molfile);
            molecule.addImplicitHydrogens();
            molfile = molecule.toMolfile();
            let id = molecule.getIDCode()
            predictor.spinus(molfile, { group: false }).then(prediction => {
                FS.writeFileSync(`${__dirname}/spinus/${id}.mol`, molfile);
                FS.writeFileSync(`${__dirname}/spinus/${id}.json`, JSON.stringify(prediction));
            }).catch(reason => { return new Error(reason) });
        }
        catch (e) {
            //console.log(`Could not load the entry ${i} ${e}`);
        }
    }
}

load('/home/acastillo/Documents/data/data/cheminfo443/', 'cheminfo', { keepMolecule: true, OCLE: OCLE });