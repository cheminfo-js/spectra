'use strict'
/**
 * Created by acastillo on 9/2/16.
 */
const TreeSet = require("ml-tree-set");

const defaultOptions = {minScore: 1, maxSolutions: 100, errorCS: -1, onlyCount: false, timeout: 20000, condensed: true};

const DEBUG = false;

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

        this.timeoutTerminated = 0;
        this.score = 0;
        this.nSolutions = 0;
        this.nSteps = 0;
        this.lowerBound = 0;

        this.solutions = null;

        this.comparator = function (a, b) {
            return b.score - a.score;
        }
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
                targetIDs.forEach(targetID => {
                    let target = this.spinSystem.targetsConstains[targetID];
                    if (source.nbAtoms - target.integral < 1) {
                        if (this.errorCS === 0 || source.delta === -9999999) { //Chemical shift is not a restriction
                            this.expandMap[sourceID].push(targetID);
                        } else {
                            let tmp = (target.from + target.to) / 2;
                            if (Math.abs(source.delta - tmp) < (source.error
                                + Math.abs(target.from - target.to)) / 2 + errorAbs)
                                this.expandMap[sourceID].push(targetID);
                        }
                    }
                });
                this.expandMap[sourceID].push("*");
            });
        });

        //console.log(this.expandMap)
    }

    getAssignments() {
        var date = new Date();
        this.timeStart = date.getTime();
        var i, j, k, nTargets, nSources;

        //if (DEBUG) console.log(this.spinSystem);

        this.lowerBound = this.minScore;

        do {
            this.nSolutions = 0;
            this.nSteps = 0;
            this.solutions = new TreeSet(this.comparator);

            nTargets = this.spinSystem.nTargets;
            nSources = this.spinSystem.nSources;
            //this.expandMap = this.generateExpandMap();
            this.scores = new Array(nSources);
            let partial = new Array(nSources);
            for (let i = 0; i < nSources; i++) {
                this.scores[i] = 1;
                partial[i] = null;
            }
            /*
            console.log(this.sourcesIDs.map(value => {
                return this.spinSystem.sourcesConstrains[value].nbAtoms + " " + this.spinSystem.sourcesConstrains[value].delta
            }));

            console.log(this.targetIDs.map(value => {
                return this.spinSystem.targetsConstains[value].signalID + " "+this.spinSystem.targetsConstains[value].integral + " " + this.spinSystem.targetsConstains[value].from
            }));*/

            this.exploreTreeRec(this.spinSystem, 0, partial);

            this.lowerBound -= 0.1;
            if (DEBUG) console.log("Decreasing lowerBound: " + this.lowerBound);
        } while (this.solutions.isEmpty() && this.lowerBound >= 0.4);

        //Format the result
        this._formatAssignmentOutput();

        return this.solutions.elements;
    }

    isPlausible(partial, sourceConstrains, sourceID, targetID) {
        if (targetID === "*")
            return true;
        return this.partialScore(partial, sourceConstrains, sourceID, targetID) > 0 ? true: false;
    }

    partialScore(partial, sourceConstrains, sourceID, targetID) {
        let partialInverse = {};
        //Get the inverse of the assignment function
        var activeDomainOnSource = [];

        partial.forEach((targetID, index) => {
            if(targetID && targetID !== "*") {
                activeDomainOnSource.push(index);
                if(!partialInverse[targetID]) {
                    partialInverse[targetID] = [this.sourcesIDs[index]];
                }
                else {
                    partialInverse[targetID].push(this.sourcesIDs[index]);
                }
            }
        });

        //Integration score
        for(let key in partialInverse) {
            let targetToSource = partialInverse[key];
            let total = targetToSource.reduce((sum, value) => {
                return sum + this.spinSystem.sourcesConstrains[value].nbAtoms;
            }, 0);
            if(Math.abs(total  - this.spinSystem.targetsConstains[key].integral) >= 1) {
                return 0;
            }
        }

        return 1;

        var activeDomainOnTarget = Object.keys(partialInverse);

        var andConstrains = {};
        for(let i = 0; i < activeDomainOnSource.length; i++) {
            let targetI = this.sourcesIDs[activeDomainOnSource[i]];
            for(let j = i + 1; j < activeDomainOnSource.length; j++) {
                let targetJ = this.sourcesIDs[activeDomainOnSource[j]];
                let sourceConstrain = this.spinSystem.sourcesConstrains[targetI + " " + targetJ];
                let keyOnTargerMap = partial[activeDomainOnSource[i]] + " " + partial[activeDomainOnSource[j]];
                let targetConstrain = this.spinSystem.targetsConstains[keyOnTargerMap];
                let value = 1;
                if(! andConstrains[keyOnTargerMap]) {
                     andConstrains[keyOnTargerMap] = value;
                } else {
                     andConstrains[keyOnTargerMap] = Math.max( andConstrains[keyOnTargerMap], value);
                }
            }
        }

        let andKeys = Object.keys(andConstrains);
        let sumAnd = 0;
        andKeys.forEach(key => {
            sumAnd += andConstrains[key];
        });

        return sumAnd / (activeDomainOnTarget.length * (activeDomainOnTarget.length + 1 ) / 2);

        /*var score = 0;
        var expLH = 0;
        if (this.spinSystem.cosyLines != null) {
            expLH++;
            score = this._cosyScore(partial, current, keySingalAsg);
        }
        if (this.spinSystem.hmbcLines != null) {
            expLH++;
            score += this._hmbcScore(partial, current, keySingalAsg);
        }
        if (this.spinSystem.chemicalShiftsT != null && this.errorCS > 0) {
            expLH++;
            score += this._chemicalShiftScore(partial, current, keySingalAsg);
        }

        if (expLH == 0) {
            expLH = 3;
            score = 3;
        }

        this.scores[current] = score / expLH;
        var sumLh = 0;
        var count = 0;
        for (var i = this.scores.length - 1; i >= 0; i--) {
            if (this.scores[i] != -1) {
                sumLh += this.scores[i];
                count++;
            }
        }

        if (sumLh < this.scores.length * this.lowerBound)
            return -sumLh / count;
        return sumLh / count;*/
    }

    scoreIntegration(partial, sourceConstrains, sourceID, targetID) {
        partial.forEach((targetID, index) => {
            if(targetID !== null) {
                let source = this.spinSystem.sourcesConstrains[this.sourcesIDs[index]];
                let target = this.spinSystem.targetsConstains[targetID];
            }
        });
    }

    //We try to assign while there is more sources to be assigned
    exploreTreeRec(system, sourceAddress, partial) {
        /*console.log(partial.map(value => {
            if(value !== null && value !== "*")
                return this.spinSystem.targetsConstains[value].integral;
            else return "*"
        }));*/
        if (sourceAddress < system.nSources) {
            //Force a return if the loop time is longer than the given timeout
            const d = new Date();
            if ((d.getTime() - this.timeStart) > this.timeout) {
                this.timeoutTerminated = true;
                return;
            }

            let sourceID = this.sourcesIDs[sourceAddress];
            let source = system.sourcesConstrains[sourceID];//The 1D prediction to be assigned
            let expand = this.expandMap[sourceID];
            //console.log(expand);
            expand.forEach(targetID => {
                //console.log("->" + targetID);
                partial[sourceAddress] = targetID;
                if (this.isPlausible(partial, system.sourcesConstrains, sourceID, targetID)) {
                    this.score = this.partialScore(partial, system.sourcesConstrains);
                    if (this.score > 0) {
                        //If there is no more sources or targets available, we have a solution for the assignment problem
                        if (sourceAddress === system.nSources - 1) {
                            console.log("Found " + JSON.stringify(partial));
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
                        }
                        else {
                            this.exploreTreeRec(system, sourceAddress + 1, partial);
                        }
                    }
                }

            });
        }
    }

    _cloneArray(data) {
        return JSON.parse(JSON.stringify(data));
    }

    _accomplishCounts(indexSignal, partial) {
        //Check the chemical shift
        var keySum = -1;
        var keySumCOSY = 1;
        var keySumHMBC = 1;
        if (this.spinSystem.cosyE != null) {
            keySumCOSY = this._accomplishCount(indexSignal, partial[indexSignal],
                this.spinSystem.cosyT, this.spinSystem.cosyE, this.spinSystem.cosyLines, true, this.MAXERRORSCOSY);
            keySum = keySumCOSY;
        }
        if (keySum != 0) {
            if (this.spinSystem.hmbcE != null) {
                keySumHMBC = this._accomplishCount(indexSignal, partial[indexSignal], this.spinSystem.hmbcT,
                    this.spinSystem.hmbcE, this.spinSystem.hmbcLines, false, MAXERRORSHMBC);
                keySum = keySumHMBC;
            }
        }
        return keySum;
    }

    /**
     * This function calculates the expected connectivity pattern each time that a experimental
     * signal is completely assigned to a set of theoretical signals. Once the new patter is calculate,
     * it verifies if this patter is potentially a candidate or not. The function stores the
     * calculated pattern in a hash-map so that each of those expensive operations is performed just once.
     * If the pattern accomplish with the count of expected and observed signals, it will return the key
     * of the patter in the hash map, or 0 in other case.
     * @param index
     * @param signals
     * @param theoretical
     * @param experimental
     * @param hashMap
     * @param isSymmetryc
     * @return
     */
    _accomplishCount(index, signals, theoretical, experimental, hashMap, isSymmetryc, maxErrors) {
        // Check the feasibility,
        let key = 0;
        // The unique key for the union of those signals

        for (let i = signals.length - 1; i >= 0; i--) {
            key |= 1 << signals[i];
            // key|=(long)Math.pow(2, signals.getInt(i));

        }
        let joint = null;
        // int nRows = theoretical.length;
        let nCols = theoretical[0].length;
        let freedom = maxErrors;// Ideally 0, but actually it is difficult to
                                // detect the 1 bond links in the HMBC
        // If this operation has been already done
        if (hashMap[key]) {
            joint = hashMap[key];
        } else {
            // Join the given columns in ss.cosyT using the mask signal
            joint = new Array(nCols);
            if (!isSymmetryc)
                freedom += nCols - experimental[0].length;
            // long tmp = signal;
            // TODO Get the parent combination from the tree map
            for (let i = signals.length - 1; i >= 0; i--) {
                if (isSymmetryc)
                    joint[signals[i]] = 2;

                for (let j = nCols - 1; j >= 0; j--) {
                    // System.out.print(theoretical[signals.getInt(i)][j]+"
                    // ");
                    joint[j] |= theoretical[signals[i]][j];
                }
                // System.out.println();
            }

            hashMap[key] = joint;
        }

        let n0 = 0, n1 = 0, e0 = 0, e1 = 0;
        for (let i = nCols - 1; i >= 0; i--) {
            if (joint[i] != 0)
                n1++;
            else
                n0++;
        }

        for (let i = experimental[0].length - 1; i >= 0; i--) {
            if (experimental[index][i] == 1)
                e1++;
            else
                e0++;
        }
        // System.out.println(index+" "+signals+" "+n0+" "+e0+" "+n1+" "+e1+"
        // "+freedom);
        if (n0 >= (e0 - freedom) && n1 >= (e1 - freedom)) {
            return key;
        }
        return key;
    }

    /**
     * This function calculates the score of a given partial assignment.
     * @param partial
     * @param current
     * @param keySingalAsg
     * @return The score of the given function.
     * @throws JSONException
     */
    _solutionScore(partial, current, keySingalAsg) {
        var score = 0;
        var expLH = 0;
        if (this.spinSystem.cosyLines != null) {
            expLH++;
            score = this._cosyScore(partial, current, keySingalAsg);
        }
        if (this.spinSystem.hmbcLines != null) {
            expLH++;
            score += this._hmbcScore(partial, current, keySingalAsg);
        }
        if (this.spinSystem.chemicalShiftsT != null && this.errorCS > 0) {
            expLH++;
            score += this._chemicalShiftScore(partial, current, keySingalAsg);
        }

        if (expLH == 0) {
            expLH = 3;
            score = 3;
        }

        this.scores[current] = score / expLH;
        var sumLh = 0;
        var count = 0;
        for (var i = this.scores.length - 1; i >= 0; i--) {
            if (this.scores[i] != -1) {
                sumLh += this.scores[i];
                count++;
            }
        }

        if (sumLh < this.scores.length * this.lowerBound)
            return -sumLh / count;
        return sumLh / count;
    }

    /**
     * This function calculates the assignment score for the chemical shift restrictions.
     * @param partial
     * @param current
     * @param keySingalAsg
     * @return
     */
    _chemicalShiftScore(partial, current, keySingalAsg) {

        if (this.errorCS <= 0)
            return 1;

        var csSignal = this.spinSystem.chemicalShiftsE[current];
        var widthSignal = this.spinSystem.signalsWidth[current] / 2.0;

        var score = 0;
        var csGroup = 0;
        var diff = 0;
        var nbGroups = 0;
        try {
            var assignedGroups = partial[current];
            for (var i = assignedGroups.length - 1; i >= 0; i--) {
                csGroup = this.spinSystem.chemicalShiftsT[assignedGroups[i]];
                if (csGroup != -9999999) {
                    nbGroups++;
                    diff = Math.abs(csSignal - csGroup);
                    if (diff <= widthSignal)
                        score += 1;
                    else {
                        diff = Math.abs(diff - widthSignal);
                        score += (-0.25 / this.errorCS) * diff + 1;
                    }
                }
            }
            if (nbGroups == 0)
                return 1.0;
            return score / nbGroups;
        } catch (e) {
            console.log("Exception in chemical shift score function " + e);
        }

        return 1;
    }

    /**
     * This function calculates the assignment score for the COSY restrictions.
     * @param partial
     * @param current
     * @param keySingalAsg
     * @return
     */
    _cosyScore(partial, current, keySingalAsg) {
        var goodness = 0;

        var cosyLine = this.spinSystem.cosyLines[keySingalAsg];

        var count1 = 0;
        var count0 = 0;
        var size = cosyLine.length - 1;

        for (var i = partial.length - 1; i >= 0; i--) {
            try {
                var signal2 = partial[i];
                if (i != current && signal2.length > 0) {
                    var key = 0;
                    //The unique key for the union of those signals
                    try {
                        for (var j = signal2.length - 1; j >= 0; j--) {
                            key |= 1 << signal2[j];
                        }
                    } catch (ex) {
                        console.log("Exception in cosy score function " + ex);
                    }

                    var cosyLine2 = this.spinSystem.cosyLines[key];
                    var crossPeak = false;
                    for (var j = size; j >= 0; j--) {
                        if (cosyLine[j] == 6 && cosyLine2[j] != 0)
                            crossPeak = true;
                    }
                    if (crossPeak)
                        count1++;
                    else
                        count0++;

                    if (this.spinSystem.cosyE[current][i] == 0 && crossPeak)
                        goodness -= 0.5;
                    if (this.spinSystem.cosyE[current][i] == 1 && !crossPeak)
                        goodness -= 0.5;
                    if (this.spinSystem.cosyE[current][i] == 1 && crossPeak)
                        goodness += 1;
                    if (this.spinSystem.cosyE[current][i] == 0 && !crossPeak)
                        goodness += 0.5;
                }
            } catch (e1) {
                console.log("Exception in cosy score function " + e1);
            }
        }
        return Math.exp(-Math.abs((count1 + count0 / 2.0) - goodness) / 2.0);
    }

    /**
     * This function calculates the assignment score for the HMBC restrictions.
     * @param partial
     * @param current
     * @param keySingalAsg
     * @return
     */
    _hmbcScore(partial, current, keySingalAsg) {
        var hmbcLine = this.spinSystem.hmbcLines[keySingalAsg];
        var sizeT = hmbcLine.length - 1;
        var sizeE = this.spinSystem.hmbcE[0].length - 1;
        var freedom = sizeT - sizeE + this.MAXERRORSHMBC;
        var crossPeaks = 0;
        for (var j = sizeT; j >= 0; j--) {
            if (hmbcLine[j] == 1)
                crossPeaks++;
        }
        for (var j = sizeE; j >= 0; j--) {
            if (this.spinSystem.hmbcE[current][j] == 1)
                crossPeaks--;
        }

        if (crossPeaks < freedom)
            crossPeaks = freedom;

        return Math.exp(-Math.abs(crossPeaks - freedom) / (sizeT + 1));
    }


    _formatAssignmentOutput(format) {
        /*var nSignals = this.spinSystem.nTargets;
        var i, j, k;
        var assignment = this.solutions.elements;
        var nSolutions = this.solutions.length;
        for (i = 0; i < nSolutions; i++) {
            var assignment = this.solutions.elements[i].assignment;
            this.solutions.elements[i].index = i + "";
            var assignmentNew = {};
            for (j = 0; j < nSignals; j++) {
                var diaIDs = assignment[j];
                var tmp = new Array(this.sourcesIDs.length);
                for (k = 0; k < this.sourcesIDs.length; k++) {
                    tmp[k] = this.sourcesIDs[k];
                }
                if (this.condensed)
                    assignmentNew[this.spinSystem.signalsArray[j].signalID] = tmp;
                else {
                    assignment[j] = {
                        signalID: this.spinSystem.signalsArray[j].signalID,
                        delta: Math.round(this.spinSystem.signalsArray[j].signal[0].delta * 100) / 100,
                        diaID: tmp
                    }
                }
            }
            if (this.condensed)
                this.solutions.elements[i].assignment = assignmentNew;
        }*/
    }
}
module.exports = Assignment;