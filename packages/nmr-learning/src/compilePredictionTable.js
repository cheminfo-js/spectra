/**
 * Created by acastillo on 9/26/17.
 */
const stat = require('ml-stat/array');

function compilePredictionTable(samples, options) {
    let maxLevel = 5;//options.maxLevel;
    let algorithm = 0;
    let Util = options.OCLE.Util;
    let result = {H: [], C: []};
    for (let i = 0; i <= maxLevel; i++) {
        result.H.push({});
        result.C.push({});
    }
    samples.forEach(sample => {
        let ocl = sample.general.ocl;
        sample.spectra.nmr.forEach(nmr => {
            if (nmr.experiment === '1d') {
                let db = result[nmr.nucleus];
                nmr.range.forEach(range => {
                    range.signal.forEach(signal => {
                        signal.diaID.forEach(id => {
                            let hose = Util.getHoseCodesFromDiastereotopicID(id, {
                                maxSphereSize: maxLevel,
                                type: algorithm
                            });
                            for (let i = 0; i < hose.length; i++) {
                                if (!db[i + 1][hose[i]]) {
                                    db[i + 1][hose[i]] = [];
                                }
                                db[i + 1][hose[i]].push(signal.delta);
                            }
                        });
                    });
                });
            }
        });
    });

    [result.C, result.H].forEach((db) => {
        db.forEach((hoseMap) => {
            for (const hose of Object.keys(hoseMap)) {
                hoseMap[hose] = getStats(hoseMap[hose]);
            }
        });
    });

    return result;
}

function getStats(entry) {
    const minMax = stat.minMax(entry);
    return {
        min: minMax.min,
        max: minMax.max,
        ncs: entry.length,
        mean: stat.mean(entry),
        median: stat.median(entry),
        std: stat.standardDeviation(entry, false)
    };
}

module.exports = compilePredictionTable;
