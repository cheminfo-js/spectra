export default function getSignals(pdata, maxShiftDiference) {
  let signals = [];
  let signalsTemp = [];
  if (maxShiftDiference === undefined) maxShiftDiference = 0.06;

  for (var k = 0; k < pdata[0].peakPicking.length; k++) {
    signals.push(pdata[0].peakPicking[k].signal[0].delta);
    signalsTemp.push(pdata[0].peakPicking[k].signal[0].delta);
  }

  for (let i = 0; i < pdata.length; i++) {
    // console.log("i: "+i)
    let peaks = pdata[i].peakPicking;
    for (k = 0; k < peaks.length; k++) {
      let newSignal = true;
      for (let j = 0; j < signals.length; j++) {
        if (
          Math.abs(peaks[k].signal[0].delta - signalsTemp[j]) <=
          maxShiftDiference
        ) {
          signalsTemp[j] = peaks[k].signal[0].delta;
          newSignal = false;
          j = signals.length;
        }
      }
      if (newSignal) {
        signals.push(peaks[k].signal[0].delta);
        signalsTemp.push(peaks[k].signal[0].delta);
      }
    }
  }
  return signals;
}
