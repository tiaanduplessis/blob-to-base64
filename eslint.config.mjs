import js from '@eslint/js'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  { files: ['src/**/*.js'], languageOptions: { globals: { window: 'readonly' } } },
  { files: ['**/*.mjs'], languageOptions: { globals: { process: 'readonly', setTimeout: 'readonly' } } }
]
