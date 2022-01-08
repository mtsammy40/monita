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
    'maxChecks': 5
};

// Production environment 

environments.production = {
    'httpPort': '5000',
    'httpsPort': '5001',
    'envName': 'production',
    'maxChecks': '5',
    'hashingSecret': 'thisIsAHashingSecret',
    'maxChecks': 5
};

// Derermine which should be exported out
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : environments.staging;

// Check that the current environment is one of the environments above. If not, default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments['staging'];

module.exports = environmentToExport;