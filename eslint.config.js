const js = require('@eslint/js');
const securityPlugin = require('eslint-plugin-security');

module.exports = [
  js.configs.recommended,
  {
    // Common configuration for all files
    files: ['**/*.js'],
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      'coverage/**',
      'test/**',
      '__tests__/**',
      '**/*.test.js',
      '**/*.spec.js'
    ],
    plugins: {
      security: securityPlugin
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Common globals
        console: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FormData: 'readonly',
        Audio: 'readonly',
        URL: 'readonly',
        // Browser timers
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'no-control-regex': 'error',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'error'
    }
  },
  // Files that use CommonJS / Node globals
  {
    files: [
      'bot.js',
      'index.js',
      'main.js',
      'preload.js',
      'renderer.js',
      'utils/**'
    ],
    languageOptions: {
      sourceType: 'script',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        process: 'readonly',
        // keep timers and browser-ish globals available in these files too
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        Audio: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly'
      }
    },
    rules: {
      // allow non-literal fs names in Electron main/preload where it's unavoidable
      'security/detect-non-literal-fs-filename': 'off'
    }
  },
  // Electron main specific rules
  {
    files: ['main.js'],
    languageOptions: {
      globals: {
        electron: 'readonly'
      }
    }
  },
  {
    files: ['preload.js', 'renderer.js'],
    languageOptions: {
      globals: {
        electron: 'readonly'
      }
    }
  }
];