export default function updateSignalIntegral(signals, totalIntegral) {
    let sum = signals.reduce((a, b) => a + b.integralData.value, 0);
    let factor = totalIntegral / sum;
    return signals.map((s) => {
        s.integralData.value * factor;
        return s;
    });
}
