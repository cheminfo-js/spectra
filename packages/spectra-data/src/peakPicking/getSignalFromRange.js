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
    //TODO merge this code into peaks2Ranges to avoid overlaped ranges.
    let signals = peaks2Ranges(spectrum, peaks, options).map((r) => r.signal[0]);
    options.compile = true;
    let result = [];
    for (let s of signals) {
        peaks = reciclePeaks(s.peak);
        let tempRanges = peaks2Ranges(spectrum, peaks, options);
        let index = choiceSignal(tempRanges, s);
        if (index === -1) {
            delete s.peak;
            s.multiplicity = 'm';
            result = result.concat(s);
        } else {
            delete tempRanges[index].peak;
            result = result.concat(tempRanges[index].signal[0]);
        }
    }
    return result;
}

function choiceSignal(ranges, oldSignal) {
    let index = 0;
    if (ranges.length > 1) {
        let totalIntensity = 0;
        let minMax = oldSignal.peak.reduce((r, val) => {
            totalIntensity += computeArea(val);
            r.min = r.min > val.x ? val.x : r.min;
            r.max = r.max < val.x ? val.x : r.max;
            return r;
        }, {max: -1000, min: 1000});

        let interval = minMax.max - minMax.min;
        let scores = ranges.map((r) => {
            let range = Math.abs(r.from - r.to) * 100 / interval;
            let offSet = 100 - Math.abs(r.signal[0].delta - oldSignal.delta) * 1000;
            let partialIntensity = r.signal[0].peak.reduce((result, p) => result + computeArea(p), 0);
            let percentInt = partialIntensity * 100 / totalIntensity;
            return (offSet * 30 + range * 30 + percentInt * 40) / 10;
        });

        let max = 0;
        for (let i = 0; i < scores.length; i++) {
            if (scores[i] > max) {
                max = scores[i];
                index = i;
            }
        }

        if (ranges[index].signal[0].multiplicity === 'd') {
            let intensity = ranges[index].signal[0].peak.map((a) => a.intensity);
            if (Math.abs(intensity[0] - intensity[1]) / intensity[0] > 0.1) {
                index = -1;
            }
        }
    }
    return index;
}

function reciclePeaks(peaks) {
    if (!peaks[0].y) {
        peaks.forEach((p) => p.y = p.intensity);
    }
    return peaks;
}

function computeArea(peak) {
    let intensity = peak.y || peak.intensity;
    return Math.abs(intensity * peak.width * 1.57); // todo add an option with this value: 1.772453851
}
