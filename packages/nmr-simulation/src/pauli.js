import SparseMatrix from 'ml-sparse-matrix';

function createPauli(mult) {
    const spin = (mult - 1) / 2;
    const prjs = new Array(mult);
    const temp = new Array(mult);
    for (var i = 0; i < mult; i++) {
        prjs[i] = (mult - 1) - i - spin;
        temp[i] = Math.sqrt(spin * (spin + 1) - prjs[i] * (prjs[i] + 1));
    }
    const p = diag(temp, 1, mult, mult);
    for (i = 0; i < mult; i++) {
        temp[i] = Math.sqrt(spin * (spin + 1) - prjs[i] * (prjs[i] - 1));
    }
    const m = diag(temp, -1, mult, mult);
    const x = p.clone().add(m).mul(0.5);
    const y = m.clone().mul(-1).add(p).mul(-0.5);
    const z = diag(prjs, 0, mult, mult);
    return {x, y, z, m, p};
}

function diag(A, d, n, m) {
    const diag = new SparseMatrix(n, m, {initialCapacity: 20});
    for (var i = 0; i < A.length; i++) {
        if ((i - d) >= 0 && (i - d) < n && i < m) {
            diag.set(i - d, i, A[i]);
        }
    }
    return diag;
}

const pauli2 = createPauli(2);

export default function getPauli(mult) {
    if (mult === 2) return pauli2;
    else return createPauli(mult);
}
