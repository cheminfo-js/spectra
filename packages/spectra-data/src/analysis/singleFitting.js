import ML from 'ml-curve-fitting';

const LM = ML.LM;
const math = ML.algebra;

export default function singleFitting(data, pInit, opts) {
  let y = data.y === undefined ? data.data.y : data.data[0].y;
  let x = data.x === undefined ? data.data.x : data.data[0].x;

  // Get the max for normalize
  let max = y[0];
  for (var i = 1; i < y.length; i++) {
    if (y[i] > max) max = y[i];
  }

  // prepare of the data for fitting
  let xDat = math.matrix(y.length, 1);
  let yDat = math.matrix(y.length, 1);

  for (i = 0; i < xDat.length; i++) {
    xDat[i][0] = x[i];
    yDat[i][0] = y[i] / max;
  }
  // calcule z position
  xDat = zGenerator(xDat, 6.811384250474384, 4258);

  x = [];
  y = [];

  for (i = 0; i < xDat.length; i++) {
    x.push(xDat[i][0]);
    y.push(yDat[i][0]);
  }

  let weight = [
    xDat.length / math.sqrt(math.multiply(math.transpose(yDat), yDat)),
  ];

  let pMin = math.multiply(math.abs(pInit), -10);
  let pMax = math.multiply(math.abs(pInit), 10);

  let consts = []; // optional vector of constants

  let pFit = LM.optimize(
    errFunc,
    pInit,
    xDat,
    yDat,
    weight,
    -0.01,
    pMin,
    pMax,
    consts,
    opts,
  );

  pFit = pFit.p;

  let rango = [xDat[0][0], xDat[xDat.length - 1][0]];
  let t = math.matrix(100, 1);
  let ini = math.min(rango[0], rango[1]);
  let jump = math.abs(rango[0] - rango[1]) / 100;

  for (i = 0; i < 100; i++) t[i][0] = ini + jump * i;

  let yFitting = errFunc(t, pFit);

  let yFit = [];
  let xFit = [];

  for (i = 0; i < 100; i++) {
    xFit.push(t[i][0]);
    yFit.push(yFitting[i][0]);
  }
  return {
    dataProfile: { title: '', data: { x: x, y: y } },
    fittingProfile: { title: '', data: { x: xFit, y: yFit } },
    pFit: pFit,
  };
}

function errFunc(z, p) {
  let a = p[0][0];
  let b = p[1][0];
  let c = p[2][0];
  let d = p[3][0];
  let x = math.multiply(c, math.add(z, -d));
  const erfA = 0.147;
  let signOfX = math.matrix(x.length, 1);
  for (let i = 0; i < x.length; i++) {
    if (x[i][0] === 0) {
      signOfX[i][0] = 0;
    } else if (x[i][0] > 0) {
      signOfX[i][0] = 1;
    } else {
      signOfX[i][0] = -1;
    }
  }
  let potencia = math.dotMultiply(x, x);
  let onePlusA = math.add(1, math.multiply(erfA, potencia));
  let fourO = math.add(
    math.multiply(4, Math.pow(Math.PI, -1)),
    math.multiply(potencia, erfA),
  );
  let ratio = math.dotDivide(fourO, onePlusA);
  ratio = math.dotMultiply(ratio, math.multiply(-1, potencia));
  let expofun = math.multiply(-1, math.exp(ratio));
  let radical = math.sqrt(math.add(expofun, 1));
  z = math.dotMultiply(signOfX, radical);
  z = math.add(a, math.multiply(b, z));
  return z;
}

function zGenerator(x, g, gamma) {
  let z = math.multiply(x, math.inv(g * gamma));
  return z;
}
