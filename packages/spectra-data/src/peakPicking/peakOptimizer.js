let diagonalError = 0.05;
let tolerance = 0.05;

export default {
  clean: function(peaks, threshold) {
    let max = Number.NEGATIVE_INFINITY;
    let i;
    // double min = Double.MAX_VALUE;
    for (i = peaks.length - 1; i >= 0; i--) {
      if (Math.abs(peaks[i].z) > max) {
        max = Math.abs(peaks[i].z);
      }
    }
    max *= threshold;
    for (i = peaks.length - 1; i >= 0; i--) {
      if (Math.abs(peaks[i].z) < max) {
        peaks.splice(i, 1);
      }
    }
    return peaks;
  },

  enhanceSymmetry: function(signals) {
    let properties = initializeProperties(signals);
    let output = signals;

    // First step of the optimization: Symmetry validation
    let i, hits, index;
    let signal;
    for (i = output.length - 1; i >= 0; i--) {
      signal = output[i];
      if (signal.peaks.length > 1) {
        properties[i][1]++;
      }
      if (properties[i][0] === 1) {
        index = exist(output, properties, signal, -1, true);
        if (index >= 0) {
          properties[i][1] += 2;
          properties[index][1] += 2;
        }
      }
    }
    // Second step of the optimization: Diagonal image existence
    for (i = output.length - 1; i >= 0; i--) {
      signal = output[i];
      if (properties[i][0] === 0) {
        hits = checkCrossPeaks(output, properties, signal, true);
        properties[i][1] += hits;
        // checkCrossPeaks(output, properties, signal, false);
      }
    }

    // Now, each peak have a score between 0 and 4, we can complete the patterns which
    // contains peaks with high scores, and finally, we can remove peaks with scores 0 and 1
    let count = 0;
    for (i = output.length - 1; i >= 0; i--) {
      if (properties[i][0] !== 0 && properties[i][1] > 2) {
        count++;
        count += completeMissingIfNeeded(
          output,
          properties,
          output[i],
          properties[i],
        );
      }
      if (properties[i][1] >= 2 && properties[i][0] === 0) {
        count++;
      }
    }

    let toReturn = new Array(count);
    count--;
    for (i = output.length - 1; i >= 0; i--) {
      if (
        (properties[i][0] !== 0 && properties[i][1] > 2) ||
        (properties[i][0] === 0 && properties[i][1] > 1)
      ) {
        toReturn[count--] = output[i];
      }
    }
    return toReturn;
  },

  /**
   * This function maps the corresponding 2D signals to the given set of 1D signals
   * @param {Array} signals2D
   * @param {Array} references
   * @private
   */
  alignDimensions: function(signals2D, references) {
    // For each reference dimension
    for (let i = 0; i < references.length; i++) {
      let ref = references[i];
      if (ref) {
        alignSingleDimension(signals2D, ref);
      }
    }
  },
};

function completeMissingIfNeeded(output, properties, thisSignal, thisProp) {
  // Check for symmetry
  let index = exist(output, properties, thisSignal, -thisProp[0], true);
  let addedPeaks = 0;
  let newSignal = null;
  let tmpProp = null;
  if (index < 0) {
    // If this signal have no a symmetry image, we have to include it
    newSignal = {
      nucleusX: thisSignal.nucleusX,
      nucleusY: thisSignal.nucleusY,
    };
    newSignal.resolutionX = thisSignal.resolutionX;
    newSignal.resolutionY = thisSignal.resolutionY;
    newSignal.shiftX = thisSignal.shiftY;
    newSignal.shiftY = thisSignal.shiftX;
    newSignal.peaks = [{ x: thisSignal.shiftY, y: thisSignal.shiftX, z: 1 }];
    output.push(newSignal);
    tmpProp = [-thisProp[0], thisProp[1]];
    properties.push(tmpProp);
    addedPeaks++;
  }
  // Check for diagonal peaks
  let j, signal;
  let diagX = false;
  let diagY = false;
  for (j = output.length - 1; j >= 0; j--) {
    signal = output[j];
    if (properties[j][0] === 0) {
      if (Math.abs(signal.shiftX - thisSignal.shiftX) < diagonalError) {
        diagX = true;
      }
      if (Math.abs(signal.shiftY - thisSignal.shiftY) < diagonalError) {
        diagY = true;
      }
    }
  }
  if (diagX === false) {
    newSignal = {
      nucleusX: thisSignal.nucleusX,
      nucleusY: thisSignal.nucleusY,
    };
    newSignal.resolutionX = thisSignal.resolutionX;
    newSignal.resolutionY = thisSignal.resolutionY;
    newSignal.shiftX = thisSignal.shiftX;
    newSignal.shiftY = thisSignal.shiftX;
    newSignal.peaks = [{ x: thisSignal.shiftX, y: thisSignal.shiftX, z: 1 }];
    output.push(newSignal);
    tmpProp = [0, thisProp[1]];
    properties.push(tmpProp);
    addedPeaks++;
  }
  if (diagY === false) {
    newSignal = {
      nucleusX: thisSignal.nucleusX,
      nucleusY: thisSignal.nucleusY,
    };
    newSignal.resolutionX = thisSignal.resolutionX;
    newSignal.resolutionY = thisSignal.resolutionY;
    newSignal.shiftX = thisSignal.shiftY;
    newSignal.shiftY = thisSignal.shiftY;
    newSignal.peaks = [{ x: thisSignal.shiftY, y: thisSignal.shiftY, z: 1 }];
    output.push(newSignal);
    tmpProp = [0, thisProp[1]];
    properties.push(tmpProp);
    addedPeaks++;
  }
  return addedPeaks;
}

