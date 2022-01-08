/**
 * Helpers for various tasks
 *
 */

// Dependencies
var crypto = require("crypto");
var config = require("../config");

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

module.exports = helpers;
