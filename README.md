
<h1 align="center">blob-to-base64</h1>
<div align="center">
  <strong>Convert Blob to base64</strong>
</div>
<br>
<div align="center">
  <a href="https://npmjs.org/package/blob-to-base64">
    <img src="https://img.shields.io/npm/v/blob-to-base64.svg?style=flat-square" alt="npm package version" />
  </a>
  <a href="https://npmjs.org/package/blob-to-base64">
  <img src="https://img.shields.io/npm/dm/blob-to-base64.svg?style=flat-square" alt="npm downloads" />
  </a>
  <a href="https://github.com/feross/standard">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square" alt="standard JS linter" />
  </a>
  <a href="https://github.com/prettier/prettier">
    <img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square" alt="prettier code formatting" />
  </a>
  <a href="https://travis-ci.org/tiaanduplessis/blob-to-base64">
    <img src="https://img.shields.io/travis/tiaanduplessis/blob-to-base64.svg?style=flat-square" alt="travis ci build status" />
  </a>
  <a href="https://github.com/tiaanduplessis/blob-to-base64/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/blob-to-base64.svg?style=flat-square" alt="project license" />
  </a>
  <a href="http://makeapullrequest.com">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="make a pull request" />
  </a>
</div>

<h2>Table of Contents</h2>
<details>
  <summary>Table of Contents</summary>
  <li><a href="#install">Install</a></li>
  <li><a href="#usage">Usage</a></li>
  <li><a href="#contribute">Contribute</a></li>
  <li><a href="#license">License</a></li>
</details>

## Install

[![Greenkeeper badge](https://badges.greenkeeper.io/tiaanduplessis/blob-to-base64.svg)](https://greenkeeper.io/)

```sh
$ npm install blob-to-base64
# OR
$ yarn add blob-to-base64
```

## Usage

```js
const blobToBase64 = require('blob-to-base64')

const button = document.querySelector('.button')

button.addEventListener('click', function (event) {
  const blob = document.querySelector('.input').files[0]

  blobToBase64(blob, function (error, base64) {
    if (!error) {
      document.querySelector('.result').innerHTML = base64
    }
  })

})
```

The callback receives an error if the input is not a Blob, FileReader is unavailable, or reading fails or is aborted. It is called once per conversion. On success, the result is the complete data URL, including its media type and `base64` prefix.

The CommonJS entry exports the function directly. ES module consumers can use a default import:

```js
import blobToBase64 from 'blob-to-base64'
```

For a browser script tag, use `dist/blob-to-base64.umd.js`, which exposes `window.blobToBase64` and includes its Blob detection dependency. The CommonJS `dist/blob-to-base64.js` entry is intended for `require` or a bundler.

## Development

The development tools require Node.js 22.22.2 or 24.15.0 (or a newer supported LTS release). This does not change the browser runtime API or introduce a Node.js engine requirement for package consumers. Generated browser code retains ES5 syntax.

```sh
npm ci --ignore-scripts
npm run check
```

`check` runs lint, rebuilds every distribution format, tests actual Blob/FileReader behavior, and installs an `npm pack` tarball into an isolated consumer to check its CommonJS, ES module, UMD, and AMD exports. Installation lifecycle scripts are not required.

## Contributing

Contributions are welcome!

1. Fork it.
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

Or open up [a issue](https://github.com/tiaanduplessis/blob-to-base64/issues).

## License

Licensed under the MIT License.
