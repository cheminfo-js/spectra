/**
 * Created by acastillo on 9/2/16.
 */
'use strict'
const DEBUG = false;
class SpinSystem {
    constructor(spectra, predictions, opt) {
        var options = Object.assign({}, opt);
        this.spectra = spectra;
        this.predictions = predictions;
        this.init();
    }

    overlap(a, b) {
        let midA = (a.from + a.to);
        let wA = Math.abs(a.from - a.to);
        let midB = (b.from + b.to);
        let wB = Math.abs(b.from - b.to);
        if( Math.abs(midA - midB) <= wA + wB ) {
            return true;
        }
    }

    include2DConstrains(region, targetConstains, targets, nucleus) {
        let rows = [];
        //console.log(JSON.stringify(region));
        //console.log(targetsConstains[targets[nucleus[0]][0]]);
        targets[nucleus[0]].forEach(id => {
            if(this.overlap(region.fromTo[0], targetConstains[id])) {
               rows.push(id);
            }
        });

        let cols = [];
        targets[nucleus[1]].forEach(id => {
            if(this.overlap(region.fromTo[1], targetConstains[id])) {
                cols.push(id);
            }
        });

        rows.forEach(row => {
            cols.forEach(col => {
                targetConstains[row + " " + col] = region;
            });
        });
    }

    init() {
        //We cannot change the order of the elements anymore, since we'll use their indexces as keys
        //for the assignment
        this.sourcesConstrains = {};
        this.targetsConstains = {};

        this.nSources = 0;
        this.sources = {};
        this.predictions.forEach(pred => {
            if(typeof pred[0].atomLabel === "string") {
                pred.forEach(atomPred => {
                    this.sourcesConstrains[atomPred.diaIDs[0]] = atomPred;
                    if(!this.sources[atomPred.atomLabel])
                        this.sources[atomPred.atomLabel] = [atomPred.diaIDs[0]];
                    else
                        this.sources[atomPred.atomLabel].push(atomPred.diaIDs[0]);
                });
                this.nSources += pred.length;
            }
            else {
                pred.forEach(atomPred => {
                    this.sourcesConstrains[atomPred.fromDiaID + " " + atomPred.toDiaID] = atomPred;
                });
            }
        });

        this.nTargets = 0;
        this.targets = {};
        this.spectra.nmr.forEach(nmr => {
            if(nmr.experiment === "1d") {
                nmr.range.forEach(range => {
                    this.targetsConstains[range.signalID] = range;
                    if(!this.targets[nmr.nucleus])
                        this.targets[nmr.nucleus] = [range.signalID];
                    else
                        this.targets[nmr.nucleus].push(range.signalID);
                });
                this.nTargets += nmr.range.length;
            }
        });

        this.spectra.nmr.forEach(nmr => {
            if(nmr.experiment !== "1d") {
                nmr.region.forEach(region => {
                    this.include2DConstrains(region, this.targetsConstains, this.targets, nmr.nucleus);
                });
            }
        });
    }
}

module.exports = SpinSystem;