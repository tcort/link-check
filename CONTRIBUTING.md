Contributing
============

## Fork

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## Development

### Tests

Run test with:
```bash
npm test
```

### Format and lint

Note: should be done before pushing or building a new version

Format code with:
```bash
npm run format
```

Check code syntax (lint) with:
```bash
npm run lint
```

### Build the library

Build library with:
```bash
npm run buiild
```
The library is built in `lib` folder.

### Execute it

One-liner test from shell

```bash
# Compile
npm run build
# Execute
node -e 'require("./lib").linkCheck("https://httpbin.org/status/200", {timeout: "5s"}, function (err, result) { console.log(result)})'
# Execute with debug
node -e 'require("./lib").linkCheck("https://httpbin.org/delay/5", {debug: true, debugToStdErr: true, timeout: "1s"}, function (err, result) { console.log(result)})'
# Test retry on 429
node -e 'require("./lib").linkCheck("https://httpbin.org/status/429", {debug: true, debugToStdErr: true, timeout: "1s", retryOn429: true, fallbackRetryDelay: "2s"}, function (err, result) { console.log(result)})'
# Test retry on error
node -e 'require("./lib").linkCheck("https://dont.exist", {debug: true, debugToStdErr: true, timeout: "1s", retryOnError: true, fallbackRetryDelay: "2s"}, function (err, result) { console.log(result)})'
```


# Release


Tag a new version with:

```bash
npm version major|minor|patch
```

Then github action will publish the tag and create a new release