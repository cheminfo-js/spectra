/**
 * Created by acastillo on 9/26/17.
 */
function compilePredictionTable(samples, options) {
    let maxLevel = 5;//options.maxLevel;
    let algorithm = 0;
    let OCLE = options.OCLE;
    let result = {"H":[], "C":[]};
    for(let i = 0; i <= maxLevel; i++) {
        result["H"].push({});
        result["C"].push({});
    }

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
                            for(let i = 0; i < hose.length; i++) {
                                if(!db[i+1][hose[i]]) {
                                    db[i+1][hose[i]] = [];
                                }
                                db[i+1][hose[i]].push(signal.delta);
                            }
                        });
                    });
                });
            }
        });
    });

    return result;
}

module.exports = compilePredictionTable;