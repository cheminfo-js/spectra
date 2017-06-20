'use strict';

require('should');
const predictor = require('..');

const smile = 'Fc1ccc(Cl)cc1';

describe('Paradisubstitute prediction', function () {
    it('Expanded', async function () {
        const prediction = await predictor.spinus(smile, {group: false});
        prediction.length.should.equal(4);
    });
    it('Grouped', async function () {
        const prediction = await predictor.spinus(smile, {group: true});
        prediction[0].j.length.should.eql(3); //it has 3 couplings
        prediction.length.should.equal(2);
    });
});
