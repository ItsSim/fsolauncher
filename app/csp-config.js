const cspDirectives = {
  'default-src': [ "'self'" ],
  'script-src': [ "'self'", 'https://*.sentry-cdn.com' ],
  'worker-src': [ "'self'", 'blob:' ],
  'style-src': [ "'self'", "'unsafe-inline'" ],
  'connect-src': [
    "'self'",
    'wss://*.freeso.org',
    'wss://freeso.org',
    'https://*.freeso.org',
    'https://freeso.org',
    'https://*.sentry.io',
    'https://sentry.io',
  ],
  'img-src': [ "'self'", 'data:', 'https://*.sentry-cdn.com' ],
  'font-src': [ "'self'", 'data:' ],
};

module.exports = ( directives = cspDirectives ) => Object.entries( directives )
  .map( ( [ directive, sources ] ) => `${directive} ${sources.join( ' ' )}` )
  .join( '; ' );