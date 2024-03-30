/**
 * Returns the path with backslashes converted to forward slashes.
 *
 * @param {string} dir The path to convert.
 *
 * @returns {string} The converted path.
 */
function normalizePathSlashes( dir ) {
  return dir ? dir.replace( /\\/g, '/' ) : dir;
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

function obfuscatePath( filePath ) {
  if ( typeof filePath !== 'string' ) {
    return filePath;
  }
  // Replace user directory with a placeholder
  const userDirectory = process.env.HOME || process.env.USERPROFILE;
  return filePath.replace( userDirectory, '[USER_DIR]' );
}

const SENTRY_MAX_ERROR_COUNT = 25; // Maximum number of same errors to capture per hour
const SENTRY_RESET_MINUTES = 60; // Reset error count after this many minutes

const sentryErrorCounts = {};

/**
 * Captures an error with Sentry.
 *
 * @param {Error} err The error to capture.
 * @param {Object} extra Extra data to send with the error.
 */
function captureWithSentry( err, extra ) {
  const { captureException } = require( '@sentry/electron' );

  const errorName = err.name + err.message;
  const currentError = sentryErrorCounts[ errorName ] || {
    count: 0,
    timestamp: new Date().getTime()
  };
  const expired = currentError.timestamp <= Date.now() - SENTRY_RESET_MINUTES * 60 * 1000;

  if ( currentError.count < SENTRY_MAX_ERROR_COUNT || expired ) {
    captureException( err, { extra } );

    // If it's been more than SENTRY_RESET_MINUTES since the last error,
    // reset the count.
    // Otherwise, increment it.
    sentryErrorCounts[ errorName ] = {
      count: expired ? 1 : ( currentError.count + 1 ),
      timestamp: new Date().getTime()
    };
  }
}

/**
 * Get JSON from a specified URL.
 *
 * @param {string} url The URL to get the JSON from.
 * @param {number} timeout Duration to wait for a response before rejecting the promise (in milliseconds).
 *
 * @returns {Promise<any>} A promise that resolves with the JSON data from the response.
 */
function getJSON( url, timeout = 30000 ) {
  const { net } = require( 'electron' );
  const { http, https } = require( 'follow-redirects' ).wrap( {
    http: net,
    https: net
  } );
  return new Promise( ( resolve, reject ) => {
    const httpModule = url.startsWith( 'https' ) ? https : http;
    const req = httpModule.get( url, { headers: githubApiHeaders( url ) }, ( response ) => {
      console.info( 'getting json', {
        url,
        statusCode: response.statusCode,
        headers: response.headers
      } );
      let data = '';
      // A response status in the 200 range is a success status and can be resolved
      if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
        response.on( 'data', chunk => data += chunk );
        response.on( 'end', () => {
          clearTimeout( requestTimeout ); // Clear the timeout when response ends
          try {
            resolve( JSON.parse( data ) );
          } catch ( err ) {
            reject( err );
          }
        } );
        response.on( 'error', reject );
      } else {
        reject( new Error( `Request failed with status code ${response.statusCode}` ) );
      }
    } );
    req.on( 'error', ( err ) => {
      clearTimeout( requestTimeout ); // Clear the timeout when error occurs
      reject( err );
    } );
    const requestTimeout = setTimeout( () => {
      req.abort(); // Abort the request on timeout
      reject( new Error( 'Request timed out' ) );
    }, timeout );
  } );
}

function getDisplayRefreshRate() {
  const { screen } = require( 'electron' );

  const primaryDisplay = screen.getPrimaryDisplay();
  const refreshRate = Math.round( primaryDisplay.displayFrequency );
  if ( refreshRate < 30 ) return 30;
  return refreshRate;
}

function githubApiHeaders( url, headers = {} ) {
  if ( url.startsWith( 'https://api.github.com' ) ) {
    const rateLimitToken = process.env.GITHUB_RATELIMIT_TOKEN;
    if ( rateLimitToken ) {
      headers[ 'Authorization' ] = `token ${rateLimitToken}`;
    }
  }
  return headers;
}

function loadDependency( dependencyName ) {
  const { isTestMode } = require( '../constants' );
  if ( isTestMode ) {
    // Attempt to load a stub version if in test mode
    try {
      return require( `../../tests/e2e/stubs/${dependencyName}` );
    } catch ( error ) {
      console.warn( `Stub for ${dependencyName} not found, using real implementation.` );
    }
  }
  // Fallback to real implementation
  return require( dependencyName );
}

function enableFileLogger() {
  const { appData } = require( '../constants' );
  const fs = require( 'fs-extra' );
  const os = require( 'os' );

  const sessionDate = new Date().getTime();
  const logFilePath = appData + `/logs/session-${sessionDate}.log`;
  fs.ensureDirSync( require( 'path' ).dirname( logFilePath ) );

  // Function to append messages to the log file.
  function logToFile( message ) {
    // Ensure message ends with a newline for readability.
    fs.appendFileSync( logFilePath, message + '\n', 'utf8' );
  }

  // Function to format the arguments for logging.
  function formatArgs( args ) {
    return args.map( arg => typeof arg === 'object' ? JSON.stringify( arg, null, 2 ) : arg ).join( ' ' );
  }

  // Store references to the original console methods.
  const originalLog   = console.log;
  const originalInfo  = console.info;
  const originalError = console.error;
  const originalDebug = console.debug;

  console.log = ( ...args ) => {
    logToFile( '[LOG] ' + formatArgs( args ) );
    originalLog.apply( console, args );
  };

  console.info = ( ...args ) => {
    logToFile( '[INFO] ' + formatArgs( args ) );
    originalInfo.apply( console, args );
  };

  console.error = ( ...args ) => {
    logToFile( '[ERROR] ' + formatArgs( args ) );
    originalError.apply( console, args );
  };

  console.debug = ( ...args ) => {
    logToFile( '[DEBUG] ' + formatArgs( args ) );
    originalDebug.apply( console, args );
  };

  console.info( `os: ${os.type()} (${os.platform()}) ${os.release()}` );
  console.info( `arch: ${os.arch()}` );
  console.info( `totalmen: ${( os.totalmem() / 1024 / 1024 ).toFixed( 2 )} MB` );
  console.info( `freemem: ${( os.freemem() / 1024 / 1024 ).toFixed( 2 )} MB` );
  console.info( `uptime: ${( os.uptime() / 60 ).toFixed( 2 )} minutes` );
}

module.exports = {
  normalizePathSlashes,
  strFormat,
  initSentry,
  captureWithSentry,
  getJSON,
  getDisplayRefreshRate,
  githubApiHeaders,
  loadDependency,
  enableFileLogger
};