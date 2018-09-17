
let OCLE;

module.exports = function getOcleFromOptions(options) {
  if (OCLE) return OCLE;
  if (options.OCLE) {
    return OCLE = options.OCLE;
  } else {
    return OCLE = require('openchemlib-extended');
  }
};
