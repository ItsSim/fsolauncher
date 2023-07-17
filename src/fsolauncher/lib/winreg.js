const cp = require( 'child_process' );
const path = require( 'path' );
const registryPath = path.join( process.env.windir, 'system32', 'reg.exe' );

const runWithUTF8 = ( args = [] ) => {
  return new Promise( ( resolve, reject ) => {
    const child = cp.spawn( `chcp 65001 >nul && ${registryPath}`, args, { shell: true } );

    let stdout = '', stderr = '';
    child.stdout.on( 'data', ( data ) => stdout += data );
    child.stderr.on( 'data', ( data ) => stderr += data );

    child.on( 'exit', ( code ) => {
      if ( code !== 0 ) {
        const cmd = registryPath + ' ' + args.join( ' ' );
        reject( new Error( `${cmd}\n${stderr}` ) );
      } else {
        resolve( stdout );
      }
    } );
    child.on( 'error', reject );
  } );
};

const readFromRegistry = async ( keyPath, valueName ) => {
  const stdout = await runWithUTF8( [ 'QUERY', `"${keyPath}"`, '/v', `"${valueName}"` ] );
  const match = stdout.match( /REG_[^ ]+\s+([^\r\n]+)/ );
  if ( match ) {
    return match[ 1 ];
  }
  throw new Error( 'failed to parse registry output' );
};

module.exports = {
  createKey: async ( keyPath ) => {
    return await runWithUTF8( [ 'ADD', `"${keyPath}"` ] );
  },
  readValue: async ( keyPath, valueName ) => {
    try {
      // Try reading from the 64-bit registry first.
      return await readFromRegistry( keyPath, valueName );
    } catch ( error ) {
      // If that fails, try reading from the 32-bit registry.
      return await readFromRegistry( keyPath.replace( 'SOFTWARE\\', 'SOFTWARE\\WOW6432Node\\' ), valueName );
    }
  },
  updateValue: async ( keyPath, valueName, data, type = 'REG_SZ' ) => {
    return await runWithUTF8( [ 'ADD', `"${keyPath}"`, '/v', `"${valueName}"`, '/t', type, '/d', `"${data}"`, '/f' ] );
  },
  deleteKey: async ( keyPath ) => {
    return await runWithUTF8( [ 'DELETE', `"${keyPath}"`, '/f' ] );
  },
  keyExists: async ( keyPath ) => {
    try {
      // Try checking the 64-bit registry first.
      await runWithUTF8( [ 'QUERY', `"${keyPath}"` ] );
      return true;
    } catch ( error ) {
      // If that fails, try checking the 32-bit registry.
      try {
        await runWithUTF8( [ 'QUERY', `"${keyPath}"`.replace( 'SOFTWARE\\', 'SOFTWARE\\WOW6432Node\\' ) ] );
        return true;
      } catch ( error ) {
        return false;
      }
    }
  }
};
