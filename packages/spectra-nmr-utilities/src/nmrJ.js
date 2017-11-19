export default function nmrJ(Js, options = {}) {
    var jString = '';
    options = Object.assign({}, {separator: ', ', nbDecimal: 2}, options);
    let j, i;
    for (i = 0; i < Js.length; i++) {
        j = Js[i];
        if (j.length > 11) {
            j += options.separator;
        }
        jString += j.multiplicity + ' ' + j.coupling.toFixed(options.nbDecimal);
    }
    return jString;
}
