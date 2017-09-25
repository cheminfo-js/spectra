import acs from '../acs/acs';
import peak2Vector from './peak2Vector';
import * as GUI from '../visualizer/annotations';
import * as utils from 'spectra-nmr-utilities';
import {array as arrayUtils} from 'ml-stat';
import round from 'lodash.round';

export default class Ranges extends Array {

    constructor(ranges) {
        if (Array.isArray(ranges)) {
            super(ranges.length);
            for (let i = 0; i < ranges.length; i++) {
                this[i] = ranges[i];
            }
        } else if (typeof ranges === 'number') {
            super(ranges);
        } else {
            super();
        }
    }

    /**
     * This function return a Range instance from predictions
     * @param {object} signals - predictions of a spin system
     * @param {object} options - options object
     * @param {number} [options.lineWidth] - spectral line width
     * @param {number} [options.frequency] - frequency to determine the [from, to] of a range
     * @return {Ranges}
     */
    static fromSignals(signals, options) {
        options = Object.assign({}, {lineWidth: 1, frequency: 400, nucleus: '1H'}, options);
        //1. Collapse all the equivalent predictions

        signals = utils.group(signals, options);
        const nSignals = signals.length;
        var i, j, signal, width, center, jc;

        const result = new Array(nSignals);

        for (i = 0; i < nSignals; i++) {
            signal = signals[i];
            width = 0;
            jc = signal.j;
            if (jc) {
                for (j = 0; j < jc.length; j++) {
                    width += jc[j].coupling;
                }
            }

            width += 2 * options.lineWidth;

            width /= options.frequency;

            result[i] = {
                from: signal.delta - width,
                to: signal.delta + width,
                integral: signal.nbAtoms,
                signal: [signal]
            };
        }

        //2. Merge the overlaping ranges
        for (i = 0; i < result.length; i++) {
            center = (result[i].from + result[i].to) / 2;
            width = Math.abs(result[i].from - result[i].to);
            for (j = result.length - 1; j > i; j--) {
                //Does it overlap?
                if (Math.abs(center - (result[j].from + result[j].to) / 2)
                    <= Math.abs(width + Math.abs(result[j].from - result[j].to)) / 2) {
                    result[i].from = Math.min(result[i].from, result[j].from);
                    result[i].to = Math.max(result[i].to, result[j].to);
                    result[i].integral += result[j].integral;
                    result[j].signal.forEach(a => {
                        result[i].signal.push(a);
                    });
                    result.splice(j, 1);
                    j = result.length - 1;
                    center = (result[i].from + result[i].to) / 2;
                    width = Math.abs(result[i].from - result[i].to);
                }
            }
        }
        result.sort((a, b) => {
            return a.from - b.from;
        });
        return new Ranges(result);
    }

    /**
     * This function return Ranges instance from a SD instance
     * @param {SD} spectrum - SD instance
     * @param {object} options - options object to extractPeaks function
     * @return {Ranges}
     */
    static fromSpectrum(spectrum, options = {}) {
        return spectrum.getRanges(options);
    }


    /**
     * TODO it is the same code that updateIntegrals in Range class
     * This function normalize or scale the integral data
     * @param {object} options - object with the options
     * @param {boolean} [options.sum] - anything factor to normalize the integrals, Similar to the number of proton in the molecule for a nmr spectrum
     * @param {number} [options.factor] - Factor that multiply the intensities, if [options.sum] is defined it is override
     * @return {Ranges}
     */
    updateIntegrals(options = {}) {
        var factor = options.factor || 1;
        var i;
        if (options.sum) {
            var nH = options.sum || 1;
            var sumObserved = 0;
            for (i = 0; i < this.length; i++) {
                sumObserved += this[i].integral;
            }
            factor = nH / sumObserved;
        }
        for (i = 0; i < this.length; i++) {
            this[i].integral = round(this[i].integral * factor, 5);
        }
        return this;
    }

    /**
     * This function return the peak list as a object with x and y arrays
     * @param {bject} options - See the options parameter in {@link #peak2vector} function documentation
     * @return {object} - {x: Array, y: Array}
     */
    getVector(options) {
        if (this[0].signal[0].peak) {
            return peak2Vector(this.getPeakList(), options);
        } else {
            throw Error('This method is only for signals with peaks');
        }
    }

    /**
     * This function return the peaks of a Ranges instance into an array
     * @return {Array}
     */
    getPeakList() {
        if (this[0].signal[0].peak) {
            var peaks = [];
            for (var i = 0; i < this.length; i++) {
                var range = this[i];
                for (var j = 0; j < range.signal.length; j++) {
                    peaks = peaks.concat(range.signal[j].peak);
                }
            }
            return peaks;
        } else {
            throw Error('This method is only for signals with peaks');
        }
    }

    /**
     * This function return format for each range
     * @param {object} options - options object for toAcs function
     * @return {*}
     */
    getACS(options) {
        return acs(this, options);
    }

    getAnnotations(options) {
        return GUI.annotations1D(this, options);
    }

    ensureHighlight() {
        return GUI.ensureRangesHighlight(this);
    }


    toIndex(options = {}) {
        var index = [];
        if (options.joinCouplings) {
            this.joinCouplings(options);
        }
        for (let range of this) {
            if (Array.isArray(range.signal) && range.signal.length > 0) {
                let l = range.signal.length;
                var delta = new Array(l);
                for (let i = 0; i < l; i++) {
                    delta[i] = range.signal[i].delta;
                }
                index.push({
                    multiplicity: (l > 1) ? 'm' : (range.signal[0].multiplicity ||
                    utils.joinCoupling(range.signal[0], options.tolerance)),
                    delta: arrayUtils.arithmeticMean(delta) || (range.to + range.from) * 0.5,
                    integral: range.integral
                });
            } else {
                index.push({
                    delta: (range.to + range.from) * 0.5,
                    multiplicity: 'm'
                });
            }
        }
        return index;
    }


    /**
     * Joins coupling constants
     * @param {object} [options]
     * @param {number} [options.tolerance=0.05]
     */
    joinCouplings(options = {}) {
        this.forEach(range => {
            range.signal.forEach(signal => {
                signal.multiplicity = utils.joinCoupling(signal, options.tolerance);
            });
        });
    }

    updateMultiplicity(options = {}) {
        this.forEach(range => {
            if (range.signal) {
                let signal = range.signal;
                if (signal.length === 1) {
                    signal[0].multiplicity = utils.joinCoupling(signal[0], options.tolerance);
                } else {
                    signal.forEach(signal => signal.multiplicity = 'm');
                }
            }
        });
    }

    clone() {
        let newRanges = JSON.parse(JSON.stringify(this));
        return new Ranges(newRanges);
    }
}
