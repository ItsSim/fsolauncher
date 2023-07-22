const fs = require( 'fs-extra' );
const { EventEmitter } = require( 'events' );
const { net } = require( 'electron' );
const { http, https } = require( 'follow-redirects' ).wrap( {
  http: net,
  https: net
} );

module.exports = function( { from, to, immediate = false } ) {
  const maxRetries = 5; // Maximum retry limit
  const events = new EventEmitter();
  const httpModule = from.startsWith( 'https' ) ? https : http;

  let _retries = 0;
  let _failed;
  let _progress;
  let _bytesRead = 0;
  let _length;
  let _error;
  let _fileStream;
  let _request;
  let _response;

  const run = async () => {
    _failed = false;
    _progress = 0;
    _bytesRead = 0;
    _length = 0;
    _error = null;
    await fs.ensureDir( require( 'path' ).dirname( to ) );
    _fileStream = fs.createWriteStream( to );

    _request = httpModule.get( from, { headers: { 'Pragma': 'no-cache' } },
      ( response ) => {
        if ( response.statusCode >= 200 && response.statusCode <= 299 ) {
          _onDownload( response );
          response.on( 'data', _onData );
          response.on( 'end', _onEnd );
          response.on( 'error', _onError );
        } else {
          _onError( new Error( 'Non 2xx status code' ) );
        }
      } );

    _request.on( 'error', _onError );
  };

  const _onData = ( chunk ) => {
    _fileStream.write( chunk );
    _bytesRead += chunk.length;
    _progress = getProgress();
    events.emit( 'progress', _progress );
  };

  const _onError = ( err ) => {
    _error = err;
    _failed = true;
    _request.abort();
    console.error( 'download error', err );
    events.emit( 'error', err.message );
    if ( ! retry() ) {
      _onEnd();
    }
  };

  const _onDownload = ( response ) => {
    console.info( 'downloading', { from, headers: response.headers } );
    _response = response;
    _length = parseInt( response.headers[ 'content-length' ], 10 );
  };

  const _onEnd = async () => {
    if ( ! _failed ) {
      if ( _bytesRead === 0 && retry() ) {
        return; // Retrying
      }
    }
    _progress = 100;
    _request.abort();
    _fileStream.end();
    events.emit( 'end', to );
  };

  function retry() {
    if ( _retries < maxRetries ) {
      setTimeout( () => {
        console.info( `retrying ${from}` );
        _request.abort();
        _fileStream.end();
        _retries++;
        run();
      }, 5000 );
      return true;
    }
    console.info( `retries for ${from} depleted` );
    return false;
  }

  const getProgress = () =>
    parseInt( ( ( 100.0 * _bytesRead ) / _length ).toFixed( 0 ) );
  const getProgressMB = () => ( _bytesRead / 1048576 ).toFixed( 0 );
  const getSizeMB = () => ( _length / 1048576 ).toFixed( 0 );
  const hasFailed = () => _failed;
  const cleanup = async () => {
    _request && _request.abort();
    _fileStream && _fileStream.end();
    await fs.remove( to );
  };
  const getDestination = () => to;
  const getOrigin = () => from;
  const getRetries = () => _retries;
  const getError = () => _error;
  const getResponse = () => _response;

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
    getError,
    getResponse
  } );
};
