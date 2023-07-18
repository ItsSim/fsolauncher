const { promisify } = require( 'util' );
const exec = promisify( require( 'child_process' ).exec );

async function killProc( processName ) {
  let command;

  switch ( process.platform ) {
  case 'win32' :
    // For windows we append .exe to process name
    command = `taskkill /IM ${processName}.exe /F`;
    break;
  case 'darwin' :
    // for macos we consider that a .exe could be running via mono
    command = `pkill -f ${processName} || pkill -f mono ${processName}.exe`;
    break;
  default:
    throw new Error( `Unsupported platform: ${process.platform}` );
  }
  const { stdout, stderr } = await exec( command );
  return { stdout, stderr };
}

async function checkProcRunning( processName ) {
  let command;

  switch ( process.platform ) {
  case 'win32' :
    // For windows we append .exe to process name
    command = `tasklist | findstr ${processName}.exe`;
    break;
  case 'darwin' :
    // for macos we consider that a .exe could be running via mono
    command = `ps -ax | grep ${processName} || ps -ax | grep mono ${processName}.exe`;
    break;
  default:
    throw new Error( `Unsupported platform: ${process.platform}` );
  }
  const { stdout } = await exec( command );
  return stdout.toLowerCase().includes( processName.toLowerCase() );
}

module.exports = { checkProcRunning, killProc };
