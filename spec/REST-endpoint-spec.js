var server = require("../server");
var http = require("http");

describe("REST server:", function() {

    var host = "http://localhost";
    var postOptions = function(method, path, data){
        return {
            host: "localhost",
            port: "80",
            path: path,
            method: method.toUpperCase(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(data)
            }
        };
    };

    describe("/shorten endpoint", function() {

        it("should not accept non-POST requests", function(done) {
            http.get(host + "/shorten", function(res) {
                expect(res.statusCode).toBe(405);
                done();
            });
        });

        it("should return 400 on invalid requests", function(done) {
            var data = JSON.stringify( {} );
            http.request(postOptions("POST", "/shorten", data), function(res) {
                expect(res.statusCode).toBe(400);
                done();
            }).end(data);
        });

        it("should return an error on invalid URLs", function(done) {
            var data = JSON.stringify( {url: "bad URL"} );
            http.request(postOptions("POST", "/shorten", data), function(res) {
                expect(res.statusCode).toBe(500);
                done();
            }).end(data);
        });

        it("should process a valid request", function(done) {
            var data = JSON.stringify( {url: "http://www.example.com/a-very-long-url"} );
            http.request(postOptions("POST", "/shorten", data), function(res) {
                expect(res.statusCode).toBe(201);
                done();
            }).end(data);
        });
    });

    describe("/{url} endpoint", function() {

        it("should not accept non-GET requests", function(done) {
            var data = JSON.stringify( {} );
            http.request(postOptions("POST", "/b", data), function(res) {
                expect(res.statusCode).toBe(405);
                done();
            }).end(data);
        });

        it("should return 400 on invalid URLs", function(done) {
            http.get(host + "/!@#", function(res) {
                expect(res.statusCode).toBe(400);
                done();
            });
        });

        it("should return 404 when resource not found", function(done) {
            http.get(host + "/noResource", function(res) {
                expect(res.statusCode).toBe(404);
                done();
            });
        });

        it("should process a valid request", function(done) {
            http.get(host + "/b", function(res) {
                expect(res.statusCode).toBe(301);
                done();
            });
        });
    });

    describe("/ endpoint", function() {
        it("should reply 400 to a GET request", function(done) {
            http.get(host + "/", function(res) {
                expect(res.statusCode).toBe(400);
                done();
            });
        });
        
        it("should reply 400 to a POST request", function(done) {
            var data = JSON.stringify( {} );
            http.request(postOptions("POST", "/", data), function(res) {
                expect(res.statusCode).toBe(400);
                done();
            }).end(data);
        });
    });
});