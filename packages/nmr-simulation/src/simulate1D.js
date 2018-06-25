import Matrix from 'ml-matrix';
import SparseMatrix from 'ml-sparse-matrix';
import binarySearch from 'binary-search';
import {asc as sortAsc} from 'num-sort';

import getPauli from './pauli';

const smallValue = 1e-2;

export default function simulate1d(spinSystem, options) {
    var i, j;
    var {
        lineWidth = 1,
        nbPoints = 1024,
        maxClusterSize = 10,
        output = 'y',
        frequency: frequencyMHz = 400,
        noiseFactor = 1
    } = options;

    nbPoints = Number(nbPoints);

    const from = options.from * frequencyMHz || 0;
    const to = (options.to || 10) * frequencyMHz;

    const chemicalShifts = spinSystem.chemicalShifts.slice();
    for (i = 0; i < chemicalShifts.length; i++) {
        chemicalShifts[i] = chemicalShifts[i] * frequencyMHz;
    }

    let lineWidthPoints = (nbPoints * lineWidth / Math.abs(to - from)) / 2.355;
    let lnPoints = lineWidthPoints * 20;

    const gaussianLength = lnPoints | 0;
    const gaussian = new Array(gaussianLength);
    const b = lnPoints / 2;
    const c = lineWidthPoints * lineWidthPoints * 2;
    for (i = 0; i < gaussianLength; i++) {
        gaussian[i] = 1e9 * Math.exp(-((i - b) * (i - b)) / c);
    }

    var result = options.withNoise ? [...new Array(nbPoints)].map(() => Math.random() * noiseFactor) : new Array(nbPoints).fill(0);

    const multiplicity = spinSystem.multiplicity;
    for (var h = 0; h < spinSystem.clusters.length; h++) {
        const cluster = spinSystem.clusters[h];

        var clusterFake = new Array(cluster.length);
        for (i = 0; i < cluster.length; i++) {
            clusterFake[i] = cluster[i] < 0 ? -cluster[i] - 1 : cluster[i];
        }

        var weight = 1;
        var sumI = 0;
        const frequencies = [];
        const intensities = [];
        if (cluster.length > maxClusterSize) {
            //This is a single spin, but the cluster exceeds the maxClusterSize criteria
            //we use the simple multiplicity algorithm
            //Add the central peak. It will be split with every single J coupling.
            var index = 0;
            while (cluster[index++] < 0);
            index = cluster[index - 1];
            var currentSize, jc;
            frequencies.push(-chemicalShifts[index]);
            for (i = 0; i < cluster.length; i++) {
                if (cluster[i] < 0) {
                    jc = spinSystem.couplingConstants[index][clusterFake[i]] / 2;
                    currentSize = frequencies.length;
                    for (j = 0; j < currentSize; j++) {
                        frequencies.push(frequencies[j] + jc);
                        frequencies[j] -= jc;
                    }
                }
            }

            frequencies.sort(sortAsc);
            sumI = frequencies.length;
            weight = 1;

            for (i = 0; i < sumI; i++) {
                intensities.push(1);
            }

        } else {
            const hamiltonian = getHamiltonian(
                chemicalShifts,
                spinSystem.couplingConstants,
                multiplicity,
                spinSystem.connectivity,
                clusterFake
            );

            const hamSize = hamiltonian.rows;
            const evd = new Matrix.DC.EVD(hamiltonian);
            const V = evd.eigenvectorMatrix;
            const diagB = evd.realEigenvalues;
            const assignmentMatrix = new SparseMatrix(hamSize, hamSize);
            const multLen = cluster.length;
            weight = 0;
            for (var n = 0; n < multLen; n++) {
                const L = getPauli(multiplicity[clusterFake[n]]);

                let temp = 1;
                for (j = 0; j < n; j++) {
                    temp *= multiplicity[clusterFake[j]];
                }
                const A = SparseMatrix.eye(temp);

                temp = 1;
                for (j = n + 1; j < multLen; j++) {
                    temp *= multiplicity[clusterFake[j]];
                }
                const B = SparseMatrix.eye(temp);
                const tempMat = A.kroneckerProduct(L.m).kroneckerProduct(B);
                if (cluster[n] >= 0) {
                    assignmentMatrix.add(tempMat.mul(cluster[n] + 1));
                    weight++;
                } else {
                    assignmentMatrix.add(tempMat.mul(cluster[n]));
                }
            }

            let rhoip = Matrix.zeros(hamSize, hamSize);
            assignmentMatrix.forEachNonZero((i, j, v) => {
                if (v > 0) {
                    const row = V[j];
                    for (var k = 0; k < row.length; k++) {
                        if (row[k] !== 0) {
                            rhoip.set(i, k, rhoip.get(i, k) + row[k]);
                        }
                    }
                }
                return v;
            });

            let rhoip2 = rhoip.clone();
            assignmentMatrix.forEachNonZero((i, j, v) => {
                if (v < 0) {
                    const row = V[j];
                    for (var k = 0; k < row.length; k++) {
                        if (row[k] !== 0) {
                            rhoip2.set(i, k, rhoip2.get(i, k) + row[k]);
                        }
                    }
                }
                return v;
            });

            const tV = V.transpose();
            rhoip = tV.mmul(rhoip);
            rhoip = new SparseMatrix(rhoip, {threshold: smallValue});
            triuTimesAbs(rhoip, smallValue);
            rhoip2 = tV.mmul(rhoip2);
            rhoip2 = new SparseMatrix(rhoip2, {threshold: smallValue});
            triuTimesAbs(rhoip2, smallValue);

            rhoip2.forEachNonZero((i, j, v) => {
                var val = rhoip.get(i, j);
                val = Math.min(Math.abs(val), Math.abs(v));
                val *= val;

                sumI += val;
                var valFreq = diagB[i] - diagB[j];
                var insertIn = binarySearch(frequencies, valFreq, sortAsc);
                if (insertIn < 0) {
                    frequencies.splice(-1 - insertIn, 0, valFreq);
                    intensities.splice(-1 - insertIn, 0, val);
                } else {
                    intensities[insertIn] += val;
                }
            });
        }
        const numFreq = frequencies.length;
        if (numFreq > 0) {
            weight = weight / sumI;
            const diff = lineWidth / 32;
            let valFreq = frequencies[0];
            let inte = intensities[0];
            let count = 1;
            for (i = 1; i < numFreq; i++) {
                if (Math.abs(frequencies[i] - valFreq / count) < diff) {
                    inte += intensities[i];
                    valFreq += frequencies[i];
                    count++;
                } else {
                    addPeak(result, valFreq / count, inte * weight, from, to, nbPoints, gaussian);
                    valFreq = frequencies[i];
                    inte = intensities[i];
                    count = 1;
                }
            }
            addPeak(result, valFreq / count, inte * weight, from, to, nbPoints, gaussian);
        }
    }
    if (output === 'xy') {
        return {x: _getX(options.from, options.to, nbPoints), y: result};
    }
    if (output === 'y') {
        return result;
    }
    throw new RangeError('wrong output option');
}

