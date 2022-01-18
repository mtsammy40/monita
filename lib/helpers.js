/**
 * Helpers for various tasks
 *
 */

// Dependencies
var crypto = require("crypto");
const { callbackify } = require("util");
var config = require("../config");
var querystring = require('querystring');
var https = require('https');
const { stat } = require("fs");

var helpers = {};

// create a SHA256
helpers.hash = (password) => {
  if (typeof password == "string" && password.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(password)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.parseBufferToObject = (buffer) => {
  try {
    return JSON.parse(buffer);
  } catch (e) {
    return {};
  }
};

helpers.createRandomString = (strLength) => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all possible characters
    var possibbleCharacters = "abcdefghijklmnopqrstuvwxyz123456789";

    //Start the final string
    var str = "";
    for (let i = 0; i < strLength; i++) {
      // get a random character from the possible character string
      var randomChar = possibbleCharacters.charAt(
        Math.floor(Math.random() * possibbleCharacters.length)
      );
      str += randomChar;
    }
    // return final string
    return str;
  } else {
    return false;
  }
};

// Send Sms Via Twilio
helpers.sendTwilioSms = function (phone, msg, callback) {
  // Validate the parameters
  phone = typeof (phone) == 'string' && phone.trim().length == 9 ? phone.trim() : false;
  msg = typeof (msg) == 'string' && msg.trim().length < 10 ? msg.trim() : false;

  if (phone && msg) {
    // Configure request payload
    var payload = {
      From: config.twilio.fromPhone,
      To: '+254' + phone,
      Body: msg
    }
    var payloadString = querystring.stringify(payload);
    var requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      auth: config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payloadString)
      }
    };
    // Instantiate a request module
    var req = https.request(requestDetails, function (res) {
      //  Grab the status of the response
      console.log(res.statusCodey);
      var status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status);
      }
    });

    // Bind to the error event so that it wont get thrown
    req.on('error', function (err) {
      callback(err);
    });

    // Add paylaod to req
    req.write(payloadString);

    // End the request
    req.end();
  } else {
    callback('Given parameters were invalid or missing')
  }
}

module.exports = helpers;
