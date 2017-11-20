import JAnalyzer from './jAnalyzer';
import computeArea from './computeArea';
import detectSignals from './detectSignals';

export default function (spectrum, signal, options) {
    var nHi, sum;
    var nH = options.nH;
    let signals = [JSON.parse(JSON.stringify(signal))];
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
                signals = signals.concat(detectSignals(spectrum, peaks1, options));
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

    if (options.keepNbSignals) {
        let index = choiceSignal(signals, signal);
        if (index === -1) {
            signal.multiplicity = 'm';
        } else {
            signal = signals[index];
        }
    } else {
        signal = signals;
    }

    return signal;
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
            console.log(signals[index])
            let intensity = signals[index].peaks.map((a) => a.intensity);
            if (Math.abs(intensity[0] - intensity[1]) / intensity[0] > 0.1) {
                index = -1;
            }
        }
    }
    return index;
}
