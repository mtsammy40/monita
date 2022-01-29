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
                        // Pass data to the check valprotocolator and let the function continue or log errors as is
                        workers.valprotocolateCheckData(originalCheckData);

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

// Sanity-check check-data
workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof (originalCheckData) == 'object' && originalCheckData ? originalCheckData : null;
    if (originalCheckData) {
        originalCheckData.id = typeof (originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id : null;
        originalCheckData.phone = typeof (originalCheckData.phone) == 'string' && originalCheckData.phone.trim().length == 10 ? originalCheckData.phone : null;
        originalCheckData.protocol = typeof (originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : null;
        originalCheckData.url = typeof (originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url : null;
        originalCheckData.method = typeof (originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : null;
        originalCheckData.successCodes = typeof (originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : null;
        originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 100 ? originalCheckData.timeoutSeconds : null;
    }

    // Set the keys that may not be set if the check was never seen before
    originalCheckData.state = typeof (originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.timeoutSeconds : false;

    // If all the checks pass, pass the data along to the next step in the process
    if(originalCheckData.id && originalCheckData.userPhone && originalCheckData.protocol && originalCheckData.url && originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log("Error: One or all of the check data checks failed");
    }
}

workers.performCheck = (originalCheckData) => {
    // Prepare initial check data

    var checkOutcome = {
        'error' : false,
        'responseCode': false
    };

    // Parse the host name and the path out of the originalcheckdata
    var parsedUrl = url.parsed(originalCheckData.protocol + '://'+originalCheckData.url, true);
    var hostName = parsedUrl.hostName;
    var path = parsedUrl.path;

    // Consteuct the request
    var requestDetails  = {
        protocol: originalCheckData.protocol + ':',
        hostname: hostname,
        method: originalCheckData.method.toUpperCase(),
        path: path,
        timeout: originalCheckData.timeoutSeconds * 1000
    }

    // instantiate the request objecy
    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    var req = _moduleToUse.request(requestDetails, function(res) {
        var status = res.statusCode;
        checkOutcome.responseCode = status;
    });

    if(!outcomeSent) {
        workers.processCheckOutcome(originalCheckData, checkOutcome);
        outcomeSent = true;
    }

    // bind to the error so it doesnt get thrown
    req.on('error', function(error) {
        checkOutcome.error = {
            'error': true,
            'value' : error
        }
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', function(e) {
        checkOutcome.error = {
            'error': true,  
            'value' : 'timeout'
        }
        if(!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });
    
    // end the req
    req.end();
}

workers.processCheckOutcome = function() {

}
module.exports = workers;