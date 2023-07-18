const fs = require( 'fs-extra' );
const path = require( 'path' );
const axios = require( 'axios' );
const { EventEmitter } = require( 'events' );

module.exports = function( { from, to, immediate = false } ) {
  const events = new EventEmitter();

  /**
   * @type {number}
   */
  let _retries = 0;

  /**
   * @type {boolean}
   */
  let _failed;

  /**
   * @type {number}
   */
  let _progress;

  /**
   * @type {number}
   */
  let _bytesRead;

  /**
   * @type {number}
   */
  let _length;

  /**
   * @type {Error}
   */
  let _error;

  /**
   * @type {import('fs').WriteStream}
   */
  let _fileStream;

  /**
   * @type {import('axios').CancelTokenSource}
   */
  let _cancelSource;

  /**
   * @type {Promise<import('axios').AxiosResponse<any>>}
   */
  let _promise;

  const run = async () => {
    _failed = false;
    _progress = 0;
    _bytesRead = 0;
    _length = 0;
    _error = null;
    await fs.ensureDir( path.dirname( to ) );
    _fileStream = fs.createWriteStream( to );

    _cancelSource = axios.CancelToken.source();

    _promise = axios( {
      method: 'get',
      url: from,
      responseType: 'stream',
      headers: { 'Pragma': 'no-cache' },
      cancelToken: _cancelSource.token,
    } )
      .then( ( response ) => {
        _onDownload( response );
        response.data.on( 'data', _onData );
        response.data.on( 'end', _onEnd );
      } )
      .catch( _onError );
  };

  const _onData = ( chunk ) => {
    _fileStream.write( chunk );
    _bytesRead += chunk.length;
    _progress = getProgress();
    events.emit( 'progress', _progress );
  };

  const _onError = ( e ) => {
    _error = e;
    _failed = true;
    console.error( 'download error', e );
    events.emit( 'error', e.message );
    _onEnd();
  };

  const _onDownload = ( response ) => {
    console.info( 'downloading', { from, headers: response.headers } );

    _length = parseInt( response.headers[ 'content-length' ], 10 );

    // ...
  };

  const _onEnd = async () => {
    if ( ! _failed ) {
      if ( _bytesRead === 0 ) {
        events.emit(
          'internal-retry',
          'Download size was zero. Retrying download in 5 seconds.'
        );
        return setTimeout( () => retry(), 5000 );
      }
    }

    _progress = 100;
    _fileStream.end();
    events.emit( 'end', to );
  };

  const retry = () => ( _fileStream.end(), _retries++, run() );

  const getProgress = () =>
    parseInt( ( ( 100.0 * _bytesRead ) / _length ).toFixed( 0 ) );
  const getProgressMB = () => ( _bytesRead / 1048576 ).toFixed( 0 );
  const getSizeMB = () => ( _length / 1048576 ).toFixed( 0 );
  const hasFailed = () => _failed;
  const cleanup = async () => {
    if ( _cancelSource ) {
      _cancelSource.cancel();
    }
    if ( _fileStream ) {
      _fileStream.end();
    }
    await fs.remove( to );
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
    getProgress,
    getProgressMB,
    getSizeMB,
    hasFailed,
    cleanup,
    getDestination,
    getOrigin,
    getRetries,
    getError
  } );
};
