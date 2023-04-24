/**
 * Returns the path with backslashes converted to forward slashes.
 * 
 * @param {string} dir The path to convert.
 * 
 * @returns {string} The converted path.
 */
function normalizePathSlashes( dir ) {
  return dir ? dir.replace( /\\/g, '/' ) : dir
}

/**
 * Formats a string with unlimited arguments.
 * 
 * @param {string} str The string to format.
 * @param {...any} args Values to replace.
 * 
 * @returns {string} The formatted string.
 */
function strFormat( str, ...args ) {
  return args.reduce( ( s, v ) => s.replace( '%s', v ), str );
}

function initSentry() {
  const { dsn } = require( '../../sentry.config' );
  if ( dsn !== 'SENTRY_CI_DSN' ) {
    require( '@sentry/electron' ).init( {
      dsn,
      integrations: defaultIntegrations => defaultIntegrations.filter(
        integration => integration.name !== 'Net'
      ),
      beforeSend( event ) {
        return sanitizeEvent( event );
      },
    } );
  }
}

function sanitizeEvent( event ) {
  event = sanitizeExceptions( event );
  event = sanitizeBreadcrumbs( event );

  return event;
}

function sanitizeExceptions( event ) {
  if ( event.exceptions && event.exceptions.values ) {
    event.exceptions.values.forEach( ( exception ) => {
      if ( exception.stacktrace && exception.stacktrace.frames ) {
        exception.stacktrace.frames.forEach( ( frame ) => {
          frame.filename = obfuscatePath( frame.filename ); // Obfuscate local file paths
        } );
      }
    } );
  }
  return event;
}

function sanitizeBreadcrumbs( event ) {
  if ( event.breadcrumbs ) {
    event.breadcrumbs.forEach( ( breadcrumb ) => {
      if ( breadcrumb.data ) {
        breadcrumb.data = obfuscatePossibleKeys( breadcrumb.data ); // Obfuscate possible keys with data
      }
    } );
  }
  return event;
}

function obfuscatePath( filePath ) {
  if ( typeof filePath !== 'string' ) {
    return filePath;
  }
  // Replace user directory with a placeholder
  const userDirectory = process.env.HOME || process.env.USERPROFILE;
  return filePath.replace( userDirectory, '[USER_DIR]' );
}

function obfuscatePossibleKeys( data ) {
  // Define keys that may exist in the data object and should be removed
  const sensitiveKeys = [ 'password', 'apiKey', 'accessToken', 'secret' ];

  const obfuscatedData = {};

  for ( const key in data ) {
    if ( sensitiveKeys.includes( key ) ) {
      obfuscatedData[key] = '[REDACTED]';
    } else {
      obfuscatedData[key] = data[key];
    }
  }

  return obfuscatedData;
}

/**
 * Captures an error with Sentry.
 * 
 * @param {Error} err The error to capture.
 * @param {Object} extra Extra data to send with the error.
 */
function captureWithSentry( err, extra ) {
  const { captureException } = require( '@sentry/electron' );
  captureException( err, { extra } );
}

function getJSON( options ) {
  const { net } = require( 'electron' );
  const { https } = require( 'follow-redirects' ).wrap( {
    http: net,
    https: net,
  } );
  return new Promise( ( resolve, reject ) => {
    const request = https.request( options, res => {
      console.info( 'getting json', { options, headers: res.headers } );
      let data = '';
      res.on( 'data', chunk => data += chunk );
      res.on( 'end', () => {
        try {
          resolve( JSON.parse( data ) );
        } catch ( err ) {
          reject( err );
        }
      } );
    } );
    request.setTimeout( 30000, () => reject( 'Timed out' ) );
    request.on( 'error', err => reject( err ) );
    request.end();
  } );
}

function getDisplayRefreshRate() {
  const { screen } = require( 'electron' );

  if ( process.platform == 'win32' ) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const refreshRate = primaryDisplay.displayFrequency;
    if ( refreshRate < 30 ) return 30;
    return refreshRate;
  }
  return 60;
}

/**
 * @param {import('@sentry/electron').Event} event
 */
function emitSentryEvent( event ) {
  const { captureEvent } = require( '@sentry/electron' );
  captureEvent( event );
}

module.exports = {
  normalizePathSlashes, 
  strFormat, 
  initSentry, 
  captureWithSentry, 
  getJSON,
  getDisplayRefreshRate,
  emitSentryEvent
};