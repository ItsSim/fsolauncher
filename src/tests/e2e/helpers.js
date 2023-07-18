const { promisify } = require( 'util' );
const exec = promisify( require( 'child_process' ).exec );

async function killProc( processName ) {
  let command;

  switch ( process.platform ) {
  case 'win32':
    // For windows we append .exe to process name
    command = `taskkill /IM ${processName}.exe /F`;
    break;
  case 'darwin':
    // For macos we consider that a .exe could be running via mono
    command = `pkill -f ${processName} || pkill -f mono ${processName}.exe`;
    break;
  default:
    throw new Error( `Unsupported platform: ${process.platform}` );
  }

  console.log( `killProc: executing command ${command}` );

  try {
    const { stdout, stderr } = await exec( command );
    console.log( stdout );
    console.log( `killProc: command executed successfully. stderr: ${stderr}` );
    return { stdout, stderr };
  } catch ( err ) {
    console.error( `killProc: error executing command. Error: ${err}` );
    throw err;
  }
}

async function checkProcRunning( processName ) {
  let command;

  switch ( process.platform ) {
  case 'win32':
    // For windows we append .exe to process name
    command = `tasklist | findstr ${processName}.exe`;
    break;
  case 'darwin':
    // for macos we consider that a .exe could be running via mono
    command = `ps -ax | grep ${processName} || ps -ax | grep mono ${processName}.exe`;
    break;
  default:
    throw new Error( `Unsupported platform: ${process.platform}` );
  }

  console.log( `checkProcRunning: executing command ${command}` );

  try {
    const { stdout } = await exec( command );
    console.log( stdout );
    const isRunning = stdout.toLowerCase().includes( processName.toLowerCase() );
    console.log( `checkProcRunning: command executed successfully. process ${isRunning ? 'is' : 'is not'} running` );
    return isRunning;
  } catch ( err ) {
    console.error( `checkProcRunning: error executing command. Error: ${err}` );
    throw err;
  }
}


module.exports = { checkProcRunning, killProc };
