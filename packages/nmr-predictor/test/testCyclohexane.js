'use strict';

const predictor = require('..');

const smile = 'C1CCCCC1';

describe('Cyclohexane prediction', function () {
    it('Expanded', async function () {
        this.timeout(10000);
        const prediction = await predictor.spinus(smile, {group: false});
        prediction.length.should.equal(12);
    });
    it('Grouped', async function () {
        this.timeout(10000);
        const prediction = await predictor.spinus(smile, {group: true});
        //console.log(prediction);
        prediction[0].j.length.should.eql(0);
        prediction.length.should.equal(1);
    });
});
