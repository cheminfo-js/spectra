import Matrix from 'ml-matrix';
import newArray from 'new-array';
import simpleClustering from 'ml-simple-clustering';
import hlClust from 'ml-hclust';

export default class SpinSystem {
  constructor(chemicalShifts, couplingConstants, multiplicity) {
    this.chemicalShifts = chemicalShifts;
    this.couplingConstants = couplingConstants;
    this.multiplicity = multiplicity;
    this.nSpins = chemicalShifts.length;
    this._initConnectivity();
    this._initClusters();
  }

  static fromSpinusPrediction(result) {
    let lines = result.split('\n');
    let nspins = lines.length - 1;
    let cs = new Array(nspins);
    let integrals = new Array(nspins);
    let ids = {};
    let jc = Matrix.zeros(nspins, nspins);
    for (let i = 0; i < nspins; i++) {
      var tokens = lines[i].split('\t');
      cs[i] = Number(tokens[2]);
      ids[tokens[0] - 1] = i;
      integrals[i] = Number(tokens[5]); // Is it always 1??
    }
    for (let i = 0; i < nspins; i++) {
      tokens = lines[i].split('\t');
      let nCoup = (tokens.length - 4) / 3;
      for (j = 0; j < nCoup; j++) {
        let withID = tokens[4 + 3 * j] - 1;
        let idx = ids[withID];
        // jc[i][idx] = +tokens[6 + 3 * j];
        jc.set(i, idx, Number(tokens[6 + 3 * j]));
      }
    }

    for (var j = 0; j < nspins; j++) {
      for (let i = j; i < nspins; i++) {
        jc.set(j, i, jc.get(i, j));
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
    let i, k, j;
    for (i = 0; i < nSpins; i++) {
      cs[i] = predictions[i].delta;
      ids[predictions[i].atomIDs[0]] = i;
    }
    for (i = 0; i < nSpins; i++) {
      cs[i] = predictions[i].delta;
      j = predictions[i].j;
      for (k = 0; k < j.length; k++) {
        // jc[ids[predictions[i].atomIDs[0]]][ids[j[k].assignment]] = j[k].coupling;
        // jc[ids[j[k].assignment]][ids[predictions[i].atomIDs[0]]] = j[k].coupling;
        jc.set(
          ids[predictions[i].atomIDs[0]],
          ids[j[k].assignment],
          j[k].coupling,
        );
        jc.set(
          ids[j[k].assignment],
          ids[predictions[i].atomIDs[0]],
          j[k].coupling,
        );
      }
      multiplicity[i] = predictions[i].integral + 1;
    }
    return new SpinSystem(cs, jc, multiplicity);
  }

  static ungroupAtoms(prediction) {
    let result = [];
    prediction.forEach((pred) => {
      let atomIDs = pred.atomIDs;
      if (atomIDs instanceof Array) {
        for (let i = 0; i < atomIDs.length; i++) {
          let tempPred = JSON.parse(JSON.stringify(pred));
          let nmrJ = [];
          tempPred.atomIDs = [atomIDs[i]];
          tempPred.integral = 1;
          if (tempPred.j instanceof Array) {
            for (let j = 0; j < tempPred.j.length; j++) {
              let assignment = tempPred.j[j].assignment;
              if (assignment instanceof Array) {
                for (let k = 0; k < assignment.length; k++) {
                  let tempJ = JSON.parse(JSON.stringify(tempPred.j[j]));
                  tempJ.assignment = assignment[k];
                  nmrJ.push(tempJ);
                }
              }
            }
          }
          tempPred.j = nmrJ;
          delete tempPred.nbAtoms;
          result.push(tempPred);
        }
      }
    });

    return result;
  }

  _initClusters() {
    this.clusters = simpleClustering(this.connectivity.to2DArray(), {
      out: 'indexes',
    });
  }

  //I am asumming that couplingConstants is a square matrix
  _initConnectivity() {
    const couplings = this.couplingConstants;
    const connectivity = Matrix.ones(couplings.rows, couplings.rows);
    for (let i = 0; i < couplings.rows; i++) {
      for (let j = i; j < couplings.columns; j++) {
        if (couplings.get(i, j) === 0) {
          connectivity.set(i, j, 0);
          connectivity.set(j, i, 0);
        }
      }
    }
    this.connectivity = connectivity;
  }

  _calculateBetas(J, frequency) {
    let betas = Matrix.zeros(J.rows, J.rows);
    // Before clustering, we must add hidden J, we could use molecular information if available
    let i, j;
    for (i = 0; i < J.rows; i++) {
      for (j = i; j < J.columns; j++) {
        let element = J.get(i, j);
        if (this.chemicalShifts[i] - this.chemicalShifts[j] !== 0) {
          let value =
            1 -
            Math.abs(
              element /
                ((this.chemicalShifts[i] - this.chemicalShifts[j]) * frequency),
            );
          betas.set(i, j, value);
          betas.set(j, i, value);
        } else if (!(i === j || element !== 0)) {
          betas.set(i, j, 1);
          betas.set(j, i, 1);
        }
      }
    }
    return betas;
  }

  ensureClusterSize(options) {
    let betas = this._calculateBetas(
      this.couplingConstants,
      options.frequency || 400,
    );
    let cluster = hlClust.agnes(betas.to2DArray(), { isDistanceMatrix: true });
    let list = [];
    this._splitCluster(cluster, list, options.maxClusterSize || 8, false);
    let clusters = this._mergeClusters(list);
    this.nClusters = clusters.rows;

    this.clusters = new Array(clusters.rows);

    for (let j = 0; j < this.nClusters; j++) {
      this.clusters[j] = [];
      for (let i = 0; i < this.nSpins; i++) {
        let element = clusters.get(j, i);
        if (element !== 0) {
          if (element < 0) {
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
      for (let child of cluster.children) {
        if (!isNaN(child.index) || child.index.length <= maxClusterSize) {
          let members = this._getMembers(child);
          // Add the neighbors that shares at least 1 coupling with the given cluster
          let count = 0;
          for (let i = 0; i < this.nSpins; i++) {
            if (members[i] === 1) {
              count++;
              for (let j = 0; j < this.nSpins; j++) {
                if (this.connectivity.get(i, j) === 1 && members[j] === 0) {
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
              // We have to threat this spin alone and use the resurrection algorithm instead of the simulation
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
    let members = new Array(this.nSpins);
    for (let i = 0; i < this.nSpins; i++) {
      members[i] = 0;
    }
    if (!isNaN(cluster.index)) {
      members[cluster.index * 1] = 1;
    } else {
      for (let index of cluster.index) {
        members[index.index * 1] = 1;
      }
    }
    return members;
  }

  _mergeClusters(list) {
    let nElements = 0;
    let clusterA, clusterB, i, j, index, common, count;
    for (i = list.length - 1; i >= 0; i--) {
      clusterA = list[i];
      nElements = clusterA.length;
      index = 0;

      // Is it a candidate to be merged?
      while (index < nElements && clusterA[index++] !== -1);

      if (index < nElements) {
        for (j = list.length - 1; j >= i + 1; j--) {
          clusterB = list[j];
          // Do they have common elements?
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
            // Then we can merge those 2 clusters
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
            // list.remove(clusterB);
            list.splice(j, 1);
            j++;
          }
        }
      }
    }

    return list;
  }
}
