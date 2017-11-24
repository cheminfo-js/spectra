import peaks2Ranges from './peaks2Ranges';
import {
    compilePatternFromExperimentalSignal as compile,
    detectSignals
} from 'spectra-nmr-utilities';
import updateSignalIntegral from '../../../spectra-nmr-utilities/src/updateSignalIntegral';

export default function getSignals(spectrum, range, options = {}) {
    let {
        from,
        to,
        signal
    } = range;

    options = Object.assign({}, options, {from, to, keepPeaks: true, keepNbSignals: true});

    let peaks = signal ?
        signal[0].peak ? signal[0].peak : spectrum.getPeaks(options)
        : spectrum.getPeaks(options);

    peaks = reciclePeaks(peaks);

    let signals = detectSignals(spectrum, peaks, options);

    if (option.compile) {
        signals = compile(spectrum, signals, options);
    }
    

    // signals = updateSignalIntegral(spectrum, signals, options);

    return signals;
}

function reciclePeaks(peaks) {
    if (!peaks[0].y) {
        peaks.forEach((p) => p.y = p.intensity);
    }
    return peaks;
}
