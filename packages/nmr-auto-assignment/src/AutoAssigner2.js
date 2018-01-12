
/**
 * Created by acastillo on 9/2/16.
 */
const treeSet = require('ml-tree-set');

const defaultOptions = {minScore: 1, maxSolutions: 100, errorCS: -1, onlyCount: false, timeout: 6000, condensed: true, unassigned: 0};

class Assignment {
    constructor(spinSystem, opt) {
        var options = Object.assign({}, defaultOptions, opt);
        this.spinSystem = spinSystem;
        this.keys = Object.keys(this.spinSystem.sources);

        this.sourcesIDs = [];
        this.targetIDs = [];
        this.keys.forEach(key => {
            this.sourcesIDs = this.sourcesIDs.concat(this.spinSystem.sources[key]);
            this.targetIDs = this.targetIDs.concat(this.spinSystem.targets[key]);
        });

        this.minScore = options.minScore;
        this.maxSolutions = options.maxSolutions;
        this.errorCS = options.errorCS;
        this.onlyCount = options.onlyCount;
        this.timeout = options.timeout;
        this.MAXERRORSHMBC = 1;
        this.MAXERRORSCOSY = 1;
        this.condensed = options.condensed;
        this.unassigned = options.unassigned;

        this.timeoutTerminated = false;
        this.score = 0;
        this.nSolutions = 0;
        this.nSteps = 0;
        this.lowerBound = 0;

        this.solutions = null;

        this.comparator = function (a, b) {
            return b.score - a.score;
        };
        this.generateExpandMap();

    }

    /**
     * This is a very important function. It tells who can be assigned to who
     *  We will use the simplest restrictions to generate this map.
     *  We consider the integration and chemical shift restrictions
     */
    generateExpandMap() {
        this.expandMap = {};
        let errorAbs = Math.abs(this.errorCS);
        this.keys.forEach(key => {
            let sourcesIDs = this.spinSystem.sources[key];
            let targetIDs = this.spinSystem.targets[key];
            sourcesIDs.forEach(sourceID => {
                let source = this.spinSystem.sourcesConstrains[sourceID];
                source.error = Math.abs(source.error);
                this.expandMap[sourceID] = [];
                if (targetIDs) {
                    targetIDs.forEach(targetID => {
                        let target = this.spinSystem.targetsConstains[targetID];
                        if (source.atomIDs.length - target.integral < 1) {
                            if (this.errorCS === 0 || typeof source.delta === 'undefined') { //Chemical shift is not a restriction
                                this.expandMap[sourceID].push(targetID);
                            } else {
                                let tmp = (target.from + target.to) / 2;
                                let error = errorAbs;
                                if(source.error)
                                    error = Math.max(error, source.error);
                                
                                if (Math.abs(source.delta - tmp) < (error
                                    + Math.abs(target.from - target.to)) / 2 + errorAbs) {
                                    this.expandMap[sourceID].push(targetID);
                                }
                            }
                        }
                    });
                }
                this.expandMap[sourceID].push('*');
            });
        });
    }


    buildAssignments() {
        var date = new Date();
        this.timeStart = date.getTime();
        var nSources;
        this.lowerBound = this.minScore;

        //do {
            this.nSolutions = 0;
            this.nSteps = 0;
            this.solutions = new treeSet(this.comparator);

            //nTargets = this.spinSystem.nTargets;
            nSources = this.spinSystem.nSources;
            this.scores = new Array(nSources);
            let partial = new Array(nSources);
            for (let i = 0; i < nSources; i++) {
                this.scores[i] = 1;
                partial[i] = null;
            }
            /*
            console.log(this.sourcesIDs.map(value => {
                return this.spinSystem.sourcesConstrains[value].atomIDs.length + ' ' + this.spinSystem.sourcesConstrains[value].delta;
            }));

            console.log(this.targetIDs.map(value => {
                return this.spinSystem.targetsConstains[value].signalID + ' ' + this.spinSystem.targetsConstains[value].integral + ' ' + this.spinSystem.targetsConstains[value].from;
            }));*/

            this.exploreTreeRec(this.spinSystem, 0, partial);

            //this.lowerBound -= 0.1;
            // if (DEBUG) console.log('Decreasing lowerBound: ' + this.lowerBound);
        //} while (this.solutions.isEmpty() && this.lowerBound >= 0.4);

        //Format the result
        //this._formatAssignmentOutput();

        //return this.solutions.elements;
    }

