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
        'no-unused-vars': [ 'warn', { 'args': 'after-used', 'argsIgnorePattern': '^_' } ],
        'prefer-const': [ 'error', {
            'destructuring': 'any',
            'ignoreReadBeforeAssign': false
        } ],
        'space-in-parens': [ 'error', 'always' ],
        'space-before-blocks': [ 'error', 'always' ],
        'array-bracket-spacing': [ 'error', 'always' ],
        'quotes': [ 'error', 'single' ],
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
        ]
    }
};