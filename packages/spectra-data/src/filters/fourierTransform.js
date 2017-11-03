'use strict';

const fft = require('ml-fft');

/**
 * This function make a fourier transformation to each FID withing a SD instance
 * @param {SD} spectraData - SD instance
 * @returns {SD} return SD with spectrum and FID
 */

function fourierTransform(spectraData) {
    var nbPoints = spectraData.getNbPoints();
    var nSubSpectra = spectraData.getNbSubSpectra() / 2;
    var halfNbSubSpectra = nSubSpectra / 2;
    var spectraType = nSubSpectra > 1 ? 'nD NMR SPECTRUM' : 'NMR SPECTRUM';

    var FFT = fft.FFT;
    FFT.init(nbPoints);
    var fcor = spectraData.getParamDouble('$FCOR', 0.0);

    for (var iSubSpectra = 0; iSubSpectra < nSubSpectra; iSubSpectra++) {
        var re = spectraData.getYData(2 * iSubSpectra);
        var im = spectraData.getYData(2 * iSubSpectra + 1);

        re[0] *= fcor;
        im[0] *= fcor;

        FFT.fft(re, im);
        re = re.concat(re.slice(0, (nbPoints + 1) / 2));
        re.splice(0, (nbPoints + 1) / 2);
        im = im.concat(im.slice(0, (nbPoints + 1) / 2));
        im.splice(0, (nbPoints + 1) / 2);

        spectraData.setActiveElement(2 * iSubSpectra);
        updateSpectra(spectraData, spectraType);

        spectraData.setActiveElement(2 * iSubSpectra + 1);
        updateSpectra(spectraData, spectraType);
    }
    //TODO For Alejandro
    //Now we can try to apply the FFt on the second dimension
    if (spectraData.is2D()) {
        FFT.init(halfNbSubSpectra);
        var real1Data = new Array(halfNbSubSpectra);
        var img1Data = new Array(halfNbSubSpectra);
        var real2Data = new Array(halfNbSubSpectra);
        var img2Data = new Array(halfNbSubSpectra);
        var mode = spectraData.getParam('$FNMODE');
        //this is confusing ride now
        if (mode > 0 && mode < 4) { //that means that the mode is between "States","States-TPPI","Echo-Antiecho"
            var index = 0;
            for (let i = 0; i < halfNbSubSpectra; i++) {
                real1Data[i] = spectraData.getYData(index++);
                img1Data[i] = spectraData.getYData(index++);
                real2Data[i] = spectraData.getYdata(index++);
                img2Data[i] = spectraData.getYdata(index++);
            }
            var real1ComplexData = new Array(halfNbSubSpectra);
            var img1ComplexData = new Array(halfNbSubSpectra);
            var real2ComplexData = new Array(halfNbSubSpectra);
            var img2ComplexData = new Array(halfNbSubSpectra);
            for (let iXPoint = 0; iXPoint < nbPoints; iXPoint++) {
                for (let iYPoint = 0; iYPoint < halfNbSubSpectra; iYPoint++) {
                    real1ComplexData[iYPoint] = real1Data[iYPoint][iXPoint];
                    img1ComplexData[iYPoint] = img1Data[iYPoint][iXPoint];
                    real2ComplexData[iYPoint] = real2Data[iYPoint][iXPoint];
                    img2ComplexData[iYPoint] = img2Data[iYPoint][iXPoint];
                }
                FFT.fft(real1ComplexData, img1ComplexData);
                FFT.fft(real2ComplexData, img2ComplexData);
                for (let iYPoint = 0; iYPoint < halfNbSubSpectra; iYPoint++) {
                    index = (iYPoint + halfNbSubSpectra / 2) % halfNbSubSpectra;
                    real1Data[iYPoint][iXPoint] = real1ComplexData[index] + real2ComplexData[index];
                    img1Data[iYPoint][iXPoint] = img1ComplexData[index] - img2ComplexData[index];
                    real2Data[iYPoint][iXPoint] = 0;
                    img1Data[iYPoint][iXPoint] = 0;
                }
            }
        }

        for (let iSubSpectra = 0; iSubSpectra < nSubSpectra; iSubSpectra++) {
            index = iSubSpectra * 2;
            let reTmp = spectraData.getYData(index);
            let imgTmp = spectraData.getXData(index + 1);
            [reTmp, imgTmp] = [imgTmp, reTmp];
        }
        spectraData.sd.spectra.splice(nSubSpectra);
        if ()
        updateYScale(spectraData);
    }
    spectraData.setActiveElement(0);
    return spectraData;
}

function updateSpectra(spectraData, spectraType) {
    var baseFrequency = spectraData.getParamDouble('$BF1', NaN);
    var spectralFrequency = spectraData.getParamDouble('$SFO1', NaN);
    var spectralWidth = spectraData.getParamDouble('$SW', NaN);
    var xMiddle = ((spectralFrequency - baseFrequency) / baseFrequency) * 1e6;
    var dx = 0.5 * spectralWidth * spectralFrequency / baseFrequency;

    spectraData.setDataType(spectraType);
    spectraData.setFirstX(xMiddle + dx);
    spectraData.setLastX(xMiddle - dx);
    spectraData.setXUnits('PPM');
    var x = spectraData.getXData();
    var tmp = xMiddle + dx;
    dx = -2 * dx / (x.length - 1);
    for (var i = 0; i < x.length; i++) {
        x[i] = tmp;
        tmp += dx;
    }
}

function updateYScale(spectraData) {
    var baseFrequency = spectraData.getParamDouble('$BF2', NaN);
    var spectralFrequency = spectraData.getParamDouble('$SFO2', NaN);
    var spectralWidth = spectraData.getParamDouble('$SW', NaN);
    var yMiddle = ((spectralFrequency - baseFrequency) / baseFrequency) * 1e6;
    var dy = 0.5 * spectralWidth * spectralFrequency / baseFrequency;
    spectraData.setLastY(yMiddle - dy);
    spectraData.setFirstY(yMiddle + dy);
}

module.exports = fourierTransform;
