/**
 * Launches executables located in the bin folder of the launcher, such as
 * OpenAL and .NET Framework.
 */
class ExecutableInstaller {
  /**
   * @param {string} file The file to launch.
   */
  run( file ) {
    return new Promise( ( resolve, _reject ) => {
      const child = require( 'child_process' ).exec( file, { cwd: 'bin' } );
      child.on( 'close', _code => resolve() );
      child.stderr.on( 'data', data => console.log( 'stdout: ' + data ) );
    } );
  }
}

module.exports = ExecutableInstaller;
