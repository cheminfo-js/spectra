
import superagent from 'superagent';

import normalizeOptions from './normalizeOptions';
import queryByHose from './queryByHose';
import spinus from './spinus';
import twoD from './twoD';

const defaultProtonUrl = 'https://raw.githubusercontent.com/cheminfo-js/spectra/master/packages/nmr-predictor/data/h1.json';
const defaultCarbonUrl = 'https://raw.githubusercontent.com/cheminfo-js/spectra/master/packages/nmr-predictor/data/nmrshiftdb2-13c.json';

const databases = {};

/**
 * Fetch the data base from a url.
 * @param {string} url - url of data base.
 * @param {string} dbName - name of data base.
 * @return {promise} 
 */
function fetchProton(url = defaultProtonUrl, dbName = 'proton') {
    return fetch(url, dbName, 'proton');
}

/**
 * Fetch the data base from a url.
 * @param {string} url - url of data base.
 * @param {string} dbName - name of data base.
 * @return {promise} 
 */
function fetchCarbon(url = defaultCarbonUrl, dbName = 'carbon') {
    return fetch(url, dbName, 'carbon');
}

function fetch(url, dbName, type) {
    if (databases[dbName] && databases[dbName].type === type && databases[dbName].url === url) {
        if (databases[dbName].fetching) {
            return databases[dbName].fetching;
        }
        return Promise.resolve(databases[dbName].db);
    }
    const database = {
        type,
        url,
        db: null,
        fetching: null
    };
    databases[dbName] = database;
    const fetching = superagent.get(url).then((res) => {
        const db = res.body ? res.body : JSON.parse(res.text);
        database.db = db;
        database.fetching = false;
        return db;
    }).catch((e) => {
        delete databases[dbName];
        throw e;
    });
    database.fetching = fetching;
    return fetching;
}

/**
 * Predict a 1D NMR proton spectrum by Hose code method 
 * @param {string|Molecule} molecule - could be a string of molfile, smile or Molecule instance.
 * @param {object} options
 * @param {Array} options.levels - contain the levels for hose code query.
 * @return {promise}
 */
function proton(molecule, options) {
    options.atomLabel = 'H';
    [molecule, options] = normalizeOptions(molecule, options);
    const db = getDb(options.db || 'proton', 'proton');
    return queryByHose(molecule, db, options);
}

/**
 * Predict a 1D NMR proton spectrum by Hose code method 
 * @param {string|Molecule} molecule - could be a string of molfile, smile or Molecule instance.
 * @param {object} options
 * @param {Array} options.levels - contain the levels for hose code query.
 * @param {string} options.db - name of data base to be used.
 * @return {promise}
 */
function carbon(molecule, options) {
    options.atomLabel = 'C';
    [molecule, options] = normalizeOptions(molecule, options);
    const db = getDb(options.db || 'carbon', 'carbon');
    return queryByHose(molecule, db, options);
}

function getDb(option, type) {
    if (typeof option === 'object') return option;
    if (typeof option !== 'string') throw new TypeError('database option must be a string or array');
    const db = databases[option];
    if (!db) throw new Error(`database ${option} does not exist. Did you forget to fetch it?`);
    if (db.fetching) throw new Error(`database ${option} is not fetched yet`);
    if (db.type !== type) throw new Error(`database ${option} is of type ${db.type} instead of ${type}`);
    return db.db;
}

export {
    fetchProton,
    fetchCarbon,
    proton,
    carbon,
    spinus,
    twoD
};
