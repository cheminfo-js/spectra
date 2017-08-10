'use strict';

const Matrix = require('ml-matrix');
const newArray = require('new-array');
const simpleClustering = require('ml-simple-clustering');
const hlClust = require('ml-hclust');

class SpinSystem {
    constructor(chemicalShifts, couplingConstants, multiplicity) {
        this.chemicalShifts = chemicalShifts;
        this.couplingConstants = couplingConstants;
        this.multiplicity = multiplicity;
        this.nSpins = chemicalShifts.length;
        this._initConnectivity();
        this._initClusters();
    }

    static fromSpinusPrediction(result) {
        var lines = result.split('\n');
        var nspins = lines.length - 1;
        var cs = new Array(nspins);
        var integrals = new Array(nspins);
        var ids = {};
        var jc = Matrix.zeros(nspins, nspins);
        for (let i = 0; i < nspins; i++) {
            var tokens = lines[i].split('\t');
            cs[i] = +tokens[2];
            ids[tokens[0] - 1] = i;
            integrals[i] = +tokens[5];//Is it always 1??
        }
        for (let i = 0; i < nspins; i++) {
            tokens = lines[i].split('\t');
            var nCoup = (tokens.length - 4) / 3;
            for (j = 0; j < nCoup; j++) {
                var withID = tokens[4 + 3 * j] - 1;
                var idx = ids[withID];
                jc[i][idx] = +tokens[6 + 3 * j];
            }
        }

        for (var j = 0; j < nspins; j++) {
            for (var i = j; i < nspins; i++) {
                jc[j][i] = jc[i][j];
            }
        }
        return new SpinSystem(cs, jc, newArray(nspins, 2));
    }

    static fromPrediction(input) {
        let predictions = SpinSystem.ungroupAtoms(input);
        const nSpins = predictions.length;
        const cs = new Array(nSpins);
        const jc = Matrix.zeros(nSpins, nSpins);
        const multiplicity = new Array(nSpins);
        const ids = {};
        var i, k, j;
        for (i = 0; i < nSpins; i++) {
            cs[i] = predictions[i].delta;
            ids[predictions[i].atomIDs[0]] = i;
        }
        for (i = 0; i < nSpins; i++) {
            cs[i] = predictions[i].delta;
            j = predictions[i].j;
            for (k = 0; k < j.length; k++) {
                jc[ids[predictions[i].atomIDs[0]]][ids[j[k].assignment]] = j[k].coupling;
                jc[ids[j[k].assignment]][ids[predictions[i].atomIDs[0]]] = j[k].coupling;
            }
            multiplicity[i] = predictions[i].integral + 1;
        }

        return new SpinSystem(cs, jc, multiplicity);
    }


    static ungroupAtoms(prediction) {
        let result = [];
        prediction.forEach(pred => {
            let atomIDs = pred.atomIDs;
            for (let i = 0; i < atomIDs.length; i++) {
                let tempPred = JSON.parse(JSON.stringify(pred));
                let nmrJ = [];
                tempPred.atomIDs = [atomIDs[i]];
                tempPred.integral = 1;
                for (let j = 0; j < tempPred.j.length; j++) {
                    let assignment = tempPred.j[j].assignment;
                    for (let k = 0; k < assignment.length; k++) {
                        let tempJ = JSON.parse(JSON.stringify(tempPred.j[j]));
                        tempJ.assignment = assignment[k];
                        nmrJ.push(tempJ);
                    }
                }
                tempPred.j = nmrJ;
                delete tempPred.nbAtoms;
                result.push(tempPred);
            }
        });

        return result;
    }


    _initClusters() {
        this.clusters = simpleClustering(this.connectivity, {out: 'indexes'});
    }

    _initConnectivity() {
        const couplings = this.couplingConstants;
        const connectivity = Matrix.ones(couplings.length, couplings.length);
        for (var i = 0; i < couplings.length; i++) {
            for (var j = i; j < couplings[i].length; j++) {
                if (couplings[i][j] === 0) {
                    connectivity[i][j] = 0;
                    connectivity[j][i] = 0;
                }
            }
        }
        this.connectivity = connectivity;
    }


    _calculateBetas(J, frequency) {
        var betas = Matrix.zeros(J.length, J.length);
        //Before clustering, we must add hidden J, we could use molecular information if available
        var i, j;
        for (i = 0; i < J.rows; i++) {
            for (j = i; j < J.columns; j++) {
                if ((this.chemicalShifts[i] - this.chemicalShifts[j]) !== 0) {
                    betas[i][j] = 1 - Math.abs(J[i][j] / ((this.chemicalShifts[i] - this.chemicalShifts[j]) * frequency));
                    betas[j][i] = betas[i][j];
                } else if (!(i === j || J[i][j] !== 0)) {
                    betas[i][j] = 1;
                    betas[j][i] = 1;
                }
            }
        }
        return betas;
    }

