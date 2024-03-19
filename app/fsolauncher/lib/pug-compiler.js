const { protocol } = require( 'electron' );
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
  const parsed = require( 'url' ).parse( url );
  let result = decodeURIComponent( parsed.pathname );

  // Local files in Windows start with slash if no host is given
  // file:///c:/something.pug
  if ( process.platform === 'win32' && ! parsed.host.trim() ) {
    result = result.substr( 1 );
  }

  return result;
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
 * @returns {Promise<PugEmitter>}
 */
module.exports = ( options = {}, getLocals = () => ( {} ) ) =>
  new Promise( ( resolve, reject ) => {
    const emitter = new PugEmitter();

    protocol.interceptBufferProtocol( 'file', ( request, result ) => {
      const file = getPath( request.url );

      // See if file actually exists
      try {
        const content = fs.readFileSync( file );
        const ext = path.extname( file );
        let data = { data: content, mimeType: mime.getType( ext ) };

        if ( ext === '.pug' ) {
          // Use getLocals function to retrieve current locals
          const currentLocals = getLocals();
          const compiled = pug.compileFile( file, options )( currentLocals );
          data = { data: Buffer.from( compiled ), mimeType: HTML_MIMETYPE };
        }

        return result( data );
      } catch ( err ) {
        // See here for error numbers:
        // https://code.google.com/p/chromium/codesearch#chromium/src/net/base/net_error_list.h
        let errorData;
        if ( err.code === 'ENOENT' ) {
          errorData = -6;
        } else if ( typeof err.code === 'number' ) {
          errorData = -2;
        } else {
          // Remaining errors are considered to be pug errors
          errorData = { data: Buffer.from( `<pre style="tab-size:1">${err}</pre>` ), mimeType: HTML_MIMETYPE };
        }

        emitter.emit( 'error', err );
        return result( errorData );
      }
    }, err => err ? reject( err ) : resolve( emitter ) );
  } );