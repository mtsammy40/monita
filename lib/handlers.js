const { config } = require("process");
var _data = require("./data");
var helpers = require("./helpers");
var configs = require("../config");
const { time } = require("console");
// Define handlers
var handlers = {};

// Dependencies

// Define handlers

// Ping handler
handlers.ping = function (data, callback) {
  callback(200, {});
};

// Users handler
handlers.users = (data, callback) => {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    var chosenhandler = handlers._users[data.method];
    if (chosenhandler) {
      chosenhandler(data, callback);
    } else {
      callback(405);
    }
  } else {
    callback(405);
  }
};

// Container for user sub handlers
handlers._users = {};

handlers._users.post = (data, callback) => {
  var firstName =
    typeof data.payload.firstName == "string" &&
      data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
      data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
      data.payload.phone.trim().length == 12
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
      data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement = data.payload.password;

  console.log("oo ", firstName, lastName, password, phone, tosAgreement);
  if ((firstName, lastName, password, phone, tosAgreement)) {
    // make sure that the user doesn't already exist
    _data.read("users", phone, (err, data) => {
      if (err) {
        // Hash password
        var hashPassword = helpers.hash(password);

        if (hashPassword) {
          // create user object
          var user = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: hashPassword,
            tosAgreement: true,
          };

          // persist to disk
          _data.create("users", phone, user, (err) => {
            if (!err) {
              callback(200, { user: user });
            } else {
              console.log("Error: ", err);
              callback(500, { Error: err });
            }
          });
        } else {
          callback(500, { Error: "Problem with hash" });
        }
      } else {
        callback(400, { Error: "User with phone number already exists" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Required data: phone
// Optional data: none
handlers._users.get = (data, callback) => {
  // Check that phone is valid
  var phone =
    typeof data.queryStringObject.phone == "string" &&
      data.queryStringObject.phone.trim().length == 12
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify given token is for the user
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(500, "Could not read data");
          }
        });
      } else {
        callback(401, { Error: "Invalid token" });
      }
    });
  } else {
    callback(400, { Error: "Invalid phone number" });
  }
};

// Users put
// Required data: phone
// Optional data firstname, lastname, password (at least one must be specified)
// TODO Only let an authenticated user update only their record
handlers._users.put = (data, callback) => {
  console.log("users::put | ", data);
  var firstName =
    typeof data.payload.firstName == "string" &&
      data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
      data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
      data.payload.phone.trim().length == 12
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
      data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    // get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify given token is for the user
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        if (firstName || lastName || password) {
          _data.read("users", phone, (err, userData) => {
            if (!err && data) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }

              if (password) {
                userData.password = helpers.hash(password);
              }

              // store the updated data
              _data.update("users", phone, userData, (err) => {
                if (!err) {
                  callback(200);
                } else {
                  console.log("Error updating ...", err);
                  callback(500, { Error: "Could not update data" });
                }
              });
            } else {
              callback(404, {
                Error: "User not found",
              });
            }
          });
        } else {
          callback(400, {
            Error: "Missing fields to update",
          });
        }
      } else {
        callback(403, { Error: "Invalid token" });
      }
    });
  } else {
    callback(400, { Error: "Missing phone" });
  }
};

// Users get
// Require phone field
// Only allow users to delete their objects, not anyone elses
handlers._users.delete = (data, callback) => {
  //check that the phone numer is valid
  // Check that phone is valid
  var phone =
    typeof data.queryStringObject.phone == "string" &&
      data.queryStringObject.phone.trim().length == 12
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    // get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // verify given token is for the user
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read("users", phone, (err, userData) => {
          if (!err && userData) {
            _data.delete("users", phone, (err) => {
              if (!err) {
                // delete users checks
                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  userChecks.forEach(check => {
                    // delete
                    _data.delete('checks', check.id, (err) => {
                      if (!err) {
                        checksDeleted += 1;
                        if (checksDeleted === checksToDelete) {
                          callback(200);
                        }
                      } else {
                        deletionErrors = true;
                      }
                    })
                  });
                  if(deletionErrors) {
                    callback(500, {Error: 'Some user checks are dead'})
                  }
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Could not delete user" });
              }
            });
          } else {
            callback(500, {Error: "Could not find specified data"});
          }
        });
      } else {
        callback(403, { Error: "Invalid token" });
      }
    });
  } else {
    callback(400, { Error: "Invalid phone number" });
  }
};

// Users handler
handlers.tokens = (data, callback) => {
  console.log("Method => ", data.method);
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    var chosenhandler = handlers._tokens[data.method];
    if (chosenhandler) {
      chosenhandler(data, callback);
    } else {
      callback(405);
    }
  } else {
    callback(405);
  }
};

handlers._tokens = {};

// Tokens get
// Required data : id
// Optional data : none
handlers._tokens.get = (data, callback) => {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
      data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(500, "Could not read data");
      }
    });
  } else {
    callback(400, { Error: "Invalid token id" });
  }
};

