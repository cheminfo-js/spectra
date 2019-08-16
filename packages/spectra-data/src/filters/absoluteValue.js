export default function absoluteValue(spectrum) {
  if (spectrum.is2D()) throw TypeError('The data should be one dimensional');
  if (spectrum.getXUnits(0).toLowerCase() !== 'ppm') throw TypeError('NMR data should be in ppm');
  if (spectrum.getXUnits(1).toLowerCase() !== 'ppm') throw TypeError('The data has no imaginary part');

  let re = spectrum.getYData(0);
  let im = spectrum.getYData(1);

  let result = JSON.parse(JSON.stringify(spectrum.sd));

  result.spectra.splice(1);
  result.spectra[0].data[0].y = re.map((val, index) => {
    let imValSquare = Math.pow(im[index], 2);
    return Math.sqrt(imValSquare + val * val);
  });

  return result;
}
