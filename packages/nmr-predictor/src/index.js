'use strict';

const superagent = require('superagent');

const normalizeOptions = require('./normalizeOptions');
const queryByHose = require('./queryByHose');
const spinus = require('./spinus');
const twoD = require('./twoD');

const defaultProtonUrl = 'https://raw.githubusercontent.com/cheminfo-js/nmr-predictor/master/data/h1.json';
const defaultCarbonUrl = 'https://raw.githubusercontent.com/cheminfo-js/nmr-predictor/master/data/nmrshiftdb2.json';

const databases = {};

function fetchProton(url = defaultProtonUrl, dbName = 'proton') {
    return fetch(url, dbName, 'proton');
}

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

function proton(molecule, options) {
    options.atomLabel = 'H';
    [molecule, options] = normalizeOptions(molecule, options);
    const db = getDb(options.db || 'proton', 'proton');
    return queryByHose(molecule, db, options);
}

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

module.exports = {
    fetchProton,
    fetchCarbon,
    proton,
    carbon,
    spinus,
    twoD
};
