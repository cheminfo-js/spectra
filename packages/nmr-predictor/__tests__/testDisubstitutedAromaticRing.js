
require('should');
const predictor = require('..');

const smile = 'Fc1ccc(Cl)cc1';

describe('Paradisubstitute prediction', function () {
  it('Expanded', function () {
    predictor.spinus(smile, { group: false }).then((prediction) => {
      prediction.length.should.equal(4);
    });
  });
  it('Grouped', function () {
    predictor.spinus(smile, { group: true }).then((prediction) => {
      prediction[0].j.length.should.eql(3); // it has 3 couplings
      prediction.length.should.equal(2);
    });
  });
});
