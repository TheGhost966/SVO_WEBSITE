// eslint-config-next ships flat-config arrays natively (Next 16 + ESLint 9) —
// FlatCompat is unnecessary and crashes with a circular-structure error when
// bridging eslint-plugin-react's config objects into legacy eslintrc format.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]

export default eslintConfig
