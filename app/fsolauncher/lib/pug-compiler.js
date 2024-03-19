const { protocol } = require( 'electron' );
const { parse: parseUrl } = require( 'url' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const pug = require( 'pug' );
const mime = require( 'mime' );
const EventEmitter = require( 'events' );

const HTML_MIMETYPE = mime.getType( 'html' );

class PugEmitter extends EventEmitter {}

/**
 * Returns path for file from given URL.
 *
 * 'url' module is internally used to parse URLs. For *nix file
 * system URLs 'pathname' of parsed object is used. For Windows,
 * however, local files start with a slash if no host is given
 * and this functions simply drops that leading slash with no
 * further complicated logic.
 *
 * @param  {string} url URL denoting file
 *
 * @return {string} path to file
 */
const getPath = ( url ) => {
  const { pathname } = parseUrl( url );
  return process.platform === 'win32' ? pathname.substring( 1 ).replace( '/', '\\' ) : pathname;
};

/**
 * Registers the pug interceptor.
 *
 * This function must be called after electron app
 * is ready.
 *
 * @param {pug.Options} options pug compiler options
  * @param {Function} getLocals Function that returns the current locals
 *
 * @returns {PugEmitter}
 */
module.exports = ( options = {}, getLocals = () => ( {} ) ) => {
  const emitter = new PugEmitter();

  protocol.interceptBufferProtocol( 'file', async ( request, callback ) => {
    try {
      const file = getPath( request.url );
      const content = await fs.readFile( file );
      const ext = path.extname( file );

      let data = { data: content, mimeType: mime.getType( ext ) };

      if ( ext === '.pug' ) {
        // Use getLocals function to retrieve current locals
        const currentLocals = getLocals();
        const compiled = pug.compileFile( file, options )( currentLocals );
        data = { data: Buffer.from( compiled ), mimeType: HTML_MIMETYPE };
      }

      callback( data );
    } catch ( err ) {
      emitter.emit( 'error', err );

      let errorData;
      if ( err.code === 'ENOENT' ) {
        errorData = -6; // File not found
      } else if ( typeof err.code === 'number' ) {
        errorData = -2; // Generic error
      } else {
        // Treat other errors as Pug-related and display them
        errorData = { data: Buffer.from( `<pre style="tab-size: 1">${err}</pre>` ), mimeType: HTML_MIMETYPE };
      }

      callback( errorData );
    }
  }, err => {
    if ( err ) throw err;
  } );

  return emitter;
};
