import computeArea from './computeArea';
/**
 * Extract the signals from the peakList and the given spectrum.
 * @param {object} spectrum - spectra data
 * @param {object} peakList - nmr signals
 * @param {object} options
 * @param {...number} options.nH - Number of hydrogens or some number to normalize the integral data, If it's zero return the absolute integral value
 * @param {string} options.integralType - option to chose between approx area with peaks or the sum of the points of given range
 * @param {...number} options.frequencyCluster - distance limit to clustering the peaks.
 * range = frequencyCluster / observeFrequency -> Peaks withing this range are considered to belongs to the same signal1D
 * @return {Array} nmr signals
 * @private
 */
export default function detectSignals(spectrum, peakList, options = {}) {
    var {
        nH = 0,
        integralType = 'sum',
        frequencyCluster = 16,
        frequency = spectrum.observeFrequencyX()
    } = options;

    var i, j, signal1D, peaks;
    var signals = [];
    var prevPeak = {x: 100000};
    var spectrumIntegral = 0;
    frequencyCluster /= frequency;
    for (i = 0; i < peakList.length; i++) {
        if (Math.abs(peakList[i].x - prevPeak.x) > frequencyCluster) {
            signal1D = {
                nbPeaks: 1, units: 'PPM',
                startX: peakList[i].x - peakList[i].width,
                stopX: peakList[i].x + peakList[i].width,
                multiplicity: '', pattern: '',
                observe: frequency, nucleus: spectrum.getNucleus(1),
                integralData: {
                    from: peakList[i].x - peakList[i].width * 3,
                    to: peakList[i].x + peakList[i].width * 3
                },
                peaks: [{x: peakList[i].x, intensity: peakList[i].y, width: peakList[i].width}]
            };
            signals.push(signal1D);
        } else {
            var tmp = peakList[i].x + peakList[i].width;
            signal1D.stopX = Math.max(signal1D.stopX, tmp);
            signal1D.startX = Math.min(signal1D.startX, tmp);
            signal1D.nbPeaks++;
            signal1D.peaks.push({x: peakList[i].x, intensity: peakList[i].y, width: peakList[i].width});
            signal1D.integralData.from = Math.min(signal1D.integralData.from, peakList[i].x - peakList[i].width * 3);
            signal1D.integralData.to = Math.max(signal1D.integralData.to, peakList[i].x + peakList[i].width * 3);
        }
        prevPeak = peakList[i];
    }

    for (i = 0; i < signals.length; i++) {
        peaks = signals[i].peaks;
        let integral = signals[i].integralData;
        let chemicalShift = 0;
        let integralPeaks = 0;

        for (j = 0; j < peaks.length; j++) {
            var area = computeArea(peaks[j]);
            chemicalShift += peaks[j].x * area;
            integralPeaks += area;
        }
        signals[i].delta1 = chemicalShift / integralPeaks;

        if (integralType === 'sum') {
            integral.value = spectrum.getArea(integral.from, integral.to);
        } else {
            integral.value = integralPeaks;
        }
        spectrumIntegral += integral.value;
    }

    // if (nH > 0) {
    //     let integralFactor = nH / spectrumIntegral;
    //     for (i = 0; i < signals.length; i++) {
    //         let integral = signals[i].integralData;
    //         integral.value *= integralFactor;
    //     }
    // }

    return signals;
}
