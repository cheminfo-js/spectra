import GSD from 'ml-gsd';

/**
 * Implementation of the peak picking method described by Cobas in:
 * A new approach to improving automated analysis of proton NMR spectra
 * through Global Spectral Deconvolution (GSD)
 * http://www.spectroscopyeurope.com/images/stories/ColumnPDFs/TD_23_1.pdf
 * @param {SD} spectrum - SD instance.
 * @param {Object} peakList - nmr signals.
 * @param {Object} options - options object with some parameter for GSD.
 * @param {boolean} [options.compile = true] - If true, the Janalyzer function is run over signals to compile the patterns.
 * @param {number} [options.minMaxRatio = 0.01] - Threshold to determine if a given peak should be considered as a noise, bases on its relative height compared to the highest peak.
 * @param {number} [options.broadRatio = 0.00025] - If broadRatio is higher than 0, then all the peaks which second derivative smaller than broadRatio * maxAbsSecondDerivative will be marked with the soft mask equal to true.
 * @param {boolean} [options.smoothY = true] - Select the peak intensities from a smoothed version of the independent variables?
 * @param {number} [options.nL = 4] - factor to determine the width at the moment to group the peaks in signals in 'GSD.optimizePeaks' function.
 * @param {boolean} [options.optimize = true] - if it's true adjust an train of gaussian or lorentzian shapes to spectrum.
 * @param {string} [options.functionType = 'gaussian'] - This option allows us choose between 'gaussian' or 'lorentzian' function when options.optimize is true.
 * @param {number} [options.broadWidth = 0.25] - Threshold to determine if some peak is candidate to clustering into range.
 * @return {Array}
 */

const defaultOptions = {
    thresholdFactor: 1,
    minMaxRatio: 0.01,
    broadRatio: 0.00025,
    smoothY: true,
    widthFactor: 4,
    realTop: true,
    functionName: 'gaussian',
    broadWidth: 0.25,
    sgOptions: {windowSize: 9, polynomial: 3}
};


export default function extractPeaks(spectrum, options = {}) {
    options = Object.assign({}, defaultOptions, options, {optimize: false, broadWidth: false});

    let {
        from,
        to,
        broadWidth,
        optimize,
        noiseLevel = Math.abs(spectrum.getNoiseLevel(options)) * (options.thresholdFactor)
    } = options;

    var data = (from !== undefined && to !== undefined) ? spectrum.getVector({from, to, outputX: true}) : spectrum.getSpectrumData();

    var peakList = GSD.gsd(data.x, data.y, options);

    if (broadWidth) {
        peakList = GSD.post.joinBroadPeaks(peakList, {width: options.broadWidth});
    }
    if (optimize) {
        peakList = GSD.post.optimizePeaks(peakList, data.x, data.y, options);
    }

    return peakList.filter((p) => p.y >= noiseLevel);
}