    getAssignments() {
        return this.solutions.elements;
    }

    setAssignmentOnRanges(ranges, index) {
        let solution = null;
        if (typeof index === 'number') {
            if (index < this.solutions.length) {
                solution = this.solutions.elements[index];
            }
        } else {
            if (typeof index === 'object') {
                solution = index;
            }
        }
        //if(solutions === null)
        //    return -1;//Error. Index is not a valid index or assignment

        //Clean up any previous assignment
        for (let i = 0; i < ranges.length; i++) {
            ranges[i].signal.forEach(signal => {
                signal.diaID = [];
            });
        }

        if (solution !== null) {
            solution.assignment.forEach((signalId, diaIndex) => {
                let range;
                for (let i = 0; i < ranges.length; i++) {
                    if (ranges[i].signalID === signalId) {
                        range = ranges[i];
                        break;
                    }
                }
                if (range) {
                    range.signal.forEach(signal => {
                        signal.diaID.push(this.sourcesIDs[diaIndex]);
                    });
                }
            });

            return solution.score;
        }
        return 0;
    }

    setAssignmentOnSample(sample, index) {
        sample.spectra.nmr.forEach(nmr => {
            if (nmr.experiment === '1d') {
                this.setAssignmentOnRanges(nmr.range, index);
            }
        });
    }

    isPlausible(partial, sourceConstrains, sourceID, targetID) {
        if (targetID === '*') {
            return true;
        }
        return this.partialScore(partial, sourceConstrains, sourceID, targetID) > 0 ? true : false;
    }

    partialScore(partial) {
        let partialInverse = {};
        //Get the inverse of the assignment function
        let activeDomainOnSource = [];
        let countStars = 0;

        partial.forEach((targetID, index) => {
            if (targetID && targetID !== '*') {
                activeDomainOnSource.push(index);
                if (!partialInverse[targetID]) {
                    partialInverse[targetID] = [this.sourcesIDs[index]];
                } else {
                    partialInverse[targetID].push(this.sourcesIDs[index]);
                }
            }
            if (targetID === '*') {
                countStars++;                    
            }
        });

        if(countStars > this.unassigned)
            return 0;       

        let penaltyByStarts = countStars / partial.length;

        //console.log(partial)
        for (let key in partialInverse) {
            let targetToSource = partialInverse[key];
            let total = targetToSource.reduce((sum, value) => {
                return sum + this.spinSystem.sourcesConstrains[value].atomIDs.length;
            }, 0);
            //console.log(total + " " + this.spinSystem.targetsConstains[key].integral)
            if (total - this.spinSystem.targetsConstains[key].integral >= 0.5) {
                return 0;
            }
        }

        //Chemical shift score
        let chemicalShiftScore = 1;
        let count = 1;
        if (this.errorCS > 0) {
            chemicalShiftScore = 0;
            count = 0;
            partial.forEach((targetID, index) => {
                if (targetID && targetID !== '*') {
                    count++;
                    let source = this.spinSystem.sourcesConstrains[this.sourcesIDs[index]];
                    let target = this.spinSystem.targetsConstains[targetID];
                    let error = this.errorCS;
                    if(source.error)
                        error = Math.max(source.error, this.errorCS);
                    if (typeof source.delta === 'undefined') { //Chemical shift is not a restriction
                        chemicalShiftScore += 1;
                    } else {
                        let tmp = (target.from + target.to) / 2;
                        let widthSignal = Math.abs(target.from - target.to) / 2;
                        let diff = Math.abs(source.delta - tmp);
                        if (diff < widthSignal) {
                            chemicalShiftScore += 1;
                        } else {
                            diff = Math.abs(diff - widthSignal);               
                            chemicalShiftScore += (-0.25 / error) * diff + 1;
                        }
                    }
                }
            });
            if (count > 0) {
                chemicalShiftScore /= count;
            }
        }

        //Verify the 2D constrains
        let activeDomainOnTarget = Object.keys(partialInverse);
        let scoreOn2D = 0;
        if (activeDomainOnTarget.length > 1) {
            var andConstrains = {};
            for (let i = 0; i < activeDomainOnSource.length; i++) {
                let sourceI = this.sourcesIDs[activeDomainOnSource[i]];
                for (let j = i + 1; j < activeDomainOnSource.length; j++) {
                    let sourceJ = this.sourcesIDs[activeDomainOnSource[j]];
                    let sourceConstrain = this.spinSystem.sourcesConstrains[sourceI + ' ' + sourceJ];
                    let partialI = partial[activeDomainOnSource[i]];
                    let partialJ = partial[activeDomainOnSource[j]];
                    if (partialI !== partialJ) {
                        let keyOnTargerMap = partialI + ' ' + partialJ;
                        if (partialI > partialJ) {
                            keyOnTargerMap = partialJ + ' ' + partialI;
                        }

                        let targetConstrain = this.spinSystem.targetsConstains[keyOnTargerMap];
                        let value = this.verifyConstrains(sourceConstrain, targetConstrain);

                        if (!andConstrains[keyOnTargerMap]) {
                            andConstrains[keyOnTargerMap] = value;
                        } else {
                            andConstrains[keyOnTargerMap] = Math.max(andConstrains[keyOnTargerMap], value);
                        }
                    }
                }
            }

            let andKeys = Object.keys(andConstrains);
            let sumAnd = 0;
            andKeys.forEach(key => {
                sumAnd += andConstrains[key];
            });

            scoreOn2D = sumAnd / (activeDomainOnTarget.length * (activeDomainOnTarget.length - 1) / 2);
            if (chemicalShiftScore === 0) {
                return scoreOn2D - penaltyByStarts;
            }
        }
        if (scoreOn2D === 0) {
            return chemicalShiftScore - penaltyByStarts;
        }
        return (chemicalShiftScore + scoreOn2D) / 2 - penaltyByStarts;

    }

