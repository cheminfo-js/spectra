'use strict';

const nmrshiftdb2 = require('../data/nmrshiftdb2-13c.json');

test('nmrshiftdb2', () => {
    expect(nmrshiftdb2).toBeInstanceOf(Array);
    expect(nmrshiftdb2.length).toBe(5);
    for (const el of nmrshiftdb2) {
        let id;
        for (var i in el) {
            id = i;
            break;
        }
        const value = el[id];
        ['min', 'max', 'ncs', 'mean', 'median', 'std'].forEach((prop) => {
            expect(typeof value[prop]).toBe('number');
        });
    }

});
