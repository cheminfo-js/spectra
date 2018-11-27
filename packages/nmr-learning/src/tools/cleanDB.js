const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');

const logger = require('../logger');
const stats = require('../stats');


function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

async function start() {
  var testSet = JSON.parse(loadFile('/../../data/assigned298.json'));// File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  var fastDB = JSON.parse(loadFile('/../../data/h_27.json'));


  let setup = { ignoreLabile: true, levels: [6, 5, 4, 3] };
  delete fastDB[3]['gOxHFIeIfRzPhC~dPHeT']; // 2.75072 3.78928 6.54
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.57944 7.26056 9.84
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.7194400000000005 7.26056 9.98
  delete fastDB[3]['gOtHDQLiLl[MM@_tbADj`']; // 4.6417399999999995 3.38826 8.03
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.699440000000001 7.26056 9.96
  delete fastDB[3]['gOtHDQLiLl[MM@_tbADj`']; // 4.661740000000001 3.38826 8.05
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.7194400000000005 7.26056 9.98
  delete fastDB[3]['dax@P@fRBDfYhHH@iB@bUP']; // 2.276589999999999 5.753410000000001 8.03
  delete fastDB[5]['dcNDPJFPfTBDfV^XjijfA@OzP`HeT']; // 6.19712 2.38288 8.58
  delete fastDB[3]['gOxDJIeABSKFtuHG}H`QJh']; // 4.93557 2.53443 7.47
  delete fastDB[3]['gNyHJQLiLsA@ARHDRj@']; // 2.5069249999999994 3.763075 6.27
  delete fastDB[3]['gOxDJIeABSKFtuHG}H`QJh']; // 4.565569999999999 2.53443 7.1
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.66944 7.26056 9.93
  delete fastDB[3]['daxHPFBYHHRYf`b@C~dHBIU@']; // 5.37351 2.04649 7.42
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.6794399999999996 7.26056 9.94
  delete fastDB[3]['gGYHBaLiMtt`_tbADj`']; // 5.644635000000001 4.155365 9.8
  delete fastDB[4]['daF@`BBYRYUih@H@OzP`HeT']; // 4.1055399999999995 3.43446 7.54
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.1476900000000008 6.56231 8.71
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.1576900000000006 6.56231 8.72
  delete fastDB[4]['daF@`BBYRYUih@H@OzP`HeT']; // 3.9655400000000003 3.43446 7.4
  delete fastDB[4]['daF@`BBYRYUih@H@OzP`HeT']; // 3.81554 3.43446 7.25
  delete fastDB[4]['deVDPJFPfTBDfV^JjZid@_iB@bUP']; // 5.6127400000000005 2.68726 8.3
  delete fastDB[3]['dax@P@fRBDfYhHH@iB@bUP']; // 3.0765899999999995 5.753410000000001 8.83
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.909800000000001 2.3302 10.24
  delete fastDB[5]['didH`DBYR[e^FX@@@iB@bUP']; // 8.52412 1.39588 9.92
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.736999999999999 2.213 9.95
  delete fastDB[4]['dieH`BE`fTfYlfiZj@GzP`HeT']; // 3.5598599999999996 2.33014 5.89
  delete fastDB[4]['dieH`BY@fTfyeaffi@OzP`HeT']; // 5.59799 4.15201 9.75
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.789440000000001 7.26056 10.05
  delete fastDB[3]['gOyHEQLiLl[Ru@_tbADj`']; // 3.8795400000000004 3.60046 7.48
  delete fastDB[4]['gOyHLaLiLj[ST`_tbADj`']; // 4.37954 3.60046 7.98
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.767 2.213 9.98
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.4597999999999995 2.3302 9.79
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.7498000000000005 2.3302 10.08
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 3.6555500000000003 3.33445 6.99
  delete fastDB[4]['difH`JHIeIfUXXHH@C~dHBIU@']; // 2.5605700000000002 4.34943 6.91
  delete fastDB[4]['daFH`DXIeIeZn`B@@iB@bUP']; // 4.817545000000001 3.332455 8.15
  delete fastDB[3]['daDHPFBYHHRYfijYj@OzP`HeT']; // 3.68511 2.64489 6.33
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.025550000000001 3.33445 7.36
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 3.83555 3.33445 7.17
  delete fastDB[3]['daE@`DXIeIfXfijd@iB@bUP']; // 2.794195 3.7558049999999996 6.55
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 9.129800000000001 2.3302 11.46
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.185549999999999 3.33445 7.52
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.4876900000000006 6.56231 9.05
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.43769 6.56231 9
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.07555 3.33445 7.41
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.195550000000001 3.33445 7.53
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.997000000000001 2.213 10.21
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.4976900000000004 6.56231 9.06
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.035550000000001 3.33445 7.37
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.26769 6.56231 8.83
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.07555 3.33445 7.41
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.34769 6.56231 8.91
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.035550000000001 3.33445 7.37
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.307689999999999 6.56231 8.87
  delete fastDB[4]['daF@`BBYRYUih@H@OzP`HeT']; // 3.93554 3.43446 7.37
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.837000000000001 2.213 10.05
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.01769 6.56231 8.58
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.01769 6.56231 8.58
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.75404 4.67404 1.92
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.75404 4.67404 1.92
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 3.0940399999999997 4.67404 1.58
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 3.0940399999999997 4.67404 1.58
  delete fastDB[4]['daFH`LPIeIeTjijd@iB@bUP']; // 5.51965 2.38035 7.9
  delete fastDB[3]['daFH`FHIeIfXffih@iB@bUP']; // 4.10448 2.27552 6.38
  delete fastDB[4]['difD`BXPfTfYlfiZj@GzP`HeT']; // 3.64144 2.35856 6
  delete fastDB[5]['deUH`BY@fTfyU[iffh@iB@bUP']; // 2.5092 7.4008 9.91
  delete fastDB[4]['daFH`LPIeIeTjijd@iB@bUP']; // 5.51965 2.38035 7.9
  delete fastDB[3]['daFH`FHIeIfXffih@iB@bUP']; // 3.71448 2.27552 5.99
  delete fastDB[5]['deTD`DDIeInUnfX@`@OzP`HeT']; // 5.850269999999999 3.84973 9.7
  delete fastDB[3]['gOxDJIeABSKFtuHG}H`QJh']; // 4.96557 2.53443 7.5
  delete fastDB[3]['dax@P@fRBDfYhHH@iB@bUP']; // 2.79659 5.753410000000001 8.55
  delete fastDB[3]['gGYHBaLiMtt`_tbADj`']; // 5.844635 4.155365 10
  delete fastDB[3]['gNxHDIeIfZZaE_tbADj`']; // 7.11403 2.39597 9.51
  delete fastDB[3]['gNxHDIeIfZZaE_tbADj`']; // 5.91403 2.39597 8.31
  delete fastDB[5]['dcm@PDdIglSHhheEBrcMMTmL@Ota@QJh']; // 5.634029999999999 2.39597 8.03
  delete fastDB[3]['gNxHDIeIfZZaE_tbADj`']; // 5.78403 2.39597 8.18
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.889800000000001 2.3302 10.22
  delete fastDB[3]['gOxHFIeIfRzPhC~dPHeT']; // 3.1707199999999998 3.78928 6.96
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.8598 2.3302 10.19
  delete fastDB[3]['gOxHFIeIfRzPhC~dPHeT']; // 3.3107199999999994 3.78928 7.1
  delete fastDB[5]['didH`DBYR[e^FX@@@iB@bUP']; // 8.32412 1.39588 9.72
  delete fastDB[4]['die@PJDIe@aIegJjZjPC~dHBIU@']; // 5.34032 1.64968 6.99
  delete fastDB[3]['gGQHDIeInfXC~dPHeT']; // 2.7694399999999995 7.26056 10.03
  delete fastDB[3]['gOtHBqLiLrWRu@_tbADj`']; // 2.6583200000000002 3.96168 6.62
  delete fastDB[3]['gGQHDIeInf@C~dPHeT']; // 7.889800000000001 2.3302 10.22
  delete fastDB[3]['gGXHBIeIe`@C~dPHeT']; // 4.285550000000001 3.33445 7.62
  delete fastDB[3]['gGXHDIeIe`@C~dPHeT']; // 2.387689999999999 6.56231 8.95
  delete fastDB[3]['gOxDJIeABSKFtuHG}H`QJh']; // 4.26557 2.53443 6.8
  delete fastDB[3]['daFH`FHIeIfXffih@iB@bUP']; // 4.51448 2.27552 6.79
  delete fastDB[3]['daFH`FHIeIfXffih@iB@bUP']; // 4.1544799999999995 2.27552 6.43
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.847 2.213 10.06
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.9270000000000005 2.213 10.14
  delete fastDB[5]['dmu@`DXIeIe[fn`BJ`@iB@bUP']; // 6.372539999999999 1.90746 8.28
  delete fastDB[4]['daF@`BBYRYUih@H@OzP`HeT']; // 3.43554 3.43446 6.87
  delete fastDB[3]['gOtHEQLiLl[Ru@_tbADj`']; // 3.8306250000000004 3.8293749999999998 7.66
  delete fastDB[3]['gGYHBaLiMtt`_tbADj`']; // 5.484635000000001 4.155365 9.64
  delete fastDB[3]['gOtHEQLiLl[Ru@_tbADj`']; // 4.350625 3.8293749999999998 8.18
  delete fastDB[3]['gNxHDIeIfZZaE_tbADj`']; // 6.94403 2.39597 9.34
  delete fastDB[3]['gNxHDIeIfZZaE_tbADj`']; // 5.714029999999999 2.39597 8.11
  delete fastDB[4]['dmuD`DJUBYRYYVJiijZ@OzP`HeT']; // 5.016920000000001 3.38308 8.4
  delete fastDB[4]['deu@`DHIeIfUfGiijYX@iB@bUP']; // 5.48358 3.36642 8.85
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.736999999999999 2.213 9.95
  delete fastDB[5]['dk^DPBFPfUBDfYnWIevZfZZ`A~dHBIU@']; // 3.2023099999999998 3.81769 7.02
  delete fastDB[5]['didH`DBYR[e^FX@@@iB@bUP']; // 8.56412 1.39588 9.96
  delete fastDB[3]['gOxDJIeABSKFtuHG}H`QJh']; // 4.895569999999999 2.53443 7.43
  delete fastDB[4]['dmuD`DJUBYRYYVJiijZ@OzP`HeT']; // 4.506919999999999 3.38308 7.89
  delete fastDB[5]['dknD`FIPfTfYnuIijXHH@iB@bUP']; // 4.43725 2.15275 6.59
  delete fastDB[4]['deVDPJFPfTBDfV^JjZid@iB@bUP']; // 5.94712 2.38288 8.33
  delete fastDB[4]['daxH`DBYR[ef@@C~dHBIU@']; // 7.757000000000001 2.213 9.97
  delete fastDB[3]['gOtHDQLiLl[MM@_tbADj`']; // 4.20174 3.38826 7.59
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.6140399999999997 4.67404 2.06
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.6140399999999997 4.67404 2.06
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.6140399999999997 4.67404 2.06
  delete fastDB[3]['gNxHFIeIfZjiJARHDRj@']; // 2.6140399999999997 4.67404 2.06
  delete fastDB[3]['daFH`FHIeIfXffih@iB@bUP']; // 4.22448 2.27552 6.5

  delete fastDB[3]['gFyHLaLiLimMHG}H`QJh']; // 4.6031200000000005 3.37688 7.98
  delete fastDB[3]['gFyHLaLiLimMHG}H`QJh']; // 4.5231200000000005 3.37688 7.9
  delete fastDB[3]['gFyHLaLiLimMHG}H`QJh']; // 4.5231200000000005 3.37688 7.9
  delete fastDB[4]['dmM@PDxIf\\QIfVYayZZfe`C~dHBIU@']; // 5.634029999999999 2.39597 8.03
  delete fastDB[4]['daE@`DXIeIeZn`B@@iB@bUP']; // 4.953939999999999 3.32606 8.28
  delete fastDB[3]['gNtHDQLiLsSTHk~dPHeT']; // 5.48358 3.36642 8.85
  delete fastDB[4]['dcnDPBFPfUBDfYnTfWYjYih@iB@bUP']; // 3.2023099999999998 3.81769 7.02
  delete fastDB[4]['dmvD`FIPfTfYnrZZfB`C~dHBIU@']; // 4.43725 2.15275 6.59

  FS.writeFileSync(`${__dirname}/../../data/h_clean.json`, JSON.stringify(fastDB));

  try {
    predictor.setDb(fastDB, 'proton', 'proton');
    getPerformance(testSet, fastDB, { ignoreLabile: true, levels: setup.levels });
    /* var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: setup.levels });
    logger(error);
     for (let level of setup.levels) {
      logger("Level. " + level);
      var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: [level] });
    }*/
  } catch (e) {
    logger(`A problem ${e}`);
  }
}

start();

async function getPerformance(testSet, fastDB, setup) {
  let date = new Date();
  let start = date.getTime();
  predictor.setDb(fastDB, 'proton', 'proton');
  // var error = comparePredictors(datasetSim,{"db":db,"dataset":testSet,"iteration":"="+iteration});
  var histParams = { from: 0, to: 1, nBins: 30 };
  var error = await stats.cmp2asg(testSet, predictor, {
    db: fastDB,
    dataset: testSet,
    ignoreLabile: setup.ignoreLabile,
    histParams: histParams,
    levels: setup.levels,
    use: 'median',
    OCLE: OCLE,
    hose: false
  });

  date = new Date();

  logger(`Error: ${error.error} count: ${error.count} min: ${error.min} max: ${error.max}`);

  var data = error.hist;
  var sumHist = 0;
  for (let k = 0; k < data.length; k++) {
    sumHist += data[k].y / error.count;
    if (sumHist > 0) {
      sumHist *= 1;
    }
    logger(`${data[k].x},${data[k].y},${data[k].y / error.count},${sumHist}`);
  }

  logger(`Time comparing ${date.getTime() - start}`);

  return error;
}
