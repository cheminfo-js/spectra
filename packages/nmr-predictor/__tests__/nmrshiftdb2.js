const nmrshiftdb2 = require('../data/nmrshiftdb.json');

test('nmrshiftdb2', () => {
    expect(nmrshiftdb2).toBeInstanceOf(Array);
    expect(nmrshiftdb2.length).toBe(6);
    expect(nmrshiftdb2[0]).toEqual({});
    expect(nmrshiftdb2[1]).toEqual({});
    let id;
    for (var i in nmrshiftdb2[2]) {
        id = i;
        break;
    }
    const value = nmrshiftdb2[2][id];
    ['min', 'max', 'ncs', 'mean', 'median', 'std', 'cs'].forEach((prop) => {
        expect(typeof value[prop]).toBe('number');
    });
});
