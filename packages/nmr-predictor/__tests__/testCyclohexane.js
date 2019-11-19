import * as predictor from '../src/index';

const smile = 'C1CCCCC1';

describe('Cyclohexane prediction', function() {
  it('Expanded', function() {
    predictor.spinus(smile, { group: false }).then((prediction) => {
      expect(prediction).toHaveLength(12);
    });
  });
  it('Grouped', function() {
    predictor.spinus(smile, { group: true }).then((prediction) => {
      expect(prediction[0].j).toHaveLength(3); // it has 3 grouped couplings
      expect(prediction).toHaveLength(1);
    });
  });
});
