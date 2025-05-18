import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import reactPlugin from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const compat = new FlatCompat()

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config(reactPlugin.configs.recommended),
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  }
)