let OCLE;

export default function getOcleFromOptions(options) {
  if (OCLE) return OCLE;
  if (options.OCLE) {
    OCLE = options.OCLE;
    return OCLE;
  } else {
    OCLE = require('openchemlib-extended');
    return OCLE;
  }
}
