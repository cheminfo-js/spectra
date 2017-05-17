'use strict';

const predictor = require('..');

const smile = 'Fc1ccc(Cl)cc1';

describe('Paradisubstitute prediction', function () {
    it('Expanded', async function () {
        this.timeout(10000);
        const prediction = await predictor.spinus(smile, {group: false});
        //console.log(JSON.stringify(prediction));
        prediction.length.should.equal(4);
    });
    it('Grouped', async function () {
        this.timeout(10000);
        const prediction = await predictor.spinus(smile, {group: true});
        //console.log(JSON.stringify(prediction));
        prediction[0].j.length.should.eql(2);
        prediction.length.should.equal(2);
    });
});
