'use strict';

var expect = require('expect.js');
var http = require('http');
var express = require('express');
var linkCheck = require('../');

describe('link-check', function () {

    var baseUrl;
    
    before(function (done) {
        var app = express();

        app.head('/nohead', function (req, res) {
            res.sendStatus(405); // method not allowed
        });
        app.get('/nohead', function (req, res) {
            res.sendStatus(200);
        });

        app.get('/foo/redirect', function (req, res) {
            res.redirect('/foo/bar');
        });
        app.get('/foo/bar', function (req, res) {
            res.json({foo:'bar'});
        });

        app.get('/loop', function (req, res) {
            res.redirect('/loop');
        });
        
        var server = http.createServer(app);
        server.listen(0 /* random open port */, 'localhost', function serverListen(err) {
            if (err) {
                done(err);
                return;
            }
            baseUrl = 'http://' + server.address().address + ':' + server.address().port;
            done();
        });
    });

    it('should find that a valid link is alive', function (done) {
        linkCheck(baseUrl + '/foo/bar', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/foo/bar');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(200);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should find that a valid relative link is alive', function (done) {
        linkCheck('/foo/bar', { baseUrl: baseUrl }, function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('/foo/bar');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(200);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should find that an invalid link is dead', function (done) {
        linkCheck(baseUrl + '/foo/dead', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/foo/dead');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(404);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should find that an invalid relative link is dead', function (done) {
        linkCheck('/foo/dead', { baseUrl: baseUrl }, function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('/foo/dead');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(404);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should report no DNS entry as a dead link', function (done) {
        linkCheck('http://example.example.example.com/', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('http://example.example.example.com/');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(0);
            expect(result.err.code).to.be('ENOTFOUND');
            done();
        });
    });
    
    it('should try GET if HEAD fails', function (done) {
        linkCheck(baseUrl + '/nohead', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/nohead');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(200);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should handle redirects', function (done) {
        linkCheck(baseUrl + '/foo/redirect', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/foo/redirect');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(200);
            expect(result.err).to.be(null);
            done();
        });
    });

    it('should handle valid mailto', function (done) {
        linkCheck('mailto:linuxgeek@gmail.com', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('mailto:linuxgeek@gmail.com');
            expect(result.status).to.be('alive');
            done();
        });
    });

    it('should handle invalid mailto', function (done) {
        linkCheck('mailto:foo@@bar@@baz', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('mailto:foo@@bar@@baz');
            expect(result.status).to.be('dead');
            done();
        });
    });

    it('should handle redirect loops', function (done) {
        linkCheck(baseUrl + '/loop', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/loop');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(0);
            expect(result.err.message).to.contain('Exceeded maxRedirects.');
            done();
        });
    });

    it('should handle file protocol', function(done) {
        linkCheck('fixtures/file.md', { baseUrl: 'file://' + process.cwd() + '/test/' }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol and invalid files', function(done) {
        linkCheck('fixtures/missing.md', { baseUrl: 'file://' + process.cwd() + '/test/' }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err.code).to.be('ENOENT');
            expect(result.status).to.be('dead');
            done()
        });
    });

    it('should ignore file protocol on absolute links', function(done) {
        linkCheck(baseUrl + '/foo/bar', { baseUrl: 'file://' }, function(err, result) {
            expect(err).to.be(null);

            expect(result.link).to.be(baseUrl + '/foo/bar');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(200);
            expect(result.err).to.be(null);
            done()
        });
    });

    it('should ignore file protocol on fragment links', function(done) {
        linkCheck('#foobar', { baseUrl: 'file://' }, function(err, result) {
            expect(err).to.be(null);

            expect(result.link).to.be('#foobar');
            done()
        });
    });
});
