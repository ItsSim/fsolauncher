module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true,
        "es2021": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 12
    },
    "rules": {
        "no-unused-vars": [2, {"args": "after-used", "argsIgnorePattern": "^_"}],
        "prefer-const": ["error", {
            "destructuring": "any",
            "ignoreReadBeforeAssign": false
        }],
        "space-in-parens": ["error", "always"],
    }
};