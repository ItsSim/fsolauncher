/**
 * Returns the path with backslashes converted to forward slashes.
 * 
 * @param {string} dir The path to convert.
 * @return {string} The converted path.
 */
function normalizePathSlashes( dir ) {
  return dir ? dir.replace( /\\/g, '/' ) : dir
}

/**
 * Formats a string with unlimited arguments.
 * 
 * @param {string} str The string to format.
 * @param {...any} args Values to replace.
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
        if ( global.isTestMode ) {
          return null;
        }
        // Remove all possible PII from the event
        return sanitizeEvent( event );
      },
    } );
  }
}

function sanitizeEvent( event ) {
  // Resulting log is only OS, stacktrace, launcher version
  event = removePII( event );
  event = sanitizeExceptions( event );
  event = sanitizeBreadcrumbs( event );
  event = keepOnlyOSData( event );

  return event;
}

function removePII( event ) {
  if ( event.user ) {
    event.user = {
      id: event.user.id, // Keep the user ID for error tracking purposes
    };
  }
  return event;
}

function keepOnlyOSData( event ) {
  if ( event.contexts ) {
    const osData = event.contexts.os; // Save OS data

    // Remove all device context data
    event.contexts = {
      os: osData, // Keep only OS data
    };
  }
  
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
  const sensitiveKeys = ['password', 'apiKey', 'accessToken', 'secret'];

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
 * @param {Error} error The error to capture.
 * @param {Object} extra Extra data to send with the error.
 */
function captureWithSentry( error, extra ) {
  const { captureException } = require( '@sentry/electron' );
  if ( ! global.isTestMode ) {
    captureException( error, { extra } );
  }
}

module.exports = {
  normalizePathSlashes, strFormat, initSentry, captureWithSentry
};