import JAnalyzer from './jAnalyzer';
import computeArea from './computeArea';
import detectSignals from './detectSignals';

export default function (spectrum, signals, options) {
    var nHi, sum;
    var nH = options.nH;
    for (let i = 0; i < signals.length; i++) {
        JAnalyzer.compilePattern(signals[i]);

        if (signals[i].maskPattern &&
            signals[i].multiplicity !== 'm' &&
            signals[i].multiplicity !== ''
        ) {
            //Create a new signal with the removed peaks
            nHi = 0;
            sum = 0;
            var peaksO = [];
            for (let j = signals[i].maskPattern.length - 1; j >= 0; j--) {
                sum += computeArea(signals[i].peaks[j]);
                if (signals[i].maskPattern[j] === false) {
                    var peakR = signals[i].peaks.splice(j, 1)[0];
                    peaksO.push({x: peakR.x, y: peakR.intensity, width: peakR.width});
                    signals[i].mask.splice(j, 1);
                    signals[i].mask2.splice(j, 1);
                    signals[i].maskPattern.splice(j, 1);
                    signals[i].nbPeaks--;
                    nHi += computeArea(peakR);
                }
            }
            if (peaksO.length > 0) {
                nHi = nHi * signals[i].integralData.value / sum;
                signals[i].integralData.value -= nHi;
                var peaks1 = [];
                for (let j = peaksO.length - 1; j >= 0; j--) {
                    peaks1.push(peaksO[j]);
                }
                options.nH = nHi;
                let ranges = detectSignals(spectrum, peaks1, options);

                for (let j = 0; j < ranges.length; j++) {
                    signals.push(ranges[j]);
                }
            }
        }
    }

    var sumIntegral = 0;
    var sumObserved = 0;
    for (let i = 0; i < signals.length; i++) {
        sumObserved += Math.round(signals[i].integralData.value);
    }
    if (sumObserved !== nH) {
        sumIntegral = nH / sumObserved;
        for (let i = 0; i < signals.length; i++) {
            signals[i].integralData.value *= sumIntegral;
        }
    }

    return signals;
}
