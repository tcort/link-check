import * as http from 'http'
import * as express from 'express'
import * as linkCheck from '../src'
import expect = require('expect.js')

describe('link-check', function() {

    this.timeout(2500); // increase timeout to enable 429 retry tests

    // baseUrl is set during before
    let baseUrl: string;
    let laterCustomRetryCounter: number;

    before((done) => {
        const app = express();

        app.head('/nohead', (req, res) => {
            res.sendStatus(405); // method not allowed
        });
        app.get('/nohead', (req, res) => {
            res.sendStatus(200);
        });

        app.get('/foo/redirect', (req, res) => {
            res.redirect('/foo/bar');
        });
        app.get('/foo/bar', (req, res) => {
            res.json({foo:'bar'});
        });

        app.get('/loop', (req, res) => {
            res.redirect('/loop');
        });

        app.get('/hang', (req, res) => {
            // no reply
        });

        app.get('/notfound', (req, res) => {
            res.sendStatus(404);
        });

        app.get('/basic-auth', (req, res) => {

            if (req.headers["authorization"] === "Basic Zm9vOmJhcg==") {
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        });

        // prevent first header try to be a hit
        app.head('/later-custom-retry-count', (req, res) => {
            res.sendStatus(405); // method not allowed
        });
        app.get('/later-custom-retry-count', (req, res) => {
            laterCustomRetryCounter++;

            if(laterCustomRetryCounter === parseInt(req.query.successNumber!.toString(), 10)) {
                res.sendStatus(200);
            }else{
              res.setHeader('retry-after', 1);
              res.sendStatus(429);
            }
        });

        // prevent first header try to be a hit
        app.head('/later-standard-header', (req, res) => {
            res.sendStatus(405); // method not allowed
        });
        let stdRetried = false;
        let stdFirstTry = 0;
        app.get('/later', (req, res) => {
            const isRetryDelayExpired = stdFirstTry + 1000 < Date.now();
            if(!stdRetried || !isRetryDelayExpired){
              stdFirstTry = Date.now();
              stdRetried = true;
              res.setHeader('retry-after', 1);
              res.sendStatus(429);
            }else{
              res.sendStatus(200);
            }
        });

        // prevent first header try to be a hit
        app.head('/later-no-header', (req, res) => {
            res.sendStatus(405); // method not allowed
        });
        let stdNoHeadRetried = false;
        let stdNoHeadFirstTry = 0;
        app.get('/later-no-header', (req, res) => {
            const minTime = stdNoHeadFirstTry + 1000;
            const maxTime = minTime + 100;
            const now = Date.now();
            const isRetryDelayExpired = minTime < now && now < maxTime;
            if(!stdNoHeadRetried || !isRetryDelayExpired){
              stdNoHeadFirstTry = Date.now();
              stdNoHeadRetried = true;
              res.sendStatus(429);
            }else{
              res.sendStatus(200);
            }
        });

        // prevent first header try to be a hit
        app.head('/later-non-standard-header', (req, res) => {
            res.sendStatus(405); // method not allowed
        });
        let nonStdRetried = false;
        let nonStdFirstTry = 0;
        app.get('/later-non-standard-header', (req, res) => {
            const isRetryDelayExpired = nonStdFirstTry + 1000 < Date.now();
            if(!nonStdRetried || !isRetryDelayExpired){
              nonStdFirstTry = Date.now();
              nonStdRetried = true;
              res.setHeader('retry-after', '1s');
              res.sendStatus(429);
            }else {
              res.sendStatus(200);
            }
        });

        app.get(encodeURI('/url_with_unicode–'), (req, res) => {
            res.sendStatus(200);
        });

        const server = http.createServer(app);
        server.listen(0 /* random open port */, 'localhost', function serverListen() {
            const address = typeof server.address() === 'string' ?
                server.address() :
                (server.address() as any).address + ':' + (server.address() as any).port
            baseUrl = 'http://' + address;
            done();
        });
    });

    it('should find that a valid link is alive', (done) => {
        linkCheck.linkCheck(baseUrl + '/foo/bar', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/foo/bar');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should find that a valid external link with basic authentication is alive', (done) => {
        linkCheck.linkCheck(baseUrl + '/basic-auth', {
            headers: {
                'Authorization': 'Basic Zm9vOmJhcg=='
            },
        }, (err, result) => {
            expect(err).to.be(null);
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should find that a valid relative link is alive', (done) => {
        linkCheck.linkCheck('/foo/bar', { baseUrl }, (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('/foo/bar');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should find that an invalid link is dead', (done) => {
        linkCheck.linkCheck(baseUrl + '/foo/dead', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/foo/dead');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(404);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should find that an invalid relative link is dead', (done) => {
        linkCheck.linkCheck('/foo/dead', { baseUrl }, (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('/foo/dead');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(404);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should report no DNS entry as a dead link (http)', (done) => {
        linkCheck.linkCheck('http://example.example.example.com/', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('http://example.example.example.com/');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(0);
            expect(result!.err.code).to.be('ENOTFOUND');
            done();
        });
    });

    it('should report no DNS entry as a dead link (https)', (done) => {
        const badLink = 'https://githuuuub.com/tcort/link-check';
        linkCheck.linkCheck(badLink, (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(badLink);
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(0);
            expect(result!.err.message).to.contain('ENOTFOUND');
            done();
        });
    });

    it('should timeout if there is no response', (done) => {
        linkCheck.linkCheck(baseUrl + '/hang', { timeout: '100ms' }, (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/hang');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(0);
            expect(result!.err.message).to.contain('TIMEDOUT');
            done();
        });
    });

    it('should try GET if HEAD fails', (done) => {
        linkCheck.linkCheck(baseUrl + '/nohead', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/nohead');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should handle redirects', (done) => {
        linkCheck.linkCheck(baseUrl + '/foo/redirect', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/foo/redirect');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done();
        });
    });

    it('should handle valid mailto', (done) => {
        linkCheck.linkCheck('mailto:linuxgeek@gmail.com', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('mailto:linuxgeek@gmail.com');
            expect(result!.status).to.be('alive');
            done();
        });
    });

    it('should handle valid mailto with encoded characters in address', (done) => {
        linkCheck.linkCheck('mailto:foo%20bar@example.org', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('mailto:foo%20bar@example.org');
            expect(result!.status).to.be('alive');
            done();
        });
    });

    it('should handle valid mailto containing hfields', (done) => {
        linkCheck.linkCheck('mailto:linuxgeek@gmail.com?subject=caf%C3%A9', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('mailto:linuxgeek@gmail.com?subject=caf%C3%A9');
            expect(result!.status).to.be('alive');
            done();
        });
    });

    it('should handle invalid mailto', (done) => {
        linkCheck.linkCheck('mailto:foo@@bar@@baz', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be('mailto:foo@@bar@@baz');
            expect(result!.status).to.be('dead');
            done();
        });
    });

    it('should handle file protocol', (done) => {
        linkCheck.linkCheck('fixtures/file.md', { baseUrl: 'file://' + __dirname }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol with fragment', (done) => {
        linkCheck.linkCheck('fixtures/file.md#section-1', { baseUrl: 'file://' + __dirname }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol with query', (done) => {
        linkCheck.linkCheck('fixtures/file.md?foo=bar', { baseUrl: 'file://' + __dirname }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            done()
        });
    });

    it('should handle file path containing spaces', (done) => {
        linkCheck.linkCheck('fixtures/s p a c e/A.md', { baseUrl: 'file://' + __dirname }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            done()
        });
    });

    it('should handle baseUrl containing spaces', (done) => {
        linkCheck.linkCheck('A.md', { baseUrl: 'file://' + __dirname + '/fixtures/s p a c e'}, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            done()
        });
    });

    it('should handle file protocol and invalid files', (done) => {
        linkCheck.linkCheck('fixtures/missing.md', { baseUrl: 'file://' + __dirname }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.err.code).to.be('ENOENT');
            expect(result!.status).to.be('dead');
            done()
        });
    });

    it('should ignore file protocol on absolute links', (done) => {
        linkCheck.linkCheck(baseUrl + '/foo/bar', { baseUrl: 'file://' }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.link).to.be(baseUrl + '/foo/bar');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            expect(result!.err).to.be(null);
            done()
        });
    });

    it('should ignore file protocol on fragment links', (done) => {
        linkCheck.linkCheck('#foobar', { baseUrl: 'file://' }, (err, result) => {
            expect(err).to.be(null);

            expect(result!.link).to.be('#foobar');
            done()
        });
    });

    it('should callback with an error on unsupported protocol', (done) => {
        linkCheck.linkCheck('gopher://gopher/0/v2/vstat', (err, result) => {
            expect(result).to.be(null);
            expect(err).to.be.an(Error);
            done();
        });
    });

    it('should handle redirect loops', (done) => {
        linkCheck.linkCheck(baseUrl + '/loop', (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/loop');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(0);
            expect(result!.err.message).to.contain('Exceeded maxRedirects.');
            done();
        });
    });

    it('should honour response codes in opts.aliveStatusCodes[]', (done) => {
        linkCheck.linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 404, 200 ] },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/notfound');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(404);
            done();
        });
    });

    it('should honour regexps in opts.aliveStatusCodes[]', (done) => {
        linkCheck.linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 200, /^[45][0-9]{2}$/ ] },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/notfound');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(404);
            done();
        });
    });

    it('should honour opts.aliveStatusCodes[]', (done) => {
        linkCheck.linkCheck(baseUrl + '/notfound', { aliveStatusCodes: [ 200 ] },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/notfound');
            expect(result!.status).to.be('dead');
            expect(result!.statusCode).to.be(404);
            done();
        });
    });

    it('should retry after the provided delay on HTTP 429 with standard header', (done) => {
        linkCheck.linkCheck(baseUrl + '/later', { retryOn429: true },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/later');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            done();
        });
    });

    it('should retry after the provided delay on HTTP 429 with non standard header, and return a warning', (done) => {
        linkCheck.linkCheck(baseUrl + '/later-non-standard-header', { retryOn429: true },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.err).not.to.be(null)
            expect(result!.err).to.contain("Server returned a non standard \'retry-after\' header.");
            expect(result!.link).to.be(baseUrl + '/later-non-standard-header');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            done();
        });
    });

    it('should retry after 1s delay on HTTP 429 without header', (done) => {
        linkCheck.linkCheck(baseUrl + '/later-no-header', { retryOn429: true, fallbackRetryDelay: '1s' },  (err, result) => {
            expect(err).to.be(null);
            expect(result!.err).to.be(null);
            expect(result!.link).to.be(baseUrl + '/later-no-header');
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            done();
        });
    });

    // 2 is default retry so test with custom 3
    it('should retry 3 times for 429 status codes', (done) => {
        laterCustomRetryCounter = 0;
        linkCheck.linkCheck(baseUrl + '/later-custom-retry-count?successNumber=3', { retryOn429: true, retryCount: 3 }, (err, result) => {
            expect(err).to.be(null);
            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            done();
        });
    });

    it('should handle unicode chars in URLs', (done) => {
        laterCustomRetryCounter = 0;
        linkCheck.linkCheck(baseUrl + '/url_with_unicode–', (err, result) => {
            expect(err).to.be(null);
            expect(result!.err).to.be(null);
            expect(result!.status).to.be('alive');
            expect(result!.statusCode).to.be(200);
            done();
        });
    });

});
