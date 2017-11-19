const patterns = ['s', 'd', 't', 'q', 'quint', 'h', 'sept', 'o', 'n'];
export default function compilePattern(signal, tolerance = 0.05) {
    var jc = signal.j;
    var pattern = '';
    if (jc && jc.length > 0) {
        var cont = jc[0].assignment ? jc[0].assignment.length : 0;
        jc.sort(function (a, b) {
            return b.coupling - a.coupling;
        });
        for (var i = 0; i < jc.length - 1; i++) {
            if (Math.abs(jc[i].coupling - jc[i + 1].coupling) < tolerance) {
                cont += jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
            } else {
                pattern += patterns[cont];
                cont = jc[i + 1].assignment ? jc[i + 1].assignment.length : 1;
            }
        }
        pattern += patterns[cont];
    } else if (signal.delta) {
        pattern = 's';
    } else {
        pattern = 'm';
    }
    return pattern;
}