// Tokens post
handlers._tokens.post = (data, callback) => {
  var phone =
    typeof data.payload.phone == "string" &&
      data.payload.phone.trim().length == 12
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
      data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    // lookup user matching phone
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword === userData.password) {
          // If valid, create token, set expiration date one hour in the future
          var tokenId = helpers.createRandomString(20);

          if (tokenId) {
            var expires = Date.now() * 1000 * 60 * 60;

            var tokenObject = {
              phone: phone,
              id: tokenId,
              expires: expires,
            };

            _data.create("tokens", tokenId, tokenObject, (err) => {
              if (!err) {
                callback(200, tokenObject);
              } else {
                console.log("Error on token creation ", err);
                callback(500, { Error: " could not create token" });
              }
            });
          } else {
            callback(500, { Error: "Could not create token string" });
          }
        } else {
          callback(401, { Error: "Password does not match" });
        }
      } else {
        callback(400, { Error: "User not found" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

// Tokens -> Put
//
handlers._tokens.put = (data, callback) => {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    // lookuo token
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isnt expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() * 60 * 60 * 1000;

          // store
          _data.update("tokens", id, tokenData, (err) => {
            if (!err) {
              callback(200, tokenData);
            } else {
              callback(500, { Error: "Token could not be updated" });
            }
          });
        } else {
          callback(400, { Error: "Token has expired" });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "MIssing required fields or fields invalid" });
  }
};

// Tokens delete
handlers._tokens.delete = (data, callback) => {
  var id =
    typeof data.queryStringObject.id == "string" &&
      data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  if (id) {
    // Delete record
    _data.delete("tokens", id, (err) => {
      if (!err) {
        callback(200, {});
      } else {
        callback(500, { Error: " Could not delete token" });
      }
    });
  } else {
    callback(400, { Error: "Invalid or missing id" });
  }
};

// verify that a given id is currently valid for the user
handlers._tokens.verifyToken = (id, phone, callback) => {
  // lookup token
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      // check that the token is for the given user and has not expired
      if (tokenData.phone === phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(400, { Error: "Token does not exist" });
    }
  });
};

// Checks
handlers.checks = (data, callback) => {
  console.log("Method => ", data.method);
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    var chosenhandler = handlers._checks[data.method];
    if (chosenhandler) {
      chosenhandler(data, callback);
    } else {
      callback(405);
    }
  } else {
    callback(405);
  }
};

// container for checks methods
handlers._checks = {};

// POST
// Required data: protocal, url, method, successCodes, timeoutSeconds
// Optional data: none

handlers._checks.post = (data, callback) => {
  // Validation
  var protocol =
    typeof data.payload.protocol == "string" &&
      ["http", "https"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;

  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  var method =
    typeof data.payload.method == "string" &&
      ["post", "get", "put", "delete"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;

  var successCodes =
    typeof data.payload.successCodes == "object" &&
      data.payload.successCodes instanceof Array &&
      data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  var timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get token from headers
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    // Lookup the user by reading the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        // Lookup user data
        _data.read("users", userPhone, function (err, userData) {
          if (!err && userData) {
            var userChecks =
              typeof userData.checks === "object" &&
                userData.checks instanceof Array
                ? userData.checks
                : [];
            if (userChecks.length < configs.maxChecks) {
              var checkId = helpers.createRandomString(20);

              // Create check object and include user phone
              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds,
              };

              // Save the object
              _data.create("checks", checkId, checkObject, function (err) {
                if (!err) {
                  // Add the checkId to the users object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", userPhone, userData, function (err) {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error:
                  "The user has the maximum number of checks " +
                  configs.maxChecks,
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};


// Checks - get 
// Required Id - null
// Optional data: none
handlers._checks.get = (data, callback) => {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
      data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // get token from headers
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // verify given token is for the user
        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            // Return checkData
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404)
      }
    })

  } else {
    callback(400, { Error: "Invalid id number" });
  }
};

// Checks - PUT
// Required data - id
// Optional data : protocal, url, method, successCodes, timeoutSeconds (One must be set)
handlers._checks.put = (data, callback) => {
  console.log("check::put :: ", data);
  var id =
    typeof data.payload.id == "string" &&
      data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var protocol =
    typeof data.payload.protocol == "string" &&
      ["http", "https"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;

  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  var method =
    typeof data.payload.method == "string" &&
      ["post", "get", "put", "delete"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;

  var successCodes =
    typeof data.payload.successCodes == "object" &&
      data.payload.successCodes instanceof Array &&
      data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  var timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    // Check to make sure that one field is set
    if (protocol || url || method || success || timeoutSeconds) {
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // Validate token
          var token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          // verify given token is for the user
          handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
              // update the check where necessarry
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              // store the updates
              _data.update('checks', id, checkData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the check' });
                }
              });
            } else {
              callback(403);
            }
          })
        } else {
          callback(400, { Error: 'Check does not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Atleast one field change is required' });
    }
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Checks - Delete
// Required - id
// Optional - id
handlers._checks.delete = (data, callback) => {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
      data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  // get token from headers
  var token =
    typeof data.headers.token == "string" ? data.headers.token : false;
  if (id) {
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {

        handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            // delete check data
            _data.delete("checks", id, (err) => {
              if (!err) {
                // get user checks
                _data.read('users', checkData.userPhone, function (err, userData) {
                  if (!err && userData) {
                    userData.checks = userData.checks.filter((check) => check !== id);
                    _data.update('users', userData.phone, userData, function (err) {
                      if (!err) {
                        callback(200);
                      } else {
                        callback(500, { Error: 'Could not remove check from user' });
                      }
                    })
                  } else {
                    callback(500, { Error: 'User attached to checks not found' });
                  }
                })
                callback(200);
              } else {
                callback(500, { Error: "Could not delete user" });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(500, { Error: err });
      }
    });
  } else {
    callback(400, { Error: 'Missing Required Fields' });
  }
}


// Define Not found handlers
handlers.notFound = (data, callback) => {
  callback(404, {});
};

module.exports = handlers;
