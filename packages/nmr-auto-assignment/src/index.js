/**
 * Created by acastillo on 7/5/16.
 */
const SpinSystem = require('./SpinSystem2');
const AutoAssigner = require('./AutoAssigner2');
const getOcleFromOptions = require('./getOcleFromOptions');
const nmrUtilities = require('spectra-nmr-utilities');
let OCLE;

function autoAssign(entry, options) {
    if (entry && entry.spectra && entry.spectra.nmr && entry.spectra.nmr[0].range || entry.spectra.nmr[0].region) {
        return assignmentFromPeakPicking(entry, options);
    }
    else {
        return assignmentFromRaw(entry, options);
    }
}

function assignmentFromRaw(entry, options) {
    //TODO Implement this method
}

function assignmentFromPeakPicking(entry, options) {
    const predictor = options.predictor;
    var molecule, diaIDs, molfile;
    OCLE = getOcleFromOptions(options);
    var spectra = entry.spectra;
    if (!entry.general.ocl) {
        molecule = OCLE.Molecule.fromMolfile(entry.general.molfile);
        molecule.addImplicitHydrogens();
        diaIDs = molecule.getGroupedDiastereotopicAtomIDs();
        diaIDs.sort(function (a, b) {
            if (a.atomLabel === b.atomLabel) {
                return b.counter - a.counter;
            }
            return a.atomLabel < b.atomLabel ? 1 : -1;
        });

        entry.general.ocl = {value: molecule};
        entry.general.ocl.diaIDs = diaIDs;
        entry.general.ocl.diaID = molecule.getIDCode();
    }
    else {
        molecule = entry.general.ocl.value;
        diaIDs = entry.general.ocl.diaIDs;
    }

   //console.log(diaIDs);

    let prediction = [];
    entry.spectra.nmr.forEach(nmr => {
        prediction.push(predictByExperiment(molecule, nmr, options));

        if(nmr.experiment === "1d") {
            nmr.range.sort(function (a, b) {
                return b.integral - a.integral;
            });
        }
    })

    //console.log(JSON.stringify(entry.spectra.nmr))

    const spinSystem = new SpinSystem(spectra, prediction, options);

    //console.log(JSON.stringify(spinSystem))

    const autoAssigner = new AutoAssigner(spinSystem, options);
    autoAssigner.buildAssignments();
    return autoAssigner;
}

function predictByExperiment(molecule, nmr, options) {
    if(nmr.experiment === "1d") {
        let pred;
        if(nmr.nucleus === "H") {
            pred = options.predictor.proton(molecule, Object.assign({}, options, {ignoreLabile: false}));
        }

        if(nmr.nucleus === "C") {
            pred = options.predictor.carbon(molecule, Object.assign({}, options, {ignoreLabile: false}));
        }

        nmrUtilities.group(pred);

        var optionsError = {iteration: options.iteration || 1, learningRatio: options.learningRatio || 1};

        for (var j = 0; j < pred.length; j++) {
            pred[j].error = getError(pred[j], optionsError);
        }

        pred.sort(function (a, b) {
            if (a.atomLabel === b.atomLabel) {
                return b.nbAtoms - a.nbAtoms;
            }
            return a.atomLabel < b.atomLabel ? 1 : -1;
        });

        //console.log(pred);

        return pred;
    }
    else {
        if(nmr.experiment === "cosy")
            return molecule.getAllPaths({fromLabel: "H", toLabel: "H", minLength: 0, maxLength: 3});
        //TODO Add other 2D experiments
    }
}

function getError(prediction, param) {
    //console.log(prediction)
    //Never use predictions with less than 3 votes
    if (prediction.std === 0 || prediction.ncs < 3) {
        return 20;
    }
    else {
        //factor is between 1 and +inf
        //console.log(prediction.ncs+" "+(param.iteration+1)+" "+param.learningRatio);
        var factor = 3 * prediction.std /
            (Math.pow(prediction.ncs, (param.iteration + 1) * param.learningRatio));//(param.iteration+1)*param.learningRatio*h1pred[indexSignal].ncs;
        return 3 * prediction.std + factor;
    }
    return 20;
}

module.exports = autoAssign;