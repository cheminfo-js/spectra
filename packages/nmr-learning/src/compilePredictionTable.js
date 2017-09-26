/**
 * Created by acastillo on 9/26/17.
 */
function compilePredictionTable(samples, options) {
    let maxLevel = 5;//options.maxLevel;
    let OCLE = options.OCLE;
    let result = {"H":[], "C":[]};

    samples.forEach(sample => {
        let ocl = sample.general.ocl;
        sample.spectra.nmr.forEach(nmr => {
            if(nmr.experiment === "1d") {
                let db = result[nmr.nucleus];
                nmr.range.forEach(range => {
                    range.signal.forEach(signal => {
                        signal.diaIDs.forEach(id => {
                            let hose = OCLE.getHoseCodesFromDiastereotopicID(id, {
                                maxSphereSize: maxLevel,
                                type: algorithm
                            });
                        })
                    });
                });
            }
        })
    });

    return result;
}

module.exports = compilePredictionTable;