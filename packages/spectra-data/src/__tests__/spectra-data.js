const spectraData = require('..');

describe('spectra-data examples library name', function() {
  it('should return true', function() {
    let type = typeof spectraData.SD;
    expect(type).toBe('function');
  });
});

let x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
let y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('reduceData', function() {
  it('ascending data', function() {
    let ans = spectraData.NMR.fromXY(x, y);
    ans.reduceData({ from: 1, to: 3, nbPoints: 3 });
    expect(ans.getYData()[0]).toBe(1);
    expect(ans.getYData()[1]).toBe(2);
    expect(ans.getYData()[2]).toBe(3);

    ans = spectraData.NMR.fromXY(x, y, {});
    ans.reduceData({ from: 1, to: 5, nbPoints: 3 });
    expect(ans.getYData()[0]).toBe(1);
    expect(ans.getYData()[1]).toBe(3);
    expect(ans.getYData()[2]).toBe(5);
  });

  it('descending data', function() {
    x.reverse();
    y.reverse();

    let ans = spectraData.NMR.fromXY(x, y);
    ans.reduceData({ from: 1, to: 3, nbPoints: 3 });
    expect(ans.getYData()[0]).toBe(3);
    expect(ans.getYData()[1]).toBe(2);
    expect(ans.getYData()[2]).toBe(1);

    ans = spectraData.NMR.fromXY(x, y, {});
    ans.reduceData({ from: 1, to: 5, nbPoints: 3 });
    expect(ans.getYData()[0]).toBe(5);
    expect(ans.getYData()[1]).toBe(3);
    expect(ans.getYData()[2]).toBe(1);
  });

  it('reduce window', function() {
    let x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let ans = spectraData.NMR.fromXY(x, y);
    ans.reduceData({ from: 1, to: 5 });
    expect(ans.getYData()[0]).toBe(1);
    expect(ans.getYData()[4]).toBe(5);
  });
});
