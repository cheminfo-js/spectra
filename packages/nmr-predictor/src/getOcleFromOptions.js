let OCLE;

export default function getOcleFromOptions(options) {
  if (OCLE) return OCLE;
  if (options.OCLE) {
    return options.OCLE;
  } else {
    return require('openchemlib-extended');
  }
}