// Check for any diagonal peak that match this cross peak
function checkCrossPeaks(output, properties, signal, updateProperties) {
  let hits = 0;
  let shift = signal.shiftX * 4;
  let crossPeaksX = [];
  let crossPeaksY = [];
  let cross;
  for (var i = output.length - 1; i >= 0; i--) {
    cross = output[i];
    if (properties[i][0] !== 0) {
      if (Math.abs(cross.shiftX - signal.shiftX) < diagonalError) {
        hits++;
        if (updateProperties) {
          properties[i][1]++;
        }
        crossPeaksX.push(i);
        shift += cross.shiftX;
      } else {
        if (Math.abs(cross.shiftY - signal.shiftY) < diagonalError) {
          hits++;
          if (updateProperties) {
            properties[i][1]++;
          }
          crossPeaksY.push(i);
          shift += cross.shiftY;
        }
      }
    }
  }
  // Update found crossPeaks and diagonal peak
  shift /= crossPeaksX.length + crossPeaksY.length + 4;
  if (crossPeaksX.length > 0) {
    for (i = crossPeaksX.length - 1; i >= 0; i--) {
      output[crossPeaksX[i]].shiftX = shift;
    }
  }
  if (crossPeaksY.length > 0) {
    for (i = crossPeaksY.length - 1; i >= 0; i--) {
      output[crossPeaksY[i]].shiftY = shift;
    }
  }
  signal.shiftX = shift;
  signal.shiftY = shift;
  return hits;
}

function exist(output, properties, signal, type, symmetricSearch) {
  for (let i = output.length - 1; i >= 0; i--) {
    if (properties[i][0] === type) {
      if (distanceTo(signal, output[i], symmetricSearch) < tolerance) {
        if (!symmetricSearch) {
          let shiftX = (output[i].shiftX + signal.shiftX) / 2.0;
          let shiftY = (output[i].shiftY + signal.shiftY) / 2.0;
          output[i].shiftX = shiftX;
          output[i].shiftY = shiftY;
          signal.shiftX = shiftX;
          signal.shiftY = shiftY;
        } else {
          let shiftX = signal.shiftX;
          let shiftY = output[i].shiftX;
          output[i].shiftY = shiftX;
          signal.shiftY = shiftY;
        }
        return i;
      }
    }
  }
  return -1;
}
/**
 * Try to determine the position of each signal within the spectrum matrix.
 * Peaks could be of 3 types: upper diagonal, diagonal or under diagonal 1,0,-1
 * respectively.
 * @param {Array} signals
 * @return {*} A matrix containing the properties of each signal
 * @private
 */
function initializeProperties(signals) {
  let signalsProperties = new Array(signals.length);
  for (let i = signals.length - 1; i >= 0; i--) {
    signalsProperties[i] = [0, 0];
    // We check if it is a diagonal peak
    if (Math.abs(signals[i].shiftX - signals[i].shiftY) <= diagonalError) {
      signalsProperties[i][1] = 1;
      let shift = (signals[i].shiftX * 2 + signals[i].shiftY) / 3.0;
      signals[i].shiftX = shift;
      signals[i].shiftY = shift;
    } else {
      if (signals[i].shiftX - signals[i].shiftY > 0) {
        signalsProperties[i][0] = 1;
      } else {
        signalsProperties[i][0] = -1;
      }
    }
  }
  return signalsProperties;
}

/**
 * This function calculates the distance between 2 nmr signals . If toImage is true,
 * it will interchange x by y in the distance calculation for the second signal.
 * @param {object} a
 * @param {object} b
 * @param {boolean} toImage
 * @return {number}
 * @private
 */
function distanceTo(a, b, toImage) {
  if (!toImage) {
    return Math.sqrt(
      Math.pow(a.shiftX - b.shiftX, 2) + Math.pow(a.shiftY - b.shiftY, 2),
    );
  } else {
    return Math.sqrt(
      Math.pow(a.shiftX - b.shiftY, 2) + Math.pow(a.shiftY - b.shiftX, 2),
    );
  }
}

function alignSingleDimension(signals2D, references) {
  // For each 2D signal
  let center = 0;
  let width = 0;
  let i, j;
  for (i = 0; i < signals2D.length; i++) {
    let signal2D = signals2D[i];
    for (j = 0; j < references.length; j++) {
      center = (references[j].startX + references[j].stopX) / 2;
      width = Math.abs(references[j].startX - references[j].stopX) / 2;
      if (signal2D.nucleusX === references[j].nucleus) {
        // The 2D peak overlaps with the 1D signal
        if (Math.abs(signal2D.shiftX - center) <= width) {
          signal2D._highlight.push(references[j]._highlight[0]);
        }
      }
      if (signal2D.nucleusY === references[j].nucleus) {
        if (Math.abs(signal2D.shiftY - center) <= width) {
          signal2D._highlight.push(references[j]._highlight[0]);
        }
      }
    }
  }
}
