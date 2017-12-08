import {
    compilePatternFromExperimentalSignal as compile,
    updateSignalIntegral,
    detectSignals
} from 'spectra-nmr-utilities';
import impurityRemover from './ImpurityRemover';
import {Ranges} from 'spectra-data-ranges';
import round from 'lodash.round';


const defaultOptions = {
    nH: 100,
    clean: 0.5,
    thresholdFactor: 1,
    compile: true,
    integralType: 'sum',
    optimize: true,
    frequencyCluster: 16,
    keepPeaks: false,
    keepNbSignals: true
};

/**
 * This function clustering peaks and calculate the integral value for each range from the peak list returned from extractPeaks function.
 * @param {SD} spectrum - SD instance
 * @param {Object} peakList - nmr signals
 * @param {Object} options - options object with some parameter for GSD, detectSignal functions.
 * @param {number} [options.nH = 100] - Number of hydrogens or some number to normalize the integral data. If it's zero return the absolute integral value
 * @param {string} [options.integralType = 'sum'] - option to chose between approx area with peaks or the sum of the points of given range ('sum', 'peaks')
 * @param {number} [options.frequencyCluster = 16] - distance limit to clustering peaks.
 * @param {number} [options.clean] - If exits it remove all the signals with integral < clean value
 * @param {boolean} [options.compile = true] - If true, the Janalyzer function is run over signals to compile the patterns.
 * @param {boolean} [options.keepPeaks = false] - If true each signal will contain an array of peaks.
 * @param {boolean} [options.keepNbSignals = true] - If false and compile is true, the compile could generate more signals, see getSignalPattern.
 * @returns {Array}
 */

export default function createRanges(spectrum, peakList, options) {
    options = Object.assign({}, defaultOptions, options);
    peakList = impurityRemover(peakList, options.removeImpurity);
    var signals = detectSignals(spectrum, peakList, options);

    if (options.compile) {
        signals = compile(spectrum, signals, options);
    }

    signals.sort(function (a, b) {
        return b.delta1 - a.delta1;
    });

    signals = updateSignalIntegral(signals, options.nH);

    if (options.clean) {
        for (let i = signals.length - 1; i >= 0; i--) {
            if (signals[i].integralData.value < options.clean) {
                signals.splice(i, 1);
            }
        }
    }

    let ranges = new Array(signals.length);
    for (let i = 0; i < signals.length; i++) {
        var signal = signals[i];
        ranges[i] = {
            from: round(signal.integralData.from, 5),
            to: round(signal.integralData.to, 5),
            integral: round(signal.integralData.value, 5),
            signal: [{
                nbAtoms: 0,
                diaID: [],
                multiplicity: signal.multiplicity,
                kind: '',
                remark: ''
            }]

        };
        if (options.keepPeaks) {
            ranges[i].signal[0].peak = signal.peaks;
        }
        if (signal.nmrJs) {
            ranges[i].signal[0].j = signal.nmrJs;
        }
        if (!signal.asymmetric || signal.multiplicity === 'm') {
            ranges[i].signal[0].delta = round(signal.delta1, 5);
        }
    }

    return new Ranges(ranges);
}