    ensureClusterSize(options) {
        var betas = this._calculateBetas(this.couplingConstants, options.frequency || 400);
        var cluster = hlClust.agnes(betas, {isDistanceMatrix: true});
        var list = [];
        this._splitCluster(cluster, list, options.maxClusterSize || 8, false);
        var clusters = this._mergeClusters(list);
        this.nClusters = clusters.length;
        //console.log(clusters);
        this.clusters = new Array(clusters.length);
        //System.out.println(this.conmatrix);
        for (var j = 0; j < this.nClusters; j++) {
            this.clusters[j] = [];
            for (var i = 0; i < this.nSpins; i++) {
                if (clusters[j][i] !== 0) {
                    if (clusters[j][i] < 0) {
                        this.clusters[j].push(-(i + 1));
                    } else {
                        this.clusters[j].push(i);
                    }
                }
            }
        }
    }

    /**
     * Recursively split the clusters until the maxClusterSize criteria has been ensured.
     * @param {Array} cluster
     * @param {Array} clusterList
     * @param {number} maxClusterSize
     * @param  {boolean} force
     */
    _splitCluster(cluster, clusterList, maxClusterSize, force) {
        if (!force && cluster.index.length <= maxClusterSize) {
            clusterList.push(this._getMembers(cluster));
        } else {
            for (var child of cluster.children) {
                if (!isNaN(child.index) || child.index.length <= maxClusterSize) {
                    var members = this._getMembers(child);
                    //Add the neighbors that shares at least 1 coupling with the given cluster
                    var count = 0;
                    for (var i = 0; i < this.nSpins; i++) {
                        if (members[i] === 1) {
                            count++;
                            for (var j = 0; j < this.nSpins; j++) {
                                if (this.connectivity[i][j] === 1 && members[j] === 0) {
                                    members[j] = -1;
                                    count++;
                                }
                            }
                        }
                    }

                    if (count <= maxClusterSize) {
                        clusterList.push(members);
                    } else {
                        if (isNaN(child.index)) {
                            this._splitCluster(child, clusterList, maxClusterSize, true);
                        } else {
                            //We have to threat this spin alone and use the resurrection algorithm instead of the simulation
                            members[child.index] = 2;
                            clusterList.push(members);
                        }
                    }
                } else {
                    this._splitCluster(child, clusterList, maxClusterSize, false);
                }
            }
        }
    }
    /**
     * Recursively gets the cluster members
     * @param cluster
     * @param members
     */

    _getMembers(cluster) {
        var members = new Array(this.nSpins);
        for (var i = 0; i < this.nSpins; i++) {
            members[i] = 0;
        }
        if (!isNaN(cluster.index)) {
            members[cluster.index * 1] = 1;
        } else {
            for (var index of cluster.index) {
                members[index.index * 1] = 1;
            }
        }
        return members;
    }

    _mergeClusters(list) {
        var nElements = 0;
        var clusterA, clusterB, i, j, index, common, count;
        for (i = list.length - 1; i >= 0; i--) {
            clusterA = list[i];
            nElements = clusterA.length;
            index = 0;

            //Is it a candidate to be merged?
            while (index < nElements && clusterA[index++] !== -1);

            if (index < nElements) {
                for (j = list.length - 1; j >= i + 1; j--) {
                    clusterB = list[j];
                    //Do they have common elements?
                    index = 0;
                    common = 0;
                    count = 0;
                    while (index < nElements) {
                        if (clusterA[index] * clusterB[index] === -1) {
                            common++;
                        }
                        if (clusterA[index] !== 0 || clusterB[index] !== 0) {
                            count++;
                        }
                        index++;
                    }

                    if (common > 0 && count <= this.maxClusterSize) {
                        //Then we can merge those 2 clusters
                        index = 0;
                        while (index < nElements) {
                            if (clusterB[index] === 1) {
                                clusterA[index] = 1;
                            } else {
                                if (clusterB[index] === -1 && clusterA[index] !== 1) {
                                    clusterA[index] = -1;
                                }
                            }
                            index++;
                        }
                        //list.remove(clusterB);
                        list.splice(j, 1);
                        j++;
                    }
                }
            }
        }

        return list;
    }
}

module.exports = SpinSystem;
