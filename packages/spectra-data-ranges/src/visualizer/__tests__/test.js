require('should');
import Ranges from '../../range/Ranges';

const ranges = new Ranges([
    {
        from: 1,
        to: 2
    },
    {
        from: 3,
        to: 4,
        _highlight: 'ab'
    },
    {
        from: 3,
        to: 4,
        signal: [
            {
                diaID: 'ab'
            },
            {
                diaID: 'bc'
            }
        ]
    }
]);


describe('Annotations 1D from ranges', () => {
    it('Default options', () => {
        var isChanged = ranges.ensureHighlight();
        isChanged.should.be.true();

        isChanged = ranges.ensureHighlight();
        isChanged.should.be.false();

        ranges[0]._highlight.should.be.above(0).and.below(1);
        ranges[1]._highlight.should.equal('ab');
        ranges[2]._highlight.should.eql(['ab', 'bc']);


        var annotations = ranges.getAnnotations();
        annotations.length.should.eql(ranges.length);
        annotations.forEach(annotation => {
            annotation._highlight.length.should.be.above(0).and.below(3);
        });
    });
});

