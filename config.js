/**
 * Create and export configuration files
 */


// Container for all the environments 

var environments = {};

// Staging object (default)

environments.staging = {
    'httpPort': '3000',
    'httpsPort': '3001',
    'envName': 'staging',
    'maxChecks': '5',
    'hashingSecret': 'thisIsAHashingSecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      }
};

// Production environment 

environments.production = {
    'httpPort': '5000',
    'httpsPort': '5001',
    'envName': 'production',
    'maxChecks': '5',
    'hashingSecret': 'thisIsAHashingSecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
      }
};

// Derermine which should be exported out
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : environments.staging;

// Check that the current environment is one of the environments above. If not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments['staging'];

module.exports = environmentToExport;