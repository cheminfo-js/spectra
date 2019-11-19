export default function histogram(opts) {
  let data = opts.data;
  let binsTemp = opts.bins;
  let i = binsTemp.length;

  let bisector = function(f) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          let mid = (lo + hi) >>> 1;
          if (f.call(a, a[mid], mid) < x) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          let mid = (lo + hi) >>> 1;
          if (x < f.call(a, a[mid], mid)) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      },
    };
  };

  let histBisector = bisector(function(d) {
    return d;
  });
  // var bisectLeft = histBisector.left;
  let bisectRight = histBisector.right;
  let bisect = bisectRight;

  let minimum = function(array, f) {
    let i = -1;
    let n = array.length;
    let a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null)) {
        a = undefined;
      }
      while (++i < n) {
        if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
      }
    }
    return a;
  };

  let maximum = function(array, f) {
    let i = -1;
    let n = array.length;
    let a, b;
    if (arguments.length === 1) {
      while (++i < n && !((a = array[i]) != null)) a = undefined;
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n && !((a = f.call(array, array[i], i)) != null)) {
        a = undefined;
      }
      while (++i < n) {
        if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
      }
    }
    return a;
  };

  function histFunctor(v) {
    return typeof v === 'function'
      ? v
      : function() {
          return v;
        };
  }

  function binsF(x) {
    if (!arguments.length) return binner;
    binner =
      typeof x === 'number'
        ? function(range) {
            return histLayoutHistogramBinFixed(range, x);
          }
        : histFunctor(x);
    return histogram;
  }

  function histLayoutHistogramBinSturges(range, values) {
    return histLayoutHistogramBinFixed(
      range,
      Math.ceil(Math.log(values.length) / Math.LN2 + 1),
    );
  }

  function histLayoutHistogramBinFixed(range, n) {
    let x = -1;
    let b = +range[0];
    let m = (range[1] - b) / n;
    let f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }

  function histLayoutHistogramRange(values) {
    return [minimum(values), maximum(values)];
  }

  let frequency = true;
  let valuer = Number;
  let ranger = histLayoutHistogramRange;
  var binner = histLayoutHistogramBinSturges;

  binsF(binsTemp);

  let bins = [];
  let values = data.map(valuer, this);
  let range2 = ranger.call(this, values, i);
  let thresholds = binner.call(this, range2, values, i);
  i = -1;
  let n = values.length;
  let m = thresholds.length - 1;
  let k = frequency ? 1 : 1 / n;
  let x, bin;

  while (++i < m) {
    bin = bins[i] = [];
    bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
    bin.y = 0;
  }

  if (m > 0) {
    i = -1;
    while (++i < n) {
      x = values[i];
      if (x >= range2[0] && x <= range2[1]) {
        bin = bins[bisect(thresholds, x, 1, m) - 1];
        bin.y += k;
        bin.push(data[i]);
      }
    }
  }

  return bins;
}
