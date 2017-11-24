import JAnalyzer from './jAnalyzer';
import detectSignals from './detectSignals';
import updateSignalIntegral from './updateSignalIntegral';

export default function (spectrum, signals, options) {
    let result = [];
    signals = Array.isArray(signals) ? signals : [signals];

    for (let s of signals) {
        let signal = [JSON.parse(JSON.stringify(s))];
        for (let i = 0; i < signal.length; i++) {
            JAnalyzer.compilePattern(signal[i]);

            if (signal[i].maskPattern &&
                signal[i].multiplicity !== 'm' &&
                signal[i].multiplicity !== ''
            ) {
                //Create a new signal with the removed peaks
                let nHi = 0;
                let sum = 0;
                var peaksO = [];
                for (let j = signal[i].maskPattern.length - 1; j >= 0; j--) {
                    // sum += computeArea(signals[i].peaks[j]);
                    if (signal[i].maskPattern[j] === false) {
                        var peakR = signal[i].peaks.splice(j, 1)[0];
                        peaksO.push({x: peakR.x, y: peakR.intensity, width: peakR.width});
                        signal[i].mask.splice(j, 1);
                        signal[i].mask2.splice(j, 1);
                        signal[i].maskPattern.splice(j, 1);
                        signal[i].nbPeaks--;
                        // nHi += computeArea(peakR);
                    }
                }
                if (peaksO.length > 0) {
                    nHi = nHi * signals[i].integralData.value / sum;
                    signals[i].integralData.value -= nHi;
                    var peaks1 = []; //check why it happends
                    for (let j = peaksO.length - 1; j >= 0; j--) {
                        peaks1.push(peaksO[j]);
                    }
                    let newSignals = detectSignals(spectrum, peaks1, options);
                    newSignals = updateSignalIntegral(newSignals, nHi);
                    signal = signal.concat(newSignals);
                }
            }
        }

        if (options.keepNbSignals) {
            let index = choiceSignal(signal, s);
            if (index === -1) {
                s.multiplicity = 'm';
            } else {
                s = signal[index];
            }
        } else {
            s = signal;
        }
        result = result.concat(s);
    }

    return result;
}

function choiceSignal(signals, oldSignal) {
    let index = 0;
    if (signals.length > 1) {
        let totalIntensity = oldSignal.integralData.value;
        let interval = oldSignal.startX - oldSignal.stopX;
        let scores = signals.map((r) => {
            let range = Math.abs(r.startX - r.stopX) * 100 / interval;
            let offSet = 1 - Math.abs(r.delta1 - oldSignal.delta1) * 10;
            let percentInt = r.integralData.value * 100 / totalIntensity;
            return (offSet * 30 + range * 30 + percentInt * 40) / 10;
        });

        let max = 0;
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > max) {
                max = scores[i];
                index = i;
            }
        }

        if (signals[index].multiplicity === 'd') {
            let intensity = signals[index].peaks.map((a) => a.intensity);
            if (Math.abs(intensity[0] - intensity[1]) / intensity[0] > 0.1) {
                index = -1;
            }
        }
    }
    return index;
}
