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

  const _onError = ( e ) => {
    _error = e;
    _failed = true;
    console.error( 'download error', e );
    events.emit( 'error', e.message );

    if ( _retries < maxRetries ) {
      setTimeout( retry, 5000 );
    } else {
      _onEnd();
    }
  };

  const _onDownload = ( response ) => {
    console.info( 'downloading', { from, headers: response.headers } );

    _length = parseInt( response.headers[ 'content-length' ], 10 );
  };

  const _onEnd = async () => {
    if ( ! _failed ) {
      if ( _bytesRead === 0 && _retries < maxRetries ) {
        return setTimeout( retry, 5000 );
      }
    }
    _progress = 100;
    _fileStream.end();
    events.emit( 'end', to );
  };

  const retry = () => {
    console.info( `retrying ${from}` );
    _fileStream.end();
    _retries++;
    run();
  };

  const getProgress = () =>
    parseInt( ( ( 100.0 * _bytesRead ) / _length ).toFixed( 0 ) );
  const getProgressMB = () => ( _bytesRead / 1048576 ).toFixed( 0 );
  const getSizeMB = () => ( _length / 1048576 ).toFixed( 0 );
  const hasFailed = () => _failed;
  const cleanup = async () => {
    if ( _request ) {
      _request.abort();
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
