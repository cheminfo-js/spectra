
require('should');
const Data = require('..');
const fs = require('fs');

function createSpectraData(filename) {
    return Data.NMR.fromJcamp(
        fs.readFileSync(__dirname + filename).toString()
    );
}

describe('spectra-data examples ethylvinylether/1h.jdx', () => {
    var spectrum;
    beforeEach(() => {
        spectrum = createSpectraData('/../../../../data-test/ethylvinylether/1h.jdx');
    });

    it('getNucleus', () => {
        spectrum.getNucleus().should.equal('1H');
    });

    it('getSolventName', () => {
        spectrum.getSolventName().should.equal('DMSO');
    });

    it('getFirstX', () => {
        spectrum.getFirstX().should.equal(11.00659);
    });

    it('getLastX', () => {
        spectrum.getLastX().should.equal(-1.009276326659311);
    });

    it('getFirstY', () => {
        spectrum.getFirstY().should.equal(-119886);
    });

    it('getLastY', () => {
        spectrum.getLastY().should.equal(-109159);
    });

    it('getTitle', () => {
        spectrum.getTitle().should.equal('109-92-2');
    });

    it('Checking X array', () => {
        var x = spectrum.getXData();
        x.should.be.instanceof(Array).and.have.lengthOf(16384);
        x[0].should.equal(11.00659);
    });

    it('Checking Y array', () => {
        var y = spectrum.getYData();
        y.should.be.instanceof(Array).and.have.lengthOf(16384);
        y[0].should.equal(-119886);
    });

    it('Checking XY array', () => {
        var xy = spectrum.getXYData();
        xy.should.be.instanceof(Array).and.have.lengthOf(2);
        xy[0].should.be.instanceof(Array).and.have.lengthOf(16384);
        xy[1].should.be.instanceof(Array).and.have.lengthOf(16384);
        xy[0][0].should.equal(11.00659);
        xy[1][0].should.equal(-119886);
    });

    it('Checking if is2D is false', () => {
        spectrum.is2D().should.equal(false);
    });

    it('Check peak-picking', () => {
        var peakPicking = spectrum.getRanges({nH: 8, realTop: true, thresholdFactor: 1, clean: 0.5, compile: true, idPrefix: '1H', keepPeaks: true, keepNbSignals: true});
        peakPicking[0].signal[0].peak.length.should.equal(4);
    });

    it('Check peak-picking in zone', () => {
        var peakPicking = spectrum.getRanges({nH: 8, realTop: true, thresholdFactor: 1, clean: 0.5, compile: true, idPrefix: '1H', from: 1, to: 2, keepNbSignals: true});
        peakPicking.length.should.eql(1);
        peakPicking[0].signal[0].multiplicity.should.eql('t');
    });

    it('getVector', () => {
        spectrum.getVector({from: 0, to: 10, nbPoints: 4 * 1024}).length.should.equal(4 * 1024);
    });

    it('updateIntegrals', () => {
        var nH = 8;
        var ranges = spectrum.getRanges({nH: nH, realTop: true, thresholdFactor: 1, clean: 0.5, compile: true, idPrefix: '1H'});
        ranges[0].to = 6.47;
        var integral0 = ranges[0].integral;
        spectrum.updateIntegrals(ranges, {nH: nH});
        ranges[0].integral.should.approximately(integral0 / 2, integral0 / nH);
    });
});
