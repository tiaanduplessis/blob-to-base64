import { mkdir, writeFile } from 'node:fs/promises'
import { transformAsync } from '@babel/core'
import presetEnv from '@babel/preset-env'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { rollup } from 'rollup'
import { minify } from 'terser'

await mkdir('dist', { recursive: true })
for (const [format, filename] of [
  ['cjs', 'blob-to-base64.js'],
  ['es', 'blob-to-base64.mjs'],
  ['umd', 'blob-to-base64.umd.js']
]) {
  const bundle = await rollup({
    input: 'src/index.js',
    external: format === 'umd' ? [] : ['is-blob'],
    plugins: [
      nodeResolve(),
      commonjs(),
      {
        name: 'transpile-es5',
        async transform (code, id) {
          const result = await transformAsync(code, {
            filename: id,
            babelrc: false,
            configFile: false,
            sourceMaps: true,
            presets: [[presetEnv, { targets: { ie: '11' }, modules: false, exclude: ['@babel/plugin-transform-typeof-symbol'] }]]
          })
          return { code: result.code, map: result.map }
        }
      }
    ]
  })
  try {
    const { output } = await bundle.generate({ format, name: 'blobToBase64', exports: 'default', generatedCode: 'es5', sourcemap: true, file: filename })
    const minified = await minify({ [filename]: output[0].code }, {
      ecma: 5,
      module: format === 'es',
      sourceMap: { content: output[0].map.toString(), filename, url: `${filename}.map` }
    })
    await writeFile(`dist/${filename}`, `${minified.code}\n`)
    await writeFile(`dist/${filename}.map`, `${minified.map}\n`)
  } finally {
    await bundle.close()
  }
}
