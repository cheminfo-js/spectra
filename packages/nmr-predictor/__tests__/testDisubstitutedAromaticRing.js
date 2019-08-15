
const predictor = require('..');

const smile = 'Fc1ccc(Cl)cc1';

describe('Paradisubstitute prediction', function () {
  it('Expanded', function () {
    predictor.spinus(smile, { group: false }).then((prediction) => {
      expect(prediction.length).toBe(4);
    });
  });
  it('Grouped', function () {
    predictor.spinus(smile, { group: true }).then((prediction) => {
      expect(prediction[0].j.length).toBe(3); // it has 3 couplings
      expect(prediction.length).toBe(2);
    });
  });
});
