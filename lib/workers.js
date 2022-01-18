/**
 * Worker Related tasks
 */

var path = require('path');
var fs = require('fs');
var http = require('http');
var url = require('url');
var https = require('https');
var _data = require('./data');
var helpers = require('./helpers');
const { checks } = require('./handlers');

//  Instantiate the workers object
var workers = {};


// Init script
workers.init = function () {
    // Execute all the checks immediately
    workers.gatherAllChecks();

    // Call loop
    workers.loop();
}

workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();
    }, 1000 * 60);
}

workers.gatherAllChecks = function () {
    // Get all checks that exist in the system
    _data.list('checks', function (err, data) {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                // Read in the checkData
                _data.read('checks', check, function (err, originalCheckData) {
                    if (!err && originalCheckData) {
                        // Pass data to the check validator and let the function continue
                        
                    } else {
                        console.log('Error: reading one of the check dataa');
                    }
                })
            });
        } else {
            console.log('Error: Could not find any checks to process');
        }
    })
}

module.exports = workers;