function addPeak(result, freq, height, from, to, nbPoints, gaussian) {
    const center = (nbPoints * (-freq - from) / (to - from)) | 0;
    const lnPoints = gaussian.length;
    var index = 0;
    var indexLorentz = 0;
    for (var i = center - lnPoints / 2; i < center + lnPoints / 2; i++) {
        index = i | 0;
        if (i >= 0 && i < nbPoints) {
            result[index] = result[index] + gaussian[indexLorentz] * height;
        }
        indexLorentz++;
    }
}

function triuTimesAbs(A, val) {
    A.forEachNonZero((i, j, v) => {
        if (i > j) return 0;
        if (Math.abs(v) <= val) return 0;
        return v;
    });
}

function getHamiltonian(chemicalShifts, couplingConstants, multiplicity, conMatrix, cluster) {
    let hamSize = 1;
    for (var i = 0; i < cluster.length; i++) {
        hamSize *= multiplicity[cluster[i]];
    }

    const clusterHam = new SparseMatrix(hamSize, hamSize);

    for (var pos = 0; pos < cluster.length; pos++) {
        var n = cluster[pos];

        const L = getPauli(multiplicity[n]);

        let A1, B1;
        let temp = 1;
        for (let i = 0; i < pos; i++) {
            temp *= multiplicity[cluster[i]];
        }
        A1 = SparseMatrix.eye(temp);

        temp = 1;
        for (let i = pos + 1; i < cluster.length; i++) {
            temp *= multiplicity[cluster[i]];
        }
        B1 = SparseMatrix.eye(temp);

        const alpha = chemicalShifts[n];
        const kronProd = A1.kroneckerProduct(L.z).kroneckerProduct(B1);
        clusterHam.add(kronProd.mul(alpha));

        for (var pos2 = 0; pos2 < cluster.length; pos2++) {
            const k = cluster[pos2];
            if (conMatrix[n][k] === 1) {
                const S = getPauli(multiplicity[k]);

                let A2, B2;
                let temp = 1;
                for (let i = 0; i < pos2; i++) {
                    temp *= multiplicity[cluster[i]];
                }
                A2 = SparseMatrix.eye(temp);

                temp = 1;
                for (let i = pos2 + 1; i < cluster.length; i++) {
                    temp *= multiplicity[cluster[i]];
                }
                B2 = SparseMatrix.eye(temp);

                const kron1 = A1.kroneckerProduct(L.x).kroneckerProduct(B1).mmul(A2.kroneckerProduct(S.x).kroneckerProduct(B2));
                kron1.add(A1.kroneckerProduct(L.y).kroneckerProduct(B1).mul(-1).mmul(A2.kroneckerProduct(S.y).kroneckerProduct(B2)));
                kron1.add(A1.kroneckerProduct(L.z).kroneckerProduct(B1).mmul(A2.kroneckerProduct(S.z).kroneckerProduct(B2)));

                clusterHam.add(kron1.mul(couplingConstants[n][k] / 2));
            }
        }
    }

    return clusterHam;
}

function _getX(from, to, nbPoints) {
    const x = new Array(nbPoints);
    const dx = (to - from) / (nbPoints - 1);
    for (var i = 0; i < nbPoints; i++) {
        x[i] = from + i * dx;
    }
    return x;
}
