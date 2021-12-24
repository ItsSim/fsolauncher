const { net } = require('electron');
const fs = require( 'fs-extra' );
const { http, https } = require('follow-redirects').wrap({
  http: net,
  https: net,
});
const path = require( 'path' );
const { EventEmitter } = require( 'events' );
/**
 * makeDownload factory
 */
module.exports = function makeDownload() {
  /**
   * Custom HTTP download, with a few more failsafes for dealing
   * with archive.org responses.
   * Supports pause, resume, retry and abort (stop).
   */
  return function download( { from, to, immediate = false } ) {
    const events = new EventEmitter();
    const httpModule = from.startsWith( 'https' ) ? https : http;

    let _retries = 0,
      _failed,
      _hasStarted,
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
      _hasStarted = true;
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
     * @param {string} chunk
     */
    const _onData = chunk => {
      _fileStream.write( chunk );
      _bytesRead += chunk.length;
      _progress = getProgress();
      events.emit( 'progress', _progress );
    };

    /**
     * @param {Error} e
     */
    const _onError = e => {
      _error = e;
      _failed = true;
      _request.abort();
      console.log( 'Download error:', e );
      events.emit( 'error', e.message );
      _onEnd();
    };

    /**
     * @param {HttpResponse} r
     */
    const _onDownload = r => {
      console.log( from, r.headers );
      if ( !r ) return _onError( new Error( 'Server did not return a response.' ) );

      if ( r.statusCode < 200 || r.statusCode > 299 )
        return _onError( new Error( 'Received status code ' + r.statusCode ) );

      _response = r; // Make the response accessible.

      _length = parseInt( r.headers['content-length'], 10 );

      

      r.on( 'data', _onData );
      r.on( 'error', _onError );
      r.on( 'end', _onEnd );

    };

    const _onEnd = () => {
      if ( !_failed ) {
        // Archive.org downloads fail silently when x-page-cache is MISS or EXPIRED.
        if ( _response.headers['x-page-cache'] ) {
          if (
            ['MISS', 'EXPIRED'].includes(
              _response.headers['x-page-cache'].trim()
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
      return await fs.remove( to );
    };
    const getDestination = () => to;
    const getOrigin = () => from;
    const getRetries = () => _retries;

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
      getRetries
    } );
  };
};
