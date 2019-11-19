import * as predictor from '../src/index';

const smile = 'Fc1ccc(Cl)cc1';

describe('Paradisubstitute prediction', function() {
  it('Expanded', function() {
    predictor.spinus(smile, { group: false }).then((prediction) => {
      expect(prediction).toHaveLength(4);
    });
  });
  it('Grouped', function() {
    predictor.spinus(smile, { group: true }).then((prediction) => {
      expect(prediction[0].j).toHaveLength(3); // it has 3 couplings
      expect(prediction).toHaveLength(2);
    });
  });
});
