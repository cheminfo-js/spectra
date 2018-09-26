const FS = require('fs');
const path = require('path');

const OCLE = require('openchemlib-extended');
const predictor = require('nmr-predictor');
const stats = require('./stats');


function loadFile(filename) {
  return FS.readFileSync(path.join(__dirname, filename)).toString();
}

async function start() {
  let setup = { ignoreLabile: true, levels: [6, 5, 4, 3, 2] };

  var testSet = JSON.parse(loadFile('/../data/assigned298.json'));// File.parse("/data/nmrsignal298.json");//"/Research/NMR/AutoAssign/data/cobasSimulated";
  var fastDB = JSON.parse(loadFile('/../data/h_44.json'));

  delete fastDB[5]["dkmDpDGSBYjHxHRYYmya`Hbf@A~dHBIU@"];
  delete fastDB[5]["dcLLpAePfTBNbDfVUljijii@GzP`HeT"];
  delete fastDB[5]["dev@PBBYDHRYUVfFX@JR@OzP`HeT"];
  delete fastDB[5]["dk^DPEFPfRBLbbbfbQImNZ`XB@A~dHBIU@"];
  delete fastDB[5]["dcND`BWPf\\bbbfacSAAPp@Ota@QJh"];
  delete fastDB[5]["dmtHPDBYZPR[f]FY``H@OzP`HeT"];
  delete fastDB[5]["foApB@DDDBYRYfVWqRLzj`VBHaB`G}HHADj`"];
  delete fastDB[5]["dcLD`DXIeInYyXYfiB`C~dHBIU@"];
  delete fastDB[5]["dcLD`FdIgHhhhdXSTmTa@G}HPDRj@"];
  delete fastDB[5]["dk]@`DDIgHhhhddQgSjhE@bHhC~dHBIU@"];
  delete fastDB[5]["dg]H`BjpfTfYV]Vz@`jj@C~dHBIU@"];
  delete fastDB[5]["dk\\LPAePfZhLbbbRbQ[mN@`jh`A~dHBIU@"];
  delete fastDB[5]["daF@`BBYRYWih@H@OzP`HeT"];
  delete fastDB[5]["deTH`DBYR[e[af@B@C~dHBIU@"];
  delete fastDB[5]["difD`BQ`fTfy]nfZZ@GzP`HeT"];
  delete fastDB[5]["dcm@PDdIglSHhheEBrcMMTmL@Ota@QJh"];
  delete fastDB[5]["dmN@`DBYRYUVJaff`B@@iB@bUP"];
  delete fastDB[5]["dcnH`IPIeInYYEYvXBHR@GzP`HeT"];
  delete fastDB[5]["dmu@`DXIeIe[fn`BJ`@iB@bUP"];
  delete fastDB[5]["dmuD`BFUBYRYUVih@JX@OzP`HeT"];
  delete fastDB[5]["didH`DBYR[e^FX@@@iB@bUP"];
  delete fastDB[5]["dknD`FIPfTfYnuIijXHH@iB@bUP"];
  delete fastDB[5]["do}@`BtIeIfYgWYXHJbj@C~dHBIU@"];
  delete fastDB[5]["dcOD`DHYTIgHheDeJUSSTu@G}HPDRj@"];
  delete fastDB[5]["dk^L`FHUBYRYf{TftyjZZi@GzP`HeT"];

  delete fastDB[4]["die@`BDIeIf][hH@@C~dHBIU@"];
  delete fastDB[4]["deU@pDDIfhc`aIefvF@bH@OzP`HeT"];
  delete fastDB[4]["daF@`DBYRYUJjZ@@OzP`HeT"];
  delete fastDB[4]["dmtLpAePfTBNbDfVUbjfjfPC~dHBIU@"];
  delete fastDB[4]["daD@P@fRBLbbbIMMSPARDADj`"];
  delete fastDB[4]["daDHPDBYHHR[e[iii@OzP`HeT"];
  delete fastDB[4]["dif@`BBYRYgfzB@`@iB@bUP"];
  delete fastDB[4]["dcNDPEFPfRBDfYnTffhFB@OzP`HeT"];
  delete fastDB[4]["deVDPJFPfTBDfV^JjZid@_iB@bUP"];
  delete fastDB[4]["deV@`BBYRYfya``b@C~dHBIU@"];
  delete fastDB[4]["dmu@`BhIeIfUen`HJ`@iB@bUP"];
  delete fastDB[4]["diDHPDBYZPR[fY``@OzP`HeT"];
  delete fastDB[4]["dko@`DHPfTfYeeFZjAXJHhC~dHBIU@"];
  delete fastDB[4]["daxH`DBYR[ef@@C~dHBIU@"];
  delete fastDB[4]["dieH`BY@fTfyeaffi@OzP`HeT"];
  delete fastDB[4]["didD`DXIeInYXYfi`C~dHBIU@"];
  delete fastDB[4]["deTD`FdIeIfYRZejf@OzP`HeT"];
  delete fastDB[4]["dcM@`DDIeIfYUFZjAPhb`OzP`HeT"];
  delete fastDB[4]["gOxHBIeIeZx@@C~dPHeT"];
  delete fastDB[4]["dig@`DXPf\\bbbeIjZjPA~dHBIU@"];
  delete fastDB[4]["dmNH`BdIeIf[UaeXHHd`A~dHBIU@"];
  delete fastDB[4]["difD`BXPfTfYlfiZf@GzP`HeT"];
  delete fastDB[4]["daFD`BQ`fTfyVzYi`C~dHBIU@"];
  delete fastDB[4]["dmtLPAePfZhDfYVVz@`j@C~dHBIU@"];
  delete fastDB[4]["deUDPDxYBYZ`RYYzn`BJ@A~dHBIU@"];
  delete fastDB[4]["dmM@PDxIf\\QIfVYayZZfe`C~dHBIU@"];
  delete fastDB[4]["diDH`DBYR[fY`H@OzP`HeT"];
  delete fastDB[4]["die@PJDIe@aIegJjZjPC~dHBIU@"];
  delete fastDB[4]["daE@`DXIeIeZn`B@@iB@bUP"];
  delete fastDB[4]["daF@`BBYRYUih@H@OzP`HeT"];
  delete fastDB[4]["dmN@PBBYdHRYfuXYVBBIH@_iB@bUP"];
  delete fastDB[4]["dmuD`DJUBYRYYVJiijZ@OzP`HeT"];
  delete fastDB[4]["deu@`DHIeIfUfGiijYX@iB@bUP"];
  delete fastDB[4]["dmvD`FIPfTfYnrZZfB`C~dHBIU@"];
  delete fastDB[4]["dcM@`BtIeIfYgYXHJb@C~dHBIU@"];
  delete fastDB[4]["dmwD`DHYTIeIeeXjffih@iB@bUP"];
  delete fastDB[4]["dmvL`FHUBYRYf{IijZZ@OzP`HeT"];

  delete fastDB[3]["gOxDJIeABSKFtuHG}H`QJh"];
  delete fastDB[3]["gOxDJIeABSKFtuHG}H`QJh"];
  delete fastDB[3]["gOtHEQLiLl[Ru@_tbADj`"];
  delete fastDB[3]["gOtHDQLiLl[MM@_tbADj`"];
  delete fastDB[3]["gOtHBqLiLrWRu@_tbADj`"];
  delete fastDB[3]["gOqHFIeIfRzVhC~dPHeT"];
  delete fastDB[3]["gNyHJQLiLsA@ARHDRj@"];
  delete fastDB[3]["gNxHFIeIfZjiJARHDRj@"];
  delete fastDB[3]["gNxHDIeIfZZaE_tbADj`"];
  delete fastDB[3]["gNxHBIeIfX@@OzQ@bUP"];
  delete fastDB[3]["gNxDDIfqBSKPD@_tbADj`"];
  delete fastDB[3]["gNxDDIetBSKPA@_tbADj`"];
  delete fastDB[3]["gNtHDQLiLsSTHk~dPHeT"];
  delete fastDB[3]["gNtHCQLiLs@PARHDRj@"];
  delete fastDB[3]["gGYHBaLiMtt`_tbADj`"];
  delete fastDB[3]["gGYHBaLiMts@_tbADj`"];
  delete fastDB[3]["gGXHBIeIe`@C~dPHeT"];
  delete fastDB[3]["gGQHDIeInfXC~dPHeT"];
  delete fastDB[3]["gGQHDIeInf@C~dPHeT"];
  delete fastDB[3]["gGQDDIdaBS]MHG}H`QJh"];
  delete fastDB[3]["gFxHDIeIeMih@iDBIU@"];
  delete fastDB[3]["daz@`BBYRYf```C~dHBIU@"];
  delete fastDB[3]["day@`BhIeIfZ@b@OzP`HeT"];
  delete fastDB[3]["daxHPFBYKDRYf`b@C~dHBIU@"];
  delete fastDB[3]["daxHPFBYHHRYf`b@C~dHBIU@"];
  delete fastDB[3]["daFH`FHIeIfXffih@iB@bUP"];
  delete fastDB[3]["daE@`DXIeIfXfijd@iB@bUP"];
  delete fastDB[3]["daE@`BXIeIfXfiZh@iB@bUP"];
  delete fastDB[3]["daDHPFBYHHRYfijYj@OzP`HeT"];
  delete fastDB[3]["daDH`BBYRYfIijZ@OzP`HeT"];
  delete fastDB[3]["daD@P@fVBDfYbZdJ`C~dHBIU@"];


  FS.writeFileSync(`${__dirname}/../data/h_clean.json`, JSON.stringify(fastDB));

  var convergence = false;
  try {
    predictor.setDb(fastDB, 'proton', 'proton');
    var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: setup.levels });
    console.log(error);
    /*for (let level of setup.levels) {
      console.log("Level. " + level)
      predictor.setDb(fastDB, 'proton', 'proton');
      var error = getPerformance(testSet, fastDB, { ignoreLabile: true, levels: [level] });
    }*/
  } catch (e) {
    console.log("A problem " + e)
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

  console.log(`Error: ${error.error} count: ${error.count} min: ${error.min} max: ${error.max}`);

  var data = error.hist;
  var sumHist = 0;
  for (let k = 0; k < data.length; k++) {
    sumHist += data[k].y / error.count;
    if (sumHist > 0) {
      sumHist *= 1;
    }
    console.log(`${data[k].x},${data[k].y},${data[k].y / error.count},${sumHist}`);
  }

  console.log(`Time comparing ${date.getTime() - start}`);

  return error;
}