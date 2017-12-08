/**
 * Return the area of a Lorentzian function
 * @param {object} peak - object with peak information
 * @return {number}
 * @private
 */
export default function computeArea(peak) {
    return Math.abs(peak.intensity * peak.width * 1.57); // todo add an option with this value: 1.772453851
}
