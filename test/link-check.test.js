'use strict';

const expect = require('expect.js');
const http = require('http');
const express = require('express');
const linkCheck = require('../');

describe('link-check', function () {

    let baseUrl;

    before(function (done) {
        const app = express();

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

        app.get('/hang', function (req, res) {
            // no reply
        });

        app.get('/notfound', function (req, res) {
            res.sendStatus(404);
        });

        app.get('/basic-auth', function (req, res) {
            if (req.headers["authorization"] === "Basic Zm9vOmJhcg==") {
                return res.sendStatus(200);
            }
            res.sendStatus(401);
        });

        const server = http.createServer(app);
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

    it('should find that a valid external link with basic authentication is alive', function (done) {
        linkCheck(baseUrl + '/basic-auth', {
            headers: {
                'Authorization': 'Basic Zm9vOmJhcg=='
            },
        }, function (err, result) {
            expect(err).to.be(null);
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

    it('should report no DNS entry as a dead link (http)', function (done) {
        linkCheck('http://example.example.example.com/', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('http://example.example.example.com/');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(0);
            expect(result.err.code).to.be('ENOTFOUND');
            done();
        });
    });

    it('should report no DNS entry as a dead link (https)', function (done) {
        const badLink = 'https://githuuuub.com/tcort/link-check';
        linkCheck(badLink, function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(badLink);
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(0);
            expect(result.err.message).to.contain('ENOTFOUND');
            done();
        });
    });

    it('should timeout if there is no response', function (done) {
        linkCheck(baseUrl + '/hang', { timeout: '100ms' }, function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/hang');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(0);
            expect(result.err.message).to.contain('TIMEDOUT');
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

    it('should handle valid mailto with encoded characters in address', function (done) {
        linkCheck('mailto:foo%20bar@example.org', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('mailto:foo%20bar@example.org');
            expect(result.status).to.be('alive');
            done();
        });
    });

    it('should handle valid mailto containing hfields', function (done) {
        linkCheck('mailto:linuxgeek@gmail.com?subject=caf%C3%A9', function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be('mailto:linuxgeek@gmail.com?subject=caf%C3%A9');
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

    it('should handle file protocol', function(done) {
        linkCheck('fixtures/file.md', { baseUrl: 'file://' + __dirname }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol with fragment', function(done) {
        linkCheck('fixtures/file.md#section-1', { baseUrl: 'file://' + __dirname }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol with query', function(done) {
        linkCheck('fixtures/file.md?foo=bar', { baseUrl: 'file://' + __dirname }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle file path containing spaces', function(done) {
        linkCheck('fixtures/s p a c e/A.md', { baseUrl: 'file://' + __dirname }, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle baseUrl containing spaces', function(done) {
        linkCheck('A.md', { baseUrl: 'file://' + __dirname + '/fixtures/s p a c e'}, function(err, result) {
            expect(err).to.be(null);

            expect(result.err).to.be(null);
            expect(result.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol and invalid files', function(done) {
        linkCheck('fixtures/missing.md', { baseUrl: 'file://' + __dirname }, function(err, result) {
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

    it('should callback with an error on unsupported protocol', function (done) {
        linkCheck('gopher://gopher/0/v2/vstat', function (err, result) {
            expect(result).to.be(null);
            expect(err).to.be.an(Error);
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

    it('should honour response codes in opts.aliveStatusCodes[]', function (done) {
        linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 404, 200 ] },  function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/notfound');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(404);
            done();
        });
    });

    it('should honour regexps in opts.aliveStatusCodes[]', function (done) {
        linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 200, /^[45][0-9]{2}$/ ] },  function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/notfound');
            expect(result.status).to.be('alive');
            expect(result.statusCode).to.be(404);
            done();
        });
    });

    it('should honour opts.aliveStatusCodes[]', function (done) {
        linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 200 ] },  function (err, result) {
            expect(err).to.be(null);
            expect(result.link).to.be(baseUrl + '/notfound');
            expect(result.status).to.be('dead');
            expect(result.statusCode).to.be(404);
            done();
        });
    });

});
