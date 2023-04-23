/**
 * Launches executables located in the bin folder of the launcher, such as
 * OpenAL and .NET Framework.
 */
class ExecutableInstaller {
  /**
   * @param {string} file The file to launch.
   * @param {Array<string>} options The options to pass to the installer.
   */
  run( file, options ) {
    return new Promise( ( resolve, reject ) => {
      const spawnOptions = { cwd: 'bin' };
      const args = options || [];
      const child = require( 'child_process' ).spawn( file, args, spawnOptions );
      
      child.on( 'close', _code => resolve() );
      child.on( 'error', err => {
        console.log( err );
        reject( err );
      } );
      child.stderr.on( 'data', data => console.log( 'stderr: ' + data ) );
      child.stdout.on( 'data', data => console.log( 'stdout: ' + data ) );
    } );
}
}

module.exports = ExecutableInstaller;
