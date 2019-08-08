import FS from 'fs';
import predictor from 'nmr-predictor';
import OCLE from 'openchemlib-extended';

function loadFile(filename) {
  return FS.readFileSync(filename).toString();
}

async function load(path, datasetName, options) {
  let OCLE = options.OCLE;
  // var keepMolfile = false || options.keepMolfile;
  // var keepMolecule = false || options.keepMolecule;
  var filter = { filter: '.txt' };
  if (typeof options.filter === 'object') {
    filter = options.filter;
  }

  var parts = FS.readdirSync(path).filter(line => {
    return line.indexOf(filter.filter) > 0;
  });

  for (var p = 0; p < parts.length; p++) {
    let fileContent = loadFile(path + parts[p]).split('\n');
    var max = fileContent.length - 1;
    // eslint-disable-next-line no-console
    console.log('molecules ' + max);
    // we could now loop on the sdf to add the int index
    for (var i = 1; i < max; i++) {
      // eslint-disable-next-line no-console
      console.log(i);
      try {
        let row = fileContent[i].split('\t');
        var molfile = row[1].replace(/\\n/g, '\n');
        var molecule = OCLE.Molecule.fromMolfile(molfile);
        molecule.addImplicitHydrogens();
        molfile = molecule.toMolfile();
        let id = molecule.getIDCode();
        let prediction = await predictor.spinus(molfile, { group: false }); //.then(prediction => {
        FS.writeFileSync(`${__dirname}/spinus/mb_${p}_${i}.mol`, molfile);
        FS.writeFileSync(
          `${__dirname}/spinus/mb_${p}_${i}.json`,
          JSON.stringify(prediction)
        );
        //}).catch(reason => { return new Error(reason) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Could not load the entry ${i} ${e}`);
      }
    }
  }
}

load('/home/acastillo/Documents/data/data/maybridge/', 'mb', {
  keepMolecule: true,
  OCLE: OCLE
});
