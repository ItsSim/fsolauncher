const { net } = require( 'electron' );
const fs = require( 'fs-extra' );
const { http, https } = require( 'follow-redirects' ).wrap( {
  http: net,
  https: net,
} );
const path = require( 'path' );
const { EventEmitter } = require( 'events' );

async function sampleFileBytes( filePath, byteCount = 102400 ) {
  const stats = await fs.stat( filePath );

  // Read the first bytes
  const firstBuffer = await fs.readFile( filePath, { length: byteCount } );

  // Read the last bytes
  const start = stats.size - byteCount;
  const fd = await fs.open( filePath, 'r' );
  const lastBuffer = Buffer.alloc( byteCount );
  await fd.read( lastBuffer, 0, byteCount, start );
  await fd.close();

  return {
    firstBytes: firstBuffer.toString( 'base64' ),
    lastBytes: lastBuffer.toString( 'base64' )
  };
}

/**
 * Custom HTTP download, with a few more failsafes for dealing with archive.org responses.
 * Supports pause, resume, retry and abort (stop).
 */
module.exports = function( { from, to, immediate = false } ) {
  const events = new EventEmitter();
  const httpModule = from.startsWith( 'https' ) ? https : http;

  let _retries = 0,
    _failed,
    _progress,
    _bytesRead,
    _length,
    _paused,
    _error,
    _fileStream,
    _request,
    _response;

  const run = async () => {
    _failed = false;
    _progress = 0;
    _bytesRead = 0;
    _length = 0;
    _paused = false;
    _error = null;
    await fs.ensureDir( path.dirname( to ) );
    _fileStream = fs.createWriteStream( to );
    _request = httpModule.get( from, { headers: { 'Pragma': 'no-cache' } }, _onDownload );
    _request.on( 'error', _onError );
  };

  /**
   * @param {string} chunk The chunk of data to write to the file.
   */
  const _onData = chunk => {
    _fileStream.write( chunk );
    _bytesRead += chunk.length;
    _progress = getProgress();
    events.emit( 'progress', _progress );
  };

  /**
   * @param {Error} e The error that occurred.
   */
  const _onError = e => {
    _error = e;
    _failed = true;
    _request.abort();
    console.error( 'download error', e );
    events.emit( 'error', e.message );
    _onEnd();
  };

  /**
   * @param {HttpResponse} r
   */
  const _onDownload = r => {
    console.info( 'downloading', { from, headers: r.headers } );
    if ( ! r ) return _onError( new Error( 'Server did not return a response.' ) );

    if ( r.statusCode < 200 || r.statusCode > 299 )
      return _onError( new Error( 'Received status code ' + r.statusCode ) );

    _response = r; // Make the response accessible.

    _length = parseInt( r.headers[ 'content-length' ], 10 );

    r.on( 'data', _onData );
    r.on( 'error', _onError );
    r.on( 'end', _onEnd );
  };

  const _onEnd = () => {
    if ( ! _failed ) {
      // Archive.org downloads fail silently when x-page-cache is MISS or EXPIRED.
      if ( _response.headers[ 'x-page-cache' ] ) {
        if (
          [ 'MISS', 'EXPIRED' ].includes(
            _response.headers[ 'x-page-cache' ].trim()
          )
        ) {
          events.emit(
            'internal-retry',
            'X-Page-Cache header present with value "MISS" or "EXPIRED". Retrying download in 5 seconds.'
          );
          return setTimeout( () => retry(), 5000 );
        }
      }
      // Nonetheless, check if the filesize is 0 and retry.
      if ( _bytesRead == 0 ) {
        events.emit(
          'internal-retry',
          'Download size was zero. Retrying download in 5 seconds.'
        );
        return setTimeout( () => retry(), 5000 );
      }
    }
    // If we've gone this far, we're most likely OK.
    _progress = 100;
    _request.abort();
    _fileStream.end();
    events.emit( 'end', to );

    try {
      sampleFileBytes( to ).then( fileSample => {
        console.log( `First bytes of ${to} (base64 encoded): `, fileSample );
      } );
    } catch ( error ) {
      console.error( 'Error when sampling file bytes: ', error );
    }
  };

  const retry = () => (
    _request.abort(), _fileStream.end(), _retries++, run()
  );
  const pause = () => _response && ( _response.pause(), ( _paused = 1 ) );
  const abort = () => _request && _request.abort();
  const resume = () => _paused && _response.resume();

  const getProgress = () =>
    parseInt( ( ( 100.0 * _bytesRead ) / _length ).toFixed( 0 ) );
  const getProgressMB = () => ( _bytesRead / 1048576 ).toFixed( 0 );
  const getSizeMB = () => ( _length / 1048576 ).toFixed( 0 );
  const hasFailed = () => _failed;
  const cleanup = async () => {
    _request && _request.abort();
    _fileStream && _fileStream.end();
    return fs.remove( to );
  };
  const getDestination = () => to;
  const getOrigin = () => from;
  const getRetries = () => _retries;
  const getError = () => _error;

  if ( immediate ) run();

  return Object.freeze( {
    events,
    run,
    retry,
    pause,
    abort,
    resume,
    getProgress,
    getProgressMB,
    getSizeMB,
    getDestination,
    getOrigin,
    hasFailed,
    cleanup,
    getRetries,
    getError
  } );
};

