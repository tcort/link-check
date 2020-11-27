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
node -e 'require("./lib").linkCheck("https://www.shellcheck.net", {debug: true, timeout: "5s"}, function (err, result) { console.log(result)})'
```
