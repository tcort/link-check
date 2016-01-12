# link-check

Checks whether a hyperlink is alive (`200 OK`) or dead.

## Installation

    npm install --save link-check

## Specification

A link is said to be 'alive' if an HTTP HEAD or HTTP GET for the given URL
eventually ends in a `200 OK` response. To minimize bandwidth, an HTTP HEAD
is performed. If that fails (e.g. with a `405 Method Not Allowed`), an HTTP
GET is performed. Redirects are followed.

## API

### linkCheck(url, callback)

Given a `url` and a `callback`, attempt an HTTP HEAD and possibly an HTTP GET.
If the `url` is alive, `err` will be `null`, otherwise `err` will be set to an
`Error`.

Parameters:

* `url` string containing a URL.
* `callback` function which accepts `(err)`. `err` will be `null` if the link is alive, otherwise it will be set to an error.

## Examples

    'use strict';

    var linkCheck = require('link-check');
    
    linkCheck('http://example.com', function (err) {
        if (err) {
            console.log('Link is dead');
        } else {
            console.log('Link is alive');
        }
    });

## Testing

    npm test

## License

See [LICENSE.md](https://github.com/tcort/link-check/blob/master/LICENSE.md)
