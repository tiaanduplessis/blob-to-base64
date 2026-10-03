import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import vm from 'node:vm'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'

const packageRoot = process.env.BLOB_TO_BASE64_PACKAGE || path.resolve('.')
const require = createRequire(path.join(packageRoot, 'package.json'))
const pkg = require('./package.json')
const commonjs = require(packageRoot)
const esm = (await import(pathToFileURL(path.join(packageRoot, pkg.module)))).default
const umdCode = readFileSync(path.join(packageRoot, pkg['umd:main']), 'utf8')

for (const format of ['commonjs', 'esm', 'umd', 'amd']) {
  test(format, async (t) => {
    const dom = new JSDOM('')
    const originalWindow = globalThis.window
    const originalBlob = globalThis.Blob
    globalThis.window = dom.window
    globalThis.Blob = dom.window.Blob
    const nativeReader = dom.window.FileReader
    const context = { window: dom.window, Blob: dom.window.Blob }
    let convert
    if (format === 'umd') {
      vm.runInNewContext(umdCode, context)
      convert = context.blobToBase64
    } else if (format === 'amd') {
      context.define = (dependencies, factory) => {
        if (typeof dependencies === 'function') factory = dependencies
        else assert.deepEqual(Array.from(dependencies), [])
        convert = factory()
      }
      context.define.amd = {}
      vm.runInNewContext(umdCode, context)
    } else {
      convert = format === 'commonjs' ? commonjs : esm
    }
    const blob = () => new dom.window.Blob(['hello'], { type: 'text/plain' })
    const fakeReader = (read) => {
      let instance
      class Reader {
        constructor () { instance = this }
        readAsDataURL (value) { read(this, value) }
      }
      dom.window.FileReader = Reader
      return () => instance
    }
    try {
      await t.test('exports a callable function', () => {
        assert.equal(typeof convert, 'function')
      })
      await t.test('converts actual Blob and FileReader, preserving the data URL', async () => {
        dom.window.FileReader = nativeReader
        let calls = 0
        await new Promise((resolve, reject) => {
          convert(blob(), (error, result) => {
            calls++
            try {
              assert.equal(error, null)
              assert.equal(result, 'data:text/plain;base64,aGVsbG8=')
              resolve()
            } catch (error) { reject(error) }
          })
        })
        await new Promise(resolve => setTimeout(resolve, 10))
        assert.equal(calls, 1)
      })
      await t.test('supports empty and binary blobs', async () => {
        dom.window.FileReader = nativeReader
        for (const [parts, type, expected] of [
          [[], '', 'data:application/octet-stream;base64,'],
          [[new Uint8Array([0, 255, 128, 1])], 'application/octet-stream', 'data:application/octet-stream;base64,AP+AAQ==']
        ]) {
          const result = await new Promise((resolve, reject) => {
            convert(new dom.window.Blob(parts, { type }), (error, value) => error ? reject(error) : resolve(value))
          })
          assert.equal(result, expected)
        }
      })
      await t.test('converts a File selected by a browser input', async () => {
        dom.window.FileReader = nativeReader
        const file = new dom.window.File(['file'], 'file.txt', { type: 'text/plain' })
        const result = await new Promise((resolve, reject) => {
          convert(file, (error, value) => error ? reject(error) : resolve(value))
        })
        assert.equal(result, 'data:text/plain;base64,ZmlsZQ==')
      })
      await t.test('rejects non-blobs once without constructing a reader', () => {
        let constructed = 0
        dom.window.FileReader = class { constructor () { constructed++ } }
        for (const invalid of [undefined, null, 'text', {}, new Uint8Array([1])]) {
          let calls = 0
          assert.doesNotThrow(() => convert(invalid, error => {
            calls++
            assert.equal(error.message, 'provided argument is not blob')
          }))
          assert.equal(calls, 1)
        }
        assert.equal(constructed, 0)
      })
      await t.test('reports unavailable FileReader once', () => {
        for (const unavailable of [undefined, null, {}]) {
          dom.window.FileReader = unavailable
          let calls = 0
          assert.doesNotThrow(() => convert(blob(), error => {
            calls++
            assert.equal(error.message, 'no fileReader object available')
          }))
          assert.equal(calls, 1)
        }
      })
      await t.test('reports missing window once instead of throwing', () => {
        const previous = globalThis.window
        delete globalThis.window
        delete context.window
        let calls = 0
        try {
          assert.doesNotThrow(() => convert(blob(), error => {
            calls++
            assert.equal(error.message, 'no fileReader object available')
          }))
          assert.equal(calls, 1)
        } finally {
          globalThis.window = previous
          context.window = dom.window
        }
      })
      await t.test('registers handlers before a synchronous reader finishes', () => {
        let calls = 0
        fakeReader(reader => { reader.result = 'data:test'; reader.onloadend() })
        convert(blob(), (error, result) => {
          calls++
          assert.equal(error, null)
          assert.equal(result, 'data:test')
        })
        assert.equal(calls, 1)
      })
      await t.test('reports FileReader errors once even after loadend', () => {
        const expected = new Error('read failed')
        let calls = 0
        const instance = fakeReader(() => {})
        convert(blob(), error => { calls++; assert.equal(error, expected) })
        const reader = instance()
        reader.error = expected
        reader.onerror()
        reader.onloadend()
        assert.equal(calls, 1)
      })
      await t.test('checks the error on loadend', () => {
        const expected = new Error('loadend error')
        let calls = 0
        const instance = fakeReader(() => {})
        convert(blob(), error => { calls++; assert.equal(error, expected) })
        instance().error = expected
        instance().onloadend()
        assert.equal(calls, 1)
      })
      await t.test('reports an error when an error event has no reader.error', () => {
        let calls = 0
        const instance = fakeReader(() => {})
        convert(blob(), error => { calls++; assert.equal(error.message, 'failed to read blob') })
        instance().onerror()
        instance().onloadend()
        assert.equal(calls, 1)
      })
      await t.test('reports a real aborted FileReader once', async () => {
        let reader
        dom.window.FileReader = class extends nativeReader {
          constructor () { super(); reader = this }
        }
        let calls = 0
        let reportedError
        convert(blob(), error => { calls++; reportedError = error })
        reader.abort()
        await new Promise(resolve => setTimeout(resolve, 10))
        assert.equal(calls, 1)
        assert.equal(reportedError?.message, 'blob reading aborted')
      })
      await t.test('reports synchronous construction and reading exceptions', () => {
        const expected = new Error('reader exception')
        for (const constructorFails of [true, false]) {
          dom.window.FileReader = class {
            constructor () { if (constructorFails) throw expected }
            readAsDataURL () { throw expected }
          }
          let calls = 0
          assert.doesNotThrow(() => convert(blob(), error => { calls++; assert.equal(error, expected) }))
          assert.equal(calls, 1)
        }
      })
      await t.test('does not swallow a callback exception', () => {
        const expected = new Error('callback exception')
        fakeReader(reader => { reader.result = 'data:test'; reader.onloadend() })
        assert.throws(() => convert(blob(), () => { throw expected }), error => error === expected)
      })
      await t.test('ignores repeated completion events', () => {
        let calls = 0
        const instance = fakeReader(() => {})
        convert(blob(), (error, result) => { calls++; assert.equal(error, null); assert.equal(result, 'data:test') })
        instance().result = 'data:test'
        instance().onloadend()
        instance().onloadend()
        instance().onabort()
        instance().onerror()
        assert.equal(calls, 1)
      })
    } finally {
      if (originalWindow === undefined) delete globalThis.window
      else globalThis.window = originalWindow
      if (originalBlob === undefined) delete globalThis.Blob
      else globalThis.Blob = originalBlob
      dom.window.close()
    }
  })
}
