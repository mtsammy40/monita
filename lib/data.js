/**
 * Library for storing and editing data
 *
 */

// Depencencies
var fs = require("fs");
var path = require("path");

var _helpers = require("./helpers");

// Container for the module
var lib = {};

// Define the base dir of the root folder
lib.baseDir = path.join(__dirname, "/../.data/");

// write data to a file
lib.create = function (dir, file, data, callback) {
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "wx",
    function (err, fileDescriptor) {
      if (!err && fileDescriptor) {
        // convert data to string for writing
        var stringData = JSON.stringify(data);

        // write to file and close it
        fs.writeFile(fileDescriptor, stringData, function (err) {
          if (!err) {
            fs.close(fileDescriptor, function (err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing new file");
              }
            });
          } else {
            callback("Error writing to new file");
          }
        });
      } else {
        callback("Could not create new file, it may already exist");
      }
    }
  );
};

lib.read = (dir, file, callback) => {
  fs.readFile(lib.baseDir + dir + "/" + file + ".json", "utf8", (err, data) => {
    if (!err && data) {
      data = _helpers.parseBufferToObject(data);
      callback(false, data);
    } else {
      callback(err, data);
    }
  });
};

lib.update = (dir, file, data, callback) => {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + file + ".json",
    "r+",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // convert data to string
        var stringData = JSON.stringify(data);

        // truncate Data
        fs.ftruncate(fileDescriptor, (err) => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback("Error closing file");
                  }
                });
              } else {
                callback("Errror writing to existing file");
              }
            });
          } else {
            callback("Error truncating");
          }
        });
      } else {
        callback(
          "Could not open file for editing, the file might not exist yet"
        );
      }
    }
  );
};

lib.delete = (dir, file, callback) => {
  fs.unlink(lib.baseDir + dir + "/" + file + ".json", (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("Error deleting file");
    }
  });
};

// list all in directory
lib.list = function (dir, callback) {
  fs.readdir(lib.baseDir + dir + '/' + file + '.json', function (err, data) {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(function (fileName) {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err);
    }
  })
}

module.exports = lib;
