/*
* A RESTful server for url-shortener
*
* Copyright (c) 2015 Erez Nagar (erez.nagar@gmail.com)
* Licensed under the MIT license.
*/

var urlShortener = require("../URLShortener/url-shortener");
var http = require("http");

var RequestHandler = function(){
	this.send = function(status, data, res){
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Content-Type", "application/json");
		res.statusCode = status;

		res.end(JSON.stringify(
			{
				status: status,
				data: data,
			}
		));
	}

	this.error = function(status, statusMessage, description, res){
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Content-Type", "application/json");
		res.statusCode = status;

		res.end( JSON.stringify(
			{
				status: status,
				message: statusMessage,
				description: description,
			}
		));
	}
};

var response = new RequestHandler();
var server = http.createServer( function(req, res){
	switch(req.url){
		case "/":
			response.error(400, "Bad Request", "Endpoint not supported. Use /shorten to shorten a URL or /{url} to retrieve a URL", res);
			break;

		case "/shorten":
			if (req.method != "POST"){
				res.setHeader("Allow", "POST");
				response.error(405, "Method Not Allowed", req.method + " on /shorten is not allowed. Use POST instead.", res);
				return;
			}

			var body = "";
	    	req.on("data", function(data) {
	    		body += data;
    			// In case of too much data, kill the connection
        		// 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~ 1MB
        		if (body.length > 1e6) req.connection.destroy();
		    });

			req.on("end", function(){
				try{
					body = JSON.parse(body);
				}catch(e){
					response.error(400, "Bad Request", "Malformed JSON", res);
					return;
				}

				if (!body.url){
					response.error(400, "Bad Request", "Malformed JSON - Missing a URL", res);
					return;
				}

				urlShortener.shorten(body.url, function(err, result){
					if (err){
						response.error(500, "Internal Server Error", "Something went wrong", res);
						return;
					}
					response.send(201, {url: result}, res);
				});
			});
			break;

		default:
			if (req.method != "GET"){
				res.setHeader("Allow", "GET");
				response.error(405, "Method Not Allowed", req.method + " on " + req.url + " is not allowed. Use GET instead.", res);
				return;
			}

			if (!req.url.substring(1).match(/^[a-zA-Z\d]+$/)){
				response.error(400, "Bad Request", "Invalid URL " + req.url, res);
				return;
			}

			urlShortener.solve(req.url.substring(1), function(err, result){
				if (err){
					if (err == "Error: InvalidURLKey")
						response.error(404, "Not Found", "URL " + req.url + " not found", res);
					else
						response.error(500, "Internal Server Error", "Something went wrong", res);
					return;
				}

				// Redirect
				res.setHeader("Location", result);
				res.statusCode = 301;
				res.end();
			});
	}
});

server.listen(80, function(){
    console.log("Server listening on: http://localhost:%s", 80);
});