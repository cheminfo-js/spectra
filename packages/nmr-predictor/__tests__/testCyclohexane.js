
const predictor = require('..');

const smile = 'C1CCCCC1';

describe('Cyclohexane prediction', function () {
  it('Expanded', function () {
    predictor.spinus(smile, { group: false }).then((prediction) => {
      expect(prediction.length).toBe(12);
    });
  });
  it('Grouped', function () {
    predictor.spinus(smile, { group: true }).then((prediction) => {
      expect(prediction[0].j.length).toBe(3); // it has 3 grouped couplings
      expect(prediction.length).toBe(1);
    });
  });
});
