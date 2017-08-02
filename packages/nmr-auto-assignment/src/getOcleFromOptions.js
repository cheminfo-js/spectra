'use strict';

let OCLE;

module.exports = function getOcleFromOptions(options) {
    console.log("X");
    if (OCLE) return OCLE;
    if (options.OCLE) {
        console.log("XS");
        return OCLE = options.OCLE;
    } else {
        console.log("XGS");
        return OCLE = require('openchemlib-extended-minimal');
    }
};
