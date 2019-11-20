import Matrix from 'ml-matrix';

let defOptions = {
  H: { frequency: 400, lineWidth: 10 },
  C: { frequency: 100, lineWidth: 10 },
};

export default function simule2DNmrSpectrum(table, options) {
  let i;
  const fromLabel = table[0].fromAtomLabel;
  const toLabel = table[0].toLabel;
  const frequencyX = options.frequencyX || defOptions[fromLabel].frequency;
  const frequencyY = options.frequencyY || defOptions[toLabel].frequency;
  let lineWidthX = options.lineWidthX || defOptions[fromLabel].lineWidth;
  let lineWidthY = options.lineWidthY || defOptions[toLabel].lineWidth;
  let symmetrize = options.symmetrize || false;

  let sigmaX = lineWidthX / frequencyX;
  let sigmaY = lineWidthY / frequencyY;

  let minX = table[0].fromChemicalShift;
  let maxX = table[0].fromChemicalShift;
  let minY = table[0].toChemicalShift;
  let maxY = table[0].toChemicalShift;
  i = 1;
  while (i < table.length) {
    minX = Math.min(minX, table[i].fromChemicalShift);
    maxX = Math.max(maxX, table[i].fromChemicalShift);
    minY = Math.min(minY, table[i].toChemicalShift);
    maxY = Math.max(maxY, table[i].toChemicalShift);
    i++;
  }

  if (options.firstX !== null && !isNaN(options.firstX)) {
    minX = options.firstX;
  }
  if (options.firstY !== null && !isNaN(options.firstY)) {
    minY = options.firstY;
  }
  if (options.lastX !== null && !isNaN(options.lastX)) {
    maxX = options.lastX;
  }
  if (options.lastY !== null && !isNaN(options.lastY)) {
    maxY = options.lastY;
  }

  let nbPointsX = options.nbPointsX || 512;
  let nbPointsY = options.nbPointsY || 512;

  let spectraMatrix = new Matrix(nbPointsY, nbPointsX).fill(0);
  i = 0;
  while (i < table.length) {
    // parameters.couplingConstant = table[i].j;
    // parameters.pathLength = table[i].pathLength;
    let peak = {
      x: unitsToArrayPoints(table[i].fromChemicalShift, minX, maxX, nbPointsX),
      y: unitsToArrayPoints(table[i].toChemicalShift, minY, maxY, nbPointsY),
      z: table[i].fromAtoms.length + table[i].toAtoms.length,
      widthX: unitsToArrayPoints(sigmaX + minX, minX, maxX, nbPointsX),
      widthY: unitsToArrayPoints(sigmaY + minY, minY, maxY, nbPointsY),
    };
    addPeak(spectraMatrix, peak);
    if (symmetrize) {
      addPeak(spectraMatrix, {
        x: peak.y,
        y: peak.x,
        z: peak.z,
        widthX: peak.widthY,
        widthY: peak.widthX,
      });
    }
    i++;
  }
  return spectraMatrix;
}

function unitsToArrayPoints(x, from, to, nbPoints) {
  return ((x - from) * (nbPoints - 1)) / (to - from);
}

function addPeak(matrix, peak) {
  let nSigma = 4;
  let fromX = Math.max(0, Math.round(peak.x - peak.widthX * nSigma));
  // var toX = Math.min(matrix[0].length - 1, Math.round(peak.x + peak.widthX * nSigma));
  let toX = Math.min(
    matrix.columns - 1,
    Math.round(peak.x + peak.widthX * nSigma),
  );
  let fromY = Math.max(0, Math.round(peak.y - peak.widthY * nSigma));
  // var toY = Math.min(matrix.length - 1, Math.round(peak.y + peak.widthY * nSigma));
  let toY = Math.min(
    matrix.rows - 1,
    Math.round(peak.y + peak.widthY * nSigma),
  );

  let squareSigmaX = peak.widthX * peak.widthX;
  let squareSigmaY = peak.widthY * peak.widthY;
  for (let j = fromY; j < toY; j++) {
    for (let i = fromX; i < toX; i++) {
      let exponent =
        Math.pow(peak.x - i, 2) / squareSigmaX +
        Math.pow(peak.y - j, 2) / squareSigmaY;
      let result = 10000 * peak.z * Math.exp(-exponent);
      // matrix[j][i] += result;
      matrix.set(j, i, matrix.get(j, i) + result);
    }
  }
}
