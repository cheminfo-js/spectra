/**
 * Created by acastillo on 5/7/16.
 */

import FS from 'fs';
import path from 'path';

import OCLE from 'openchemlib-extended';
import predictor from 'nmr-predictor';
// import SD from 'spectra-data';

const autoassigner = require('../src/index');

function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

/* function createSpectraData(filename, label, data) {
    var spectrum = SD.NMR.fromJcamp(
        loadFile(filename)
    );
    return spectrum;
}

function createSpectraData2D(filename, label, data) {
    var spectrum = SD.NMR2D.fromJcamp(
        loadFile(filename)
    );
    return spectrum;
}*/

describe('Auto assignment tests', function() {
  // var spectrum = createSpectraData("/../../../data-test/ethylvinylether/1h.jdx");
  // var spectrum = createSpectraData("/../../../data-test/ethylbenzene/h1_0.jdx");
  // var cosy = createSpectraData2D("/data-test/ethylbenzene/cosy_0.jdx");

  /* var peakPicking = spectrum.getRanges({
          "nH": 10,
          realTop: true,
          thresholdFactor: 1,
          clean: 0.5,
          compile: true,
          idPrefix: "1H",
          format: "new"
      });

      peakPicking.forEach((range, index)=> {
          range.signalID = "1H_" + index;
      });*/

  // console.log(JSON.stringify(peakPicking));
  var peakPicking = [
    {
      from: 7.25629,
      to: 7.31871,
      integral: 1.96836,
      signal: [
        {
          nbAtoms: 0,
          diaID: [],
          multiplicity: 'm',
          kind: '',
          remark: '',
          delta: 7.28271
        }
      ],
      signalID: '1H_0'
    },
    {
      from: 7.15091,
      to: 7.22304,
      integral: 2.76568,
      signal: [
        {
          nbAtoms: 0,
          diaID: [],
          multiplicity: 'm',
          kind: '',
          remark: '',
          delta: 7.20152
        }
      ],
      signalID: '1H_1'
    },
    {
      from: 2.56504,
      to: 2.64283,
      integral: 1.97669,
      signal: [
        {
          nbAtoms: 0,
          diaID: [],
          multiplicity: 'q',
          kind: '',
          remark: '',
          j: [{ coupling: 7.65449122379232, multiplicity: 'q' }],
          delta: 2.60393
        }
      ],
      signalID: '1H_2'
    },
    {
      from: 1.16673,
      to: 1.2144,
      integral: 2.79207,
      signal: [
        {
          nbAtoms: 0,
          diaID: [],
          multiplicity: 't',
          kind: '',
          remark: '',
          j: [{ coupling: 7.654491223786863, multiplicity: 't' }],
          delta: 1.19057
        }
      ],
      signalID: '1H_3'
    }
  ];
  var cosyZones = [
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 7.198285176388374,
      shiftY: 7.279053936671747,
      fromTo: [
        { from: 7.150433809758376, to: 7.209352239765698 },
        { from: 7.27663496124714, to: 7.2864816977973526 }
      ],
      peaks: [
        { x: 7.153023584863875, y: 7.2864816977973526, z: 407375316 },
        { x: 7.202003112113596, y: 7.2827179342941495, z: 1881943893 },
        { x: 7.209352239765698, y: 7.27663496124714, z: 77647382 },
        { x: 7.150433809758376, y: 7.285051869492682, z: 51096649 }
      ],
      _highlight: ['198_0'],
      signalID: '198_0'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 7.279053936671747,
      shiftY: 7.279053936671747,
      fromTo: [
        { from: 7.276687588345495, to: 7.276931748453136 },
        { from: 7.27663496124714, to: 7.276879121055215 }
      ],
      peaks: [
        { x: 7.276931748453136, y: 7.276879121055215, z: 2743098615 },
        { x: 7.276687588345495, y: 7.27663496124714, z: 172103449 }
      ],
      _highlight: ['198_1'],
      signalID: '198_1'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 7.279053936671747,
      shiftY: 7.198285176388374,
      fromTo: [
        { from: 7.276687588345495, to: 7.286534336976937 },
        { from: 7.150381337564022, to: 7.209299695282811 }
      ],
      peaks: [
        { x: 7.286534336976937, y: 7.152971109492059, z: 407375316 },
        { x: 7.2829095903692656, y: 7.201610246586484, z: 1906598506 },
        { x: 7.285104506917969, y: 7.150381337564022, z: 51096649 },
        { x: 7.276687588345495, y: 7.209299695282811, z: 77647382 }
      ],
      _highlight: ['198_2'],
      signalID: '198_2'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 7.198285176388374,
      shiftY: 7.198285176388374,
      fromTo: [
        { from: 7.165418735271049, to: 7.209352239765698 },
        { from: 7.165366244691305, to: 7.209299695282811 }
      ],
      peaks: [
        { x: 7.165418735271049, y: 7.165366244691305, z: 383172242 },
        { x: 7.203768096767339, y: 7.203715559135779, z: 3102858110 },
        { x: 7.167267646903326, y: 7.167215154055104, z: 60057256 },
        { x: 7.209352239765698, y: 7.209299695282811, z: 243685217 }
      ],
      _highlight: ['198_3'],
      signalID: '198_3'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 2.598996149574079,
      shiftY: 7.198285176388374,
      fromTo: [
        { from: 2.605297780622114, to: 2.605297780622114 },
        { from: 7.200882787037269, to: 7.200882787037269 }
      ],
      peaks: [
        { x: 2.605297780622114, y: 7.200882787037269, z: 4335105 },
        { x: 2.605297780622114, y: 7.200882787037269, z: 4335105 }
      ],
      _highlight: ['198_4'],
      signalID: '198_4'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 3.421304349396864,
      shiftY: 3.421304349396864,
      fromTo: [
        { from: 3.4212489178427576, to: 3.4217388821521464 },
        { from: 3.421201021081032, to: 3.4216909847892705 }
      ],
      peaks: [
        { x: 3.4212489178427576, y: 3.421201021081032, z: 1711714603 },
        { x: 3.4217388821521464, y: 3.4216909847892705, z: 291976049 }
      ],
      _highlight: ['198_5'],
      signalID: '198_5'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 1.1846035971267705,
      shiftY: 2.598996149574079,
      fromTo: [
        { from: 1.1644784007344517, to: 1.2080892975913367 },
        { from: 2.57158325198961, to: 2.6220847014628568 }
      ],
      peaks: [
        { x: 1.1644784007344517, y: 2.597541222517262, z: 2801230951 },
        { x: 1.203343489745686, y: 2.597513741058547, z: 3193792690 },
        { x: 1.1660047047289641, y: 2.57158325198961, z: 153964080 },
        { x: 1.2080892975913367, y: 2.57158325198961, z: 155848128 },
        { x: 1.1660047047289641, y: 2.6220847014628568, z: 144111512 },
        { x: 1.2080892975913367, y: 2.6220847014628568, z: 151243635 }
      ],
      _highlight: ['198_6'],
      signalID: '198_6'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 7.198285176388374,
      shiftY: 2.598996149574079,
      fromTo: [
        { from: 7.200935321193224, to: 7.200935321193224 },
        { from: 2.605250884971775, to: 2.605250884971775 }
      ],
      peaks: [
        { x: 7.200935321193224, y: 2.605250884971775, z: 4335105 },
        { x: 7.200935321193224, y: 2.605250884971775, z: 4335105 }
      ],
      _highlight: ['198_7'],
      signalID: '198_7'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 2.598996149574079,
      shiftY: 2.598996149574079,
      fromTo: [
        { from: 2.596581819799498, to: 2.5968808620496393 },
        { from: 2.5965349348429942, to: 2.5968339767262334 }
      ],
      peaks: [
        { x: 2.596581819799498, y: 2.5965349348429942, z: 3235218600 },
        { x: 2.5968808620496393, y: 2.5968339767262334, z: 100211648 }
      ],
      _highlight: ['198_8'],
      signalID: '198_8'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 2.5068558720513483,
      shiftY: 2.5068558720513483,
      fromTo: [
        { from: 2.5042947577524197, to: 2.507185259953964 },
        { from: 2.5042479860252804, to: 2.507138484680394 }
      ],
      peaks: [
        { x: 2.507185259953964, y: 2.507138484680394, z: 92902618 },
        { x: 2.5042947577524197, y: 2.5042479860252804, z: 11313862 }
      ],
      _highlight: ['198_9'],
      signalID: '198_9'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 2.598996149574079,
      shiftY: 1.1846035971267705,
      fromTo: [
        { from: 2.571630106332215, to: 2.622131617767063 },
        { from: 1.1645197262811164, to: 1.2080441162119353 }
      ],
      peaks: [
        { x: 2.597782250576457, y: 1.1645197262811164, z: 2785499075 },
        { x: 2.597560627215974, y: 1.2032983141890385, z: 3193792690 },
        { x: 2.571630106332215, y: 1.16595957498423, z: 153964080 },
        { x: 2.622131617767063, y: 1.16595957498423, z: 144111512 },
        { x: 2.571630106332215, y: 1.2080441162119353, z: 155848128 },
        { x: 2.622131617767063, y: 1.2080441162119353, z: 151243635 }
      ],
      _highlight: ['198_10'],
      signalID: '198_10'
    },
    {
      nucleusX: '1H',
      nucleusY: '1H',
      resolutionX: -0.008408698925431128,
      resolutionY: -0.0084169082455412,
      shiftX: 1.1846035971267705,
      shiftY: 1.1846035971267705,
      fromTo: [
        { from: 1.1828385418739131, to: 1.1846048843868555 },
        { from: 1.182793391475312, to: 1.183628237189457 }
      ],
      peaks: [
        { x: 1.1846048843868555, y: 1.183628237189457, z: 9025793295 },
        { x: 1.1828385418739131, y: 1.182793391475312, z: 424898800 }
      ],
      _highlight: ['198_11'],
      signalID: '198_11'
    }
  ];
  var molecule = OCLE.Molecule.fromSmiles('CCc1ccccc1');
  molecule.addImplicitHydrogens();
  var molfile = molecule.toMolfile();

  const db = JSON.parse(loadFile('/../../nmr-predictor/data/h1.json'));
  // console.log(db)
  //

  it('Ethylbenzene 1H + COSY from molfile + Chemical shift', async function() {
    predictor.setDb(db, 'proton', 'proton');
    var result = await autoassigner(
      {
        general: { molfile: molfile },
        spectra: {
          nmr: [
            { nucleus: 'H', experiment: '1d', range: peakPicking },
            { nucleus: ['H', 'H'], experiment: 'cosy', region: cosyZones }
          ]
        }
      },
      {
        minScore: 0.8,
        maxSolutions: 3000,
        errorCS: 2,
        predictor: predictor,
        condensed: true,
        OCLE: OCLE,
        levels: [5, 4, 3, 2]
      }
    );
    expect(result.getAssignments().length).toBe(2);
    expect(result.getAssignments()[0].score).toBeGreaterThan(0.8);
  });

  it('Ethylbenzene 1H + COSY from molfile + no Chemical shift', async function() {
    predictor.setDb(null, 'proton', 'proton');
    var result = await autoassigner(
      {
        general: { molfile: molfile },
        spectra: {
          nmr: [
            { nucleus: 'H', experiment: '1d', range: peakPicking },
            { nucleus: ['H', 'H'], experiment: 'cosy', region: cosyZones }
          ]
        }
      },
      {
        minScore: 0.9,
        maxSolutions: 3000,
        errorCS: 0,
        predictor: predictor,
        condensed: true,
        OCLE: OCLE
      }
    );
    expect(result.getAssignments().length).toBe(4);
    expect(result.getAssignments()[0].score).toBeGreaterThan(0.9);
  });

  it('Ethylbenzene 1H from molfile', async function() {
    var result = await autoassigner(
      {
        general: { molfile: molecule.toMolfileV3() },
        spectra: {
          nmr: [
            {
              nucleus: 'H',
              experiment: '1d',
              range: peakPicking,
              solvent: 'unknown'
            }
          ]
        }
      },
      {
        minScore: 1,
        maxSolutions: 3000,
        errorCS: 0,
        predictor: predictor,
        condensed: true,
        OCLE: OCLE,
        levels: [5, 4, 3, 2]
      }
    );
    expect(result.getAssignments().length).toBe(12);
    expect(result.getAssignments()[0].score).toBe(1);
  });
});
