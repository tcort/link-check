# Changelog

## [Unreleased][]

### Changes

- Migration to typescript
- BREAKING CHANGE: API change. We don't use `module export` anymore to export main function, so code `require('link-check')('http://example.com', ...)` should be rewritten using the named function like this `require('link-check').linkCheck('http://example.com', ...)`
- Add `debug`, `debugToStdErr` and `retryOnError` options

## Version 4.5.2

- #25 fixes 429 "Too Many Requests" retries that don't follow standard (@NicolasMassart)
- #22 Add support for retry count on 429 response codes (@andreizet)

## Version 4.5.1

- update dependencies

## Version 4.5.0

- update dependencies
- add an option to automatically retry on a 429 response (PR #19)

## Version 4.4.7

- update dependencies.
- fix markdown formatting in `README.md` (PR #18)

## Version 4.4.6

- update dependencies.

## Version 4.4.5

- update dependencies.
- add CHANGELOG.md (Issue #17)


[Unreleased]: https://github.com/boillodmanuel/link-check/compare/v4.8.2...HEAD
[4.8.2]: https://github.com/boillodmanuel/link-check/compare/v4.8.1...v4.8.2
[4.8.1]: https://github.com/boillodmanuel/link-check/compare/v4.8.0...v4.8.1
[4.8.0]: https://github.com/boillodmanuel/link-check/compare/v4.7.1...v4.8.0
[4.7.1]: https://github.com/boillodmanuel/link-check/compare/v4.7.0...v4.7.1
[4.7.0]: https://github.com/boillodmanuel/link-check/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/boillodmanuel/link-check/compare/v4.5.4...v4.6.0
[4.5.4]: https://github.com/boillodmanuel/link-check/compare/v4.5.3...v4.5.4
[4.5.3]: https://github.com/boillodmanuel/link-check/tree/v4.5.3