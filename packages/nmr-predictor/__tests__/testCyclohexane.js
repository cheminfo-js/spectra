
require('should');
const predictor = require('..');

const smile = 'C1CCCCC1';

describe('Cyclohexane prediction', function () {
    it('Expanded', function () {
        predictor.spinus(smile, {group: false}).then(prediction => {
            prediction.length.should.equal(12);
        });

    });
    it('Grouped', function () {
        predictor.spinus(smile, {group: true}).then(prediction => {
            prediction[0].j.length.should.eql(3); //it has 3 grouped couplings
            prediction.length.should.equal(1);
        });
    });
});
