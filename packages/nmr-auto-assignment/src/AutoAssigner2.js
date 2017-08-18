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
        this.keys = this.spinSystem.sources.getKeys();
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
                    if(source.nbAtoms <= target.integral) {
                        if(this.errorCS === 0 || source.delta === -9999999) { //Chemical shift is not a restriction
                            this.expandMap[sourceID].push(targetID);
                        } else {
                            let tmp = (target.from + target.to) / 2;
                            if(Math.abs(source.delta - tmp ) < (source.error
                                + Math.abs(target.from - target.to)) / 2 +  errorAbs)
                                this.expandMap[sourceID].push(targetID);
                        }
                    }
                });
            });
        });
    }

    getAssignments() {
        var date = new Date();
        this.timeStart = date.getTime();
        var i, j, k, nTargets, nSources;

        if (DEBUG) console.log(this.spinSystem);

        this.lowerBound = this.minScore;

        do {
            this.nSolutions = 0;
            this.nSteps = 0;
            this.solutions = new TreeSet(this.comparator);

            nTargets = this.spinSystem.nTargets;
            nSources = this.spinSystem.nSources;
            this.expandMap = this.generateExpandMap();

            this.scores =new Array(nTargets);
            let partial = new Array(nTargets);
            for (let i = 0; i < nTargets; i++) {
                this.score[i] = 1;
                partial[i] = null;
            }

            this.exploreTreeRec(this.spinSystem, nTargets - 1, nSources - 1, partial);

            this.lowerBound -= 0.1;
            if (DEBUG) console.log("Decreasing lowerBound: " + this.lowerBound);
        } while (this.solutions.isEmpty() && this.lowerBound >= 0.4);

        //Format the result
        this._formatAssignmentOutput();

        return this.solutions.elements;
    }

    freeSources(partial) {
        for(let i = 0; i < partial.length; i++)
            if(partial[i] === null)
                return i;

        return null;
    }

    //We try to assign while there is more sources to be assigned
    exploreTreeRec(system, indexSignal, indexDia, partial) {
        //If this happens, we can assign this atom group to this signal
        let sourceAddress;
        let targetAddress;
        while ((sourceAddress = this.freeSources(partial)) !== null) {
            //Force a return if the loop time is longer than the given timeout
            const d = new Date();
            if ((d.getTime() - this.timeStart) > this.timeout) {
                this.timeoutTerminated = true;
                return;
            }

            let sourceID = this.sourcesIDs[sourceAddress];
            let souce = system.sourcesConstrains[sourceID];//The 1D prediction to be assigned
            let expand = this.expandMap[sourceID];

            expand.forEach(targetID => {
                partial[sourceAddress] = targetID;
                if(this.isPlausible(partial, system.sourcesConstrains)) {
                    this.score = this.partialScore(partial, system.sourcesConstrains);
                    if (this.score > 0) {
                        //If there is no more sources or targets available, we have a solution for the assignment problem
                        if(this.freeSources(partial) === null || this.availableTargets(partial) === null) {
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
                    }
                }
            });

            //We can speed up it by checking the chemical shift first
            if (diaMask[indexDia] && this._isWithinCSRange(indexSignal, indexDia)) {
                this.nSteps++;
                const sizePartial = partial[indexSignal].length;
                //Assign the atom group to the signal
                diaMask[indexDia] = false;//Mark this atom group as used
                partial[indexSignal][sizePartial] = indexDia;//Add the atom group index to the assignment list
                signals[indexSignal] -= diaList[indexDia];//Subtract the group from signal integral
                //If this signal is completely assigned, we have to verify all the restrictions
                if (signals[indexSignal] == 0) {
                    let keySum = this._accomplishCounts(indexSignal, partial);
                    if (DEBUG) console.log("Accomplish count: " + keySum);
                    if (keySum != 0) {
                        //Verify the restrictions. A good solution should give a high score
                        this.score = this._solutionScore(partial, indexSignal, keySum);
                        if (DEBUG) console.log(this.score + " " + partial);
                        //This is a solution
                        if (this.score > 0) {
                            if (indexSignal == 0) {//We found a new solution
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
                                //Each new signal that we assign will produce a new level on the tree.
                                indexSignal--;//Lets go forward with the next signal
                                indexDia = diaList.length;
                                while (!diaMask[--indexDia]);
                                //SolutionTree newLevel = new SolutionTree(solution);
                                this.exploreTreeRec(signals, diaList, indexSignal, indexDia, diaMask, partial);
                                indexSignal++;
                            }
                        }
                    }

                }
                else {
                    //It says that the signal should be assigned by combining 2 or more signals
                    const previousIndexDia = indexDia;
                    while (indexDia > 0 && !diaMask[--indexDia]);
                    if (indexDia >= 0)
                        this.exploreTreeRec(signals, diaList, indexSignal, indexDia, diaMask, partial);
                    indexDia = previousIndexDia;
                }
                //Deallocate this atom group to try the next one.
                indexDia = partial[indexSignal].splice(sizePartial, 1);//Add the atom group index to the assignment list
                diaMask[indexDia] = true;//Mark this atom group as available
                signals[indexSignal] += diaList[indexDia];//Subtract the group from signal integral
                this.scores[indexSignal] = 1;
            }
            indexDia--;
        }
    }

    _cloneArray(data) {
        return JSON.parse(JSON.stringify(data));
    }

    _isWithinCSRange(indexSignal, indexDia) {
        if (this.spinSystem.chemicalShiftsE != null && this.spinSystem.chemicalShiftsT != null) {
            if (this.errorCS == 0)
                return true;
            var cfAtoms = this.spinSystem.chemicalShiftsT[indexDia];

            if (cfAtoms == -9999999)
                return true;
            var cfSignal = this.spinSystem.chemicalShiftsE[indexSignal];
            var error = this.spinSystem.chemicalShiftsTError[indexDia];
            if (error < Math.abs(this.errorCS))
                error = this.errorCS;

            var csError = Math.abs(this.spinSystem.signalsWidth[indexSignal] / 2.0 + Math.abs(error));
            if (Math.abs(cfSignal - cfAtoms) <= csError)
                return true;
            else
                return false;
        }
        return true;
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
        var nSignals = this.spinSystem.signalsArray.length;
        var i, j, k;
        var assignment = this.solutions.elements;
        var nSolutions = this.solutions.length;
        for (i = 0; i < nSolutions; i++) {
            var assignment = this.solutions.elements[i].assignment;
            this.solutions.elements[i].index = i + "";
            var assignmentNew = {};
            for (j = 0; j < nSignals; j++) {
                var diaIDs = assignment[j];
                var tmp = new Array(diaIDs.length);
                for (k = 0; k < diaIDs.length; k++) {
                    tmp[k] = this.spinSystem.diaIDsArray[diaIDs[k]].diaIDs[0];
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
        }
    }
}
module.exports = Assignment;