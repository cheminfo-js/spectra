const spectraData = require('..');

describe('spectra-data examples library name', function () {
  it('should return true', function () {
    var type = typeof spectraData.SD;
    expect(type).toBe('function');
  });
});

var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

describe('reduceData', function () {
  it('ascending data', function () {
    var ans = spectraData.NMR.fromXY(x, y);
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

  it('descending data', function () {
    x.reverse();
    y.reverse();

    var ans = spectraData.NMR.fromXY(x, y);
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

  it('reduce window', function () {
    var x = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var y = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    var ans = spectraData.NMR.fromXY(x, y);
    // console.log(JSON.stringify(ans));
    ans.reduceData({ from: 1, to: 5 });
    expect(ans.getYData()[0]).toBe(1);
    expect(ans.getYData()[4]).toBe(5);
  });
});
