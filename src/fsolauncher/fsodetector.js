const find = require( 'find-process' );
/**
 * Detects a running FreeSO instance and its running directory.
 *
 * @class FSODetector
 */
class FSODetector {
  constructor( onDetectorResponse ) {
    this.onDetectorResponse = onDetectorResponse;
  }

  start() {
    console.log( 'Started FSODetector' );
    this.interval();
    this.detector = setInterval( this.interval.bind( this ), 30000 );
  }

  stop() {
    clearInterval( this.detector );
  }

  async interval() {
    try {
      let dir = null;
      const gameprocs = await find( 'name', 'FreeSO.exe' );
      //console.log( gameprocs );
      if ( gameprocs.length > 0 ) {
        const gameproc = gameprocs[0];
        if ( gameproc.bin && gameproc.bin.length > 0 ) {
          if( gameproc.bin.indexOf( 'FreeSO.exe' ) > -1 ) {
            dir = require( 'path' ).dirname( gameproc.bin );
          }
        }
      }
      this.onDetectorResponse( dir );
    } catch ( e ) {
      console.log( 'FSODetector failed', e );
    }
  }
}

module.exports = FSODetector;
