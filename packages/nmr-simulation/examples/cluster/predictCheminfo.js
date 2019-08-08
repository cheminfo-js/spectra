import FS from 'fs';
import predictor from 'nmr-predictor';
import OCLE from 'openchemlib-extended';

function loadFile(filename) {
  return FS.readFileSync(filename).toString();
}

async function load(path, datasetName, options) {
  let OCLE = options.OCLE;
  var filter = { filter: '.mol' };
  if (typeof options.filter === 'object') {
    filter = options.filter;
  }

  // var datasetName = "learningDataSet";
  // var path = "/Research/NMR/AutoAssign/data/"+datasetName;
  var molFiles = FS.readdirSync(path).filter(line => {
    return line.endsWith(filter.filter);
  });

  var max = molFiles.length;
  // eslint-disable-next-line no-console
  console.log('molecules ' + max);
  var result = []; // new Array(max);
  // we could now loop on the sdf to add the int index
  for (let i = 0; i < max; i++) {
    try {
      // eslint-disable-next-line no-console
      console.log(i + ' ' + molFiles[i]);
      var molfile = loadFile(path + molFiles[i]);
      var molecule = OCLE.Molecule.fromMolfile(molfile);
      molecule.addImplicitHydrogens();
      molfile = molecule.toMolfile();
      let id = molecule.getIDCode();
      //We cannot sent to many parallel request to the spinus server.
      let prediction = await predictor.spinus(molfile, { group: false });
      //.then(prediction => {
      FS.writeFileSync(`${__dirname}/spinus/ch_${molFiles[i]}`, molfile);
      FS.writeFileSync(
        `${__dirname}/spinus/ch_${molFiles[i].replace('.mol', '.json')}`,
        JSON.stringify(prediction)
      );
      //}).catch(reason => { return new Error(reason) });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`Could not load the entry ${i} ${e}`);
    }
  }
}

load('/home/acastillo/Documents/data/data/cheminfo443/', 'ch', {
  keepMolecule: true,
  OCLE: OCLE
});
