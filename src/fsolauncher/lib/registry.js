const { captureWithSentry } = require( './utils' );
const { createKey, keyExists, deleteKey, readValue, updateValue } = require( './winreg' );
const { paths, win32Fallbacks } = require( '../constants' ).registry;
const fs = require( 'fs-extra' );

async function hasRegistryAccess() {
  if ( process.platform != 'win32' ) {
    return false;
  }
  try {
    const regKey = 'HKLM\\SOFTWARE\\AAA_' + new Date().toISOString();
    await createKey( regKey );
    await keyExists( regKey );
    await deleteKey( regKey );
    return true;
  } catch ( err ) {
    console.error( err );
    return false;
  }
}

async function checkWindowsFallbacks( code ) {
  const fallbacks = win32Fallbacks[ code ] || [];
  const localPaths = getLocalRegistry();
  if ( localPaths[ code ] ) {
    fallbacks.push( localPaths[ code ] );
  }
  for ( const fallback of fallbacks ) {
    if ( await fs.pathExists( fallback ) ) {
      return stripLocalPath( code, fallback );
    }
  }
  return false;
}

function stripLocalPath( code, path ) {
  switch ( code ) {
  case 'FSO':
    return path.replace( '/FreeSO.exe', '' );
  case 'TSO':
    return path.replace( '/TSOClient/TSOClient.exe', '' );
  case 'Simitone':
    return path.replace( '/Simitone.Windows.exe', '' );
  default:
    return path;
  }
}

/**
 * Gets the installation status for a given software component.
 *
 * @param {string} code - The code name of the software component.
 * @param {string} regPath - The registry path or file path for the software component.
 *
 * @returns {Promise<Object>}
 */
async function getInstallStatus( code, regPath ) {
  if ( process.platform === 'darwin' ) {
    // On MacOS, just check if the file exists
    return {
      key: code,
      isInstalled: ( await fs.pathExists( regPath ) ) ?
        this.stripLocalPath( code, regPath ) : false
    };
  }

  try {
    let isInstalled = false;

    switch ( code ) {
    case 'FSO':
    case 'TSO':
    case 'Simitone':
      isInstalled = await readValue( regPath, 'InstallDir' );
      break;
    case 'TS1': {
      const installPath = await readValue( regPath, 'InstallPath' );
      const gameEdition = await readValue( regPath, 'SIMS_GAME_EDITION' );
      isInstalled = gameEdition == 255 ? installPath : false;
      break;
    }
    case 'NET':
      // By now, .NET will not be an issue
      isInstalled = true;
      break;
    case 'OpenAL':
      isInstalled = await keyExists( regPath );
      break;
    default:
      isInstalled = false;
    }
    if ( ! isInstalled ) {
      isInstalled = await checkWindowsFallbacks( code );
    }
    return { key: code, isInstalled };
  } catch ( err ) {
    console.error( err );
    return { key: code, isInstalled: await checkWindowsFallbacks( code ) };
  }
}

/**
 * @param {(a: Object) => Promise<void>} updateConfig
 * @param {string} installDir
 */
async function createMaxisEntry( updateConfig, installDir ) {
  // Save to backup registry first
  await saveToLocalRegistry( updateConfig, 'TSO', installDir + '/TSOClient/TSOClient.exe' );

  if ( ! await hasRegistryAccess() ) {
    return;
  }
  try {
    await updateValue( 'HKLM\\SOFTWARE\\Maxis\\The Sims Online', 'InstallDir', installDir );
  } catch ( err ) {
    console.error( err );
  }
}

/**
 * @param {(a: Object) => Promise<void>} updateConfig
 * @param {string} installDir
 */
async function createGameEntry( updateConfig, installDir ) {
  // Save to backup registry first
  await saveToLocalRegistry( updateConfig, 'FSO', installDir + '/FreeSO.exe' );

  if ( ! await hasRegistryAccess() ) {
    return;
  }
  try {
    await updateValue( 'HKLM\\SOFTWARE\\Rhys Simpson\\FreeSO', 'InstallDir', installDir );
  } catch ( err ) {
    console.error( err );
  }
}

/**
 * @param {(a: Object) => Promise<void>} updateConfig
 * @param {string} installDir
 */
async function createSimitoneEntry( updateConfig, installDir ) {
  // Save to backup registry first
  await saveToLocalRegistry( updateConfig, 'Simitone', installDir + '/Simitone.Windows.exe' );

  if ( ! await hasRegistryAccess() ) {
    return;
  }
  try {
    await updateValue( 'HKLM\\SOFTWARE\\Rhys Simpson\\Simitone', 'InstallDir', installDir );
  } catch ( err ) {
    console.error( err );
  }
}

async function getLocalRegistry() {
  try {
    /**
     * @type {import('../../main').UserSettings}
     */
    const conf = require( 'ini' ).parse( await require( 'fs-extra' )
      .readFile( global.appData + 'FSOLauncher.ini', 'utf-8' ) );

    return conf.LocalRegistry || {};
  } catch ( err ) {
    captureWithSentry( err );
    console.error( err );
  }
  return {};
}

async function saveToLocalRegistry( updateConfig, key, value ) {
  try {
    await updateConfig( [ 'LocalRegistry', key, value ] );
  } catch ( err ) {
    captureWithSentry( err );
    console.error( err );
  }
}

module.exports = {
  hasRegistryAccess,
  createMaxisEntry,
  createGameEntry,
  createSimitoneEntry,
  getInstalled: () => Promise.all(
    Object.keys( paths )
      .filter( code => ! (
        process.platform === 'win32' && [ 'Mono', 'SDL' ].includes( code )
      ) )
      .map( componentCode =>
        getInstallStatus( componentCode, paths[ componentCode ] )
      )
  ),
};