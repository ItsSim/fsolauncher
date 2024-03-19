module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es6': true,
    'node': true,
    'es2021': true
  },
  'extends': 'eslint:recommended',
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parserOptions': {
    'ecmaVersion': 12
  },
  'ignorePatterns': [ '**/vendor/*.js' ],
  'rules': {
    'no-unused-vars': [ 'error', { 'args': 'after-used', 'argsIgnorePattern': '^_' } ],
    'prefer-const': 'error',
    'space-in-parens': [ 'error', 'always' ],
    'space-before-blocks': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'quotes': [ 'error', 'single', { 'avoidEscape': true } ],
    'object-curly-spacing': [ 'error', 'always' ],
    'semi': [ 'error', 'always' ],
    'indent': [ 'error', 2 ],
    'computed-property-spacing': [ 'error', 'always' ],
    'no-trailing-spaces': 'error',
    'space-infix-ops': 'error',
    'key-spacing': [ 'error', { 'beforeColon': false, 'afterColon': true } ],
    'keyword-spacing': [
      'error', { 'before': true, 'after': true }
    ],
    'space-unary-ops': [
      'error',
      {
        'words': true,
        'nonwords': false,
        'overrides': {
          '!': true
        }
      }
    ],
    'no-var': 'error',
  }
};