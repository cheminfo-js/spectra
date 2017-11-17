import peakPicking from './getPeaks';
import peaks2Ranges from './peaks2Ranges';

export default function getSignals(spectrum, range, options = {}) {
    let {
        from,
        to,
        signal
    } = range;

    options = Object.assign({}, options, {from, to});

    let peaks = signal ?
        signal[0].peak ? signal[0].peak : spectrum.getPeaks(options)
        : spectrum.getPeaks(options);

    peaks = reciclePeaks(peaks);

    options.compile = false;
    options.keepPeaks = true;
    //TODO create a independent method to create signals.
    let signals = peaks2Ranges(spectrum, peaks, options);
    console.log(signals);
    signals = signals.map((r) => r.signal[0]);
    options.compile = true;
    let result = [];
    for (let s of signals) {
        peaks = reciclePeaks(s.peak);
        let tempRanges = peaks2Ranges(spectrum, peaks, options);//.map((r) => r.signal[0]);
        console.log(tempRanges);
        let index = choiceSignal(tempRanges, s);
        if (index === -1) {
            s.multiplicity = 'm';
            result = result.concat(s);
        } else {
            delete tempRanges[index].peak;
            result = result.concat(tempRanges[index]);
        }
    }
    return result;
}

function choiceSignal(ranges, oldSignal) {
    let scores = ranges.map((r, i) => {
        let range = 1 - Math.abs(r.from - r.to);
        let offSet = Math.pow(r.signal[0].delta - oldSignal.delta, 2);
        return (range + offSet) / 2;
    });
    let max = 0;
    let index = -1;
    for (let i = 0; i < scores.length; i++) {
        if (scores[i] > max) {
            max = scores[i],
            index = i;
        }
    }
    console.log('scores', scores);
    return index;
}

function reciclePeaks(peaks) {
    if (!peaks[0].y) {
        peaks.forEach((p) => p.y = p.intensity);
    }
    return peaks;
}
