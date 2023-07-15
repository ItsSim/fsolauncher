const util = require( 'util' );
const exec = util.promisify( require( 'child_process' ).exec );

const registryPath = `${process.env.windir}\\system32\\reg.exe`;

const readFromRegistry = async ( keyPath, valueName ) => {
  const { stdout } = await exec( `${registryPath} query "${keyPath}" /v "${valueName}"` );
  const match = stdout.match( /REG_[^ ]+\s+([^\r\n]+)/ );
  if ( match ) {
    return match[ 1 ];
  } else {
    throw new Error( 'Failed to parse registry output' );
  }
};

module.exports = {
  createKey: async ( keyPath ) => {
    const { stdout } = await exec( `${registryPath} add "${keyPath}"` );

    return stdout;
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
    const { stdout } = await exec( `${registryPath} add "${keyPath}" /v "${valueName}" /t "${type}" /d "${data}" /f` );

    return stdout;
  },
  deleteKey: async ( keyPath ) => {
    const { stdout } = await exec( `${registryPath} delete "${keyPath}" /f` );

    return stdout;
  },
  keyExists: async ( keyPath ) => {
    try {
      // Try checking the 64-bit registry first.
      await exec( `${registryPath} query "${keyPath}"` );
      return true;
    } catch ( error ) {
      // If that fails, try checking the 32-bit registry.
      try {
        await exec( `${registryPath} query "${keyPath.replace( 'SOFTWARE\\', 'SOFTWARE\\WOW6432Node\\' )}"` );
        return true;
      } catch ( error ) {
        return false;
      }
    }
  }
};
