var options1D = {type: 'rect', line: 0, lineLabel: 1, labelColor: 'red', strokeColor: 'red', strokeWidth: '1px', fillColor: 'green', width: 0.05, height: 10, toFixed: 1, maxLines: Number.MAX_VALUE, selectable: true, fromToc: false};
var options2D = {type: 'rect', labelColor: 'red', strokeColor: 'red', strokeWidth: '1px', fillColor: 'green', width: '6px', height: '6px'};

function annotations1D(ranges, optionsG) {
    var options = Object.assign({}, options1D, optionsG);
    var height = options.height;
    var annotations = [];

    for (var i = 0; i < ranges.length; i++) {
        var index = ranges[i];
        var annotation = {};

        annotations.push(annotation);
        annotation.line = options.line;
        annotation._highlight = index._highlight;

        if (options.fromToc) {
            let line = options.line < options.maxLines ? options.line : options.maxLines - 1;
            annotation._highlight = [options.line];
            annotation.position = [{x: index.delta - options.width, y: (line * height) + 'px'},
                {x: index.delta + options.width, y: (line * height + 3) + 'px'}];
        } else {
            if (!annotation._highlight || annotation._highlight.length === 0) {
                annotation._highlight = [index.signalID];
                index.signal.forEach(function (signal) {
                    if (signal.diaID) {
                        for (let j = 0; j < signal.diaID.length; j++) {
                            annotation._highlight.push(signal.diaID[j]);
                        }
                    }
                });
            }
            if (!index.to || !index.from || index.to === index.from) {
                annotation.position = [{x: index.signal[0].delta - options.width, y: (options.line * height) + 'px'},
                    {x: index.signal[0].delta + options.width, y: (options.line * height + 3) + 'px'}];
            } else {
                annotation.position = [{x: index.to, y: (options.line * height) + 'px'},
                    {x: index.from, y: (options.line * height + 3) + 'px'}];
            }
        }

        index._highlight = annotation._highlight;

        annotation.type = options.type;

        if (!options.noLabel && index.integral) {
            annotation.label = {
                text: index.integral.toFixed(options.toFixed),
                size: '11px',
                anchor: 'middle',
                color: options.labelColor,
                position: {x: (annotation.position[0].x + annotation.position[1].x) / 2,
                    y: ((options.line + options.lineLabel) * height) + 'px', dy: '5px'}
            };
        }

        annotation.selectable = options.selectable;
        annotation.strokeColor = options.strokeColor;
        annotation.strokeWidth = options.strokeWidth;
        annotation.fillColor = options.fillColor;
        annotation.info = index;
    }
    return annotations;
}

function annotations2D(zones, optionsG) {
    var options = Object.assign({}, options2D, optionsG);
    var annotations = [];
    for (var k = zones.length - 1; k >= 0; k--) {
        var signal = zones[k];
        var annotation = {};
        annotation.type = options.type;
        annotation._highlight = signal._highlight;//["cosy"+k];
        if (!annotation._highlight || annotation._highlight.length === 0) {
            annotation._highlight = [signal.signalID];
        }
        signal._highlight = annotation._highlight;

        annotation.position = [{x: signal.fromTo[0].from - 0.01, y: signal.fromTo[1].from - 0.01, dx: options.width, dy: options.height},
            {x: signal.fromTo[0].to + 0.01, y: signal.fromTo[1].to + 0.01}];
        annotation.fillColor = options.fillColor;
        annotation.label = {text: signal.remark,
            position: {
                x: signal.signal[0].delta[0],
                y: signal.signal[0].delta[1] - 0.025}
        };
        if (signal.integral === 1) {
            annotation.strokeColor = options.strokeColor;
        } else {
            annotation.strokeColor = 'rgb(0,128,0)';
        }

        annotation.strokeWidth = options.strokeWidth;
        annotation.width = options.width;
        annotation.height = options.height;
        annotation.info = signal;
        annotations.push(annotation);
    }
    return annotations;
}

export {annotations2D, annotations1D};
