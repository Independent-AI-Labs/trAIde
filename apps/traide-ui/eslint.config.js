import next from 'eslint-config-next'

export default [
  ...next,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]

