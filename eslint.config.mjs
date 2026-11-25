import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-plugin-next'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      next: nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/', '*.config.js', '*.config.mjs', '*.config.ts'],
  }
)