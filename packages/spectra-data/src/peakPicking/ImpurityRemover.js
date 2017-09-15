import impurities from './impurities';
const toCheck = ['solvent_residual_peak', 'H2O', 'TMS'];

function checkImpurity(peakList, impurity, options) {
    var j, tolerance, diference;
    var i = impurity.length;
    while (i--) {
        j = peakList.length;
        while (j--) {
            if (!peakList[j].asymmetric) {
                tolerance = options.error + peakList[j].width;
                diference = Math.abs(impurity[i].shift - peakList[j].x);
                if (diference < tolerance) { // && (impurity[i].multiplicity === '' || (impurity[i].multiplicity.indexOf(peakList[j].multiplicity)) { // some impurities has multiplicities like 'bs' but at presents it is unsupported
                    peakList.splice(j, 1);
                }
            }
        }
    }
}

export default function removeImpurities(peakList, options = {}) {
    var {
        solvent = '',
        error = 0.025
    } = options;
    solvent = solvent.toLowerCase();
    if (solvent === '(cd3)2so') solvent = 'dmso';
    var solventImpurities = impurities[solvent];
    if (solventImpurities) {
        for (let impurity of toCheck) {
            let impurityShifts = solventImpurities[impurity.toLowerCase()];
            checkImpurity(peakList, impurityShifts, {error: error});
        }
    }
    return peakList;
}
