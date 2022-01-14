/**
 * Primary file for the api
 */

// Dependencies
var http = require("http");
var https = require("https");
var url = require("url");
const { StringDecoder } = require("string_decoder");
var config = require("./config");
var fs = require("fs");
var _helpers = require('./lib/helpers');

var handlers = require('./lib/handlers');

// Instantiating the http server
var httpServer = http.createServer(function (req, res) {
  unifiedServer(req, res);
});

var httpsServerOptions = {
  key: fs.readFileSync("./keys/key.pem"),
  cert: fs.readFileSync("./keys/cert.pem"),
};

// Instantiating the https server
var httpsServer = http.createServer(httpsServerOptions, function (req, res) {
  unifiedServer(req, res);
});

// start server
const portNumber = config.httpPort;
httpServer.listen(portNumber, () => {
  console.log("Listening on port " + portNumber + " on env " + config.envName);
});

// Unified server
var unifiedServer = (req, res) => {
  // Get the url
  var parsedUrl = url.parse(req.url, true);

  // get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get method
  var method = req.method.toLowerCase();

  // Get query string as an object
  var queryStringObject = parsedUrl.query;

  // Get headers as an object
  var headers = req.headers;

  // Get the payload , if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function (data) {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    // Choose the request this handler should go to
    var chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct data object to send to the router
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: _helpers.parseBufferToObject(buffer),
    };

    chosenHandler(data, function (statusCode, payload) {
      // use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Use the payload called back by the handler, or default to empty callback
      payload = typeof payload == "object" ? payload : {};

      // Convert the payload to a string
      var paylaodString = JSON.stringify(payload);

      // Retrun the response
      res.setHeader("Content-type", "application/json");
      res.writeHead(statusCode);
      res.end(paylaodString);

      // Log the request path
      console.trace(
        "Returning response with statusCode : " +
          statusCode +
          " and payload " +
          paylaodString
      );
    });
  });
};


// Define a request router
var router = {
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,  
  checks: handlers.checks
};
