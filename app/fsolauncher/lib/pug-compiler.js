const { protocol } = require( 'electron' );
const fs = require( 'fs-extra' );
const path = require( 'path' );
const pug = require( 'pug' );
const mime = require( 'mime' );
const EventEmitter = require( 'events' );
const { URL } = require( 'url' );

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
  const parsed = new URL( url );
  let result = decodeURIComponent( parsed.pathname );

  // Local files in Windows start with slash if no host is given
  // file:///c:/something.pug
  if ( process.platform === 'win32' && ! parsed.host.trim() ) {
    result = result.slice( 1 );
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
module.exports = ( options = {}, getLocals = () => ( {} ) ) => {
  const emitter = new PugEmitter();
  protocol.handle( 'file', async ( request ) => {
    const file = getPath( request.url );
    try {
      const content = await fs.readFile( file );
      const ext = path.extname( file );

      if ( ext === '.pug' ) {
        const currentLocals = getLocals();
        const compiled = pug.compileFile( file, options )( currentLocals );
        return new Response( Buffer.from( compiled ), { headers: { 'Content-Type': HTML_MIMETYPE } } );
      } else {
        const mimeType = mime.getType( ext ) || 'application/octet-stream';
        return new Response( content, { headers: { 'Content-Type': mimeType } } );
      }
    } catch ( err ) {
      console.error( 'pug-compiler', err );
      emitter.emit( 'error', err );
      if ( err.code === 'ENOENT' ) {
        return new Response( '', { status: 404 } );
      }
      return new Response( `<pre style="tab-size:1">${err}</pre>`, {
        headers: { 'Content-Type': HTML_MIMETYPE },
        status: 500
      } );
    }
  } );
};
