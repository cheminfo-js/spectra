'use strict';

require('should');
const predictor = require('..');

const smile = 'C1CCCCC1';

describe('Cyclohexane prediction', function () {
    it('Expanded', async function () {
        const prediction = await predictor.spinus(smile, {group: false});
        prediction.length.should.equal(12);
    });
    it('Grouped', async function () {
        const prediction = await predictor.spinus(smile, {group: true});
        prediction[0].j.length.should.eql(3); //it has 3 grouped couplings
        prediction.length.should.equal(1);
    });
});