    verifyConstrains(source, target) {
        if (!source && !target) {
            return 1;
        }
        if (source && target) {
            return 1;
        }
        return 0;
    }

    scoreIntegration(partial) {
        partial.forEach((targetID) => {
            if (targetID !== null) {
                //let source = this.spinSystem.sourcesConstrains[this.sourcesIDs[index]];
                //let target = this.spinSystem.targetsConstains[targetID];
            }
        });
    }

    //We try to assign while there is more sources to be assigned
    exploreTreeRec(system, sourceAddress, partial) {
        if (sourceAddress < system.nSources) {
            //Force a return if the loop time is longer than the given timeout
            const d = new Date();
            if ((d.getTime() - this.timeStart) > this.timeout) {
                this.timeoutTerminated = true;
                return;
            }

            let sourceID = this.sourcesIDs[sourceAddress];
            //let source = system.sourcesConstrains[sourceID];//The 1D prediction to be assigned
            let expand = this.expandMap[sourceID];
            //console.log("X "+JSON.stringify(expand));
            expand.forEach(targetID => {
                partial[sourceAddress] = targetID;
                this.score = this.partialScore(partial, system.sourcesConstrains); 
                //console.log(partial)
                //console.log(this.score);
                
                    if (this.score > 0) {
                        //If there is no more sources or targets available, we have a solution for the assignment problem
                        if (sourceAddress === system.nSources - 1 && this.score >= this.minScore) {
                            //console.log(this.score + ' Found ' + JSON.stringify(partial));
                            this.nSolutions++;
                            var solution = {assignment: this._cloneArray(partial), score: this.score};
                            if (this.solutions.length >= this.maxSolutions) {
                                if (this.score > this.solutions.last().score) {
                                    this.solutions.pollLast();
                                    this.solutions.add(solution);
                                }
                            } else {
                                this.solutions.add(solution);
                            }
                        } else {
                            this.exploreTreeRec(system, sourceAddress + 1, JSON.parse(JSON.stringify(partial)));
                        }
                    } else {
                        if(targetID === "*") {
                            partial[sourceAddress] = null;
                        }

                    }
            });
        }
    }

    _cloneArray(data) {
        return JSON.parse(JSON.stringify(data));
    }
}
module.exports = Assignment;
