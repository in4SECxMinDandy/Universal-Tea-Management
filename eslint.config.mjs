import nextPlugin from '@next/eslint-plugin-next'

const eslintConfig = [
  {
    name: 'next/core-web-vitals',
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: nextPlugin.configs.recommended.rules,
  },
]

export default eslintConfig
