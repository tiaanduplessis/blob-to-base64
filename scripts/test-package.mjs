import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const temp = await mkdtemp(path.join(tmpdir(), 'blob-to-base64-package-'))
const npm = args => execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
  encoding: 'utf8', env: { ...process.env, npm_config_ignore_scripts: 'true' }
})
try {
  const [packed] = JSON.parse(npm(['pack', '--ignore-scripts', '--json', '--pack-destination', temp]))
  assert.deepEqual(packed.files.map(file => file.path).sort(), [
    'LICENSE', 'README.md', 'dist/blob-to-base64.js', 'dist/blob-to-base64.js.map',
    'dist/blob-to-base64.mjs', 'dist/blob-to-base64.mjs.map',
    'dist/blob-to-base64.umd.js', 'dist/blob-to-base64.umd.js.map', 'package.json'
  ])
  const consumer = path.join(temp, 'consumer')
  await mkdir(consumer)
  await writeFile(path.join(consumer, 'package.json'), '{"private":true}')
  npm(['install', '--prefix', consumer, '--ignore-scripts', '--no-audit', '--no-fund', path.join(temp, packed.filename)])
  for (const [mode, load] of [
    ['commonjs', "const convert = require('blob-to-base64')"],
    ['module', "import convert from 'blob-to-base64'"]
  ]) {
    execFileSync(process.execPath, [`--input-type=${mode}`, '-e', `${load};
      if (typeof convert !== 'function') throw new Error('package export is not callable');
      let calls = 0;
      convert({}, error => {
        calls++;
        if (error.message !== 'no fileReader object available') throw error;
      });
      if (calls !== 1) throw new Error('expected one error callback');
    `], { cwd: consumer, stdio: 'inherit' })
  }
  execFileSync(process.execPath, ['--test', 'test/index.test.mjs'], {
    stdio: 'inherit', env: { ...process.env, BLOB_TO_BASE64_PACKAGE: path.join(consumer, 'node_modules/blob-to-base64') }
  })
} finally {
  await rm(temp, { recursive: true, force: true })
}
