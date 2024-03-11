const { appData } = require( '../constants' );
const { captureWithSentry, normalizePathSlashes } = require( './utils' );
const { createKey, keyExists, deleteKey, readValue, updateValue } = require( './winreg' );
const { paths, fallbacks: fb } = require( '../constants' ).registry;
const fs = require( 'fs-extra' );

async function hasRegistryAccess() {
  if ( process.platform != 'win32' ) {
    return false;
  }
  try {
    const regKey = 'HKLM\\SOFTWARE\\AAA_' + new Date().toISOString();
    await createKey( regKey );
    if ( ! await keyExists( regKey ) ) {
      throw new Error( 'was not able to create the key' );
    }
    await deleteKey( regKey );
    return true;
  } catch ( err ) {
    console.error( 'no registry access', err );
    return false;
  }
}

async function checkFallbacks( code ) {
  const fallbacks = fb[ code ] || [];
  const localPaths = await getLocalRegistry();
  if ( localPaths[ code ] ) {
    fallbacks.push( localPaths[ code ] );
  }
  for ( const fallback of fallbacks ) {
    if ( await fs.pathExists( fallback ) ) {
      return normalizeLocalPath( fallback );
    }
  }
  return false;
}

function normalizeLocalPath( path ) {
  if ( path ) {
    path = normalizePathSlashes( path );
    path = path.replace( '/FreeSO.exe', '' );
    path = path.replace( '/TSOClient/TSOClient.exe', '' );
    path = path.replace( '/Simitone.Windows.exe', '' );
  }

  return path;
}

/**
 * Gets the installation status for a given software component.
 *
 * @param {string} code - The code name of the software component.
 *
 * @returns {Promise<Object>}
 */
async function getInstallStatus( code ) {
  const regPath = paths[ code ];
  if ( process.platform !== 'win32' ) {
    // On macOS, just check if the file exists
    return {
      key: code,
      isInstalled: ( await fs.pathExists( regPath ) ) ?
        normalizeLocalPath( regPath ) : await checkFallbacks( code )
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
    if ( typeof isInstalled === 'string' ) {
      const exists = await fs.pathExists( isInstalled );
      if ( isInstalled && ! exists ) {
        isInstalled = false;
      }
    }
    if ( ! isInstalled ) {
      isInstalled = await checkFallbacks( code );
    }
    if ( typeof isInstalled === 'string' ) {
      isInstalled = normalizeLocalPath( isInstalled );
    }
    return { key: code, isInstalled };
  } catch ( err ) {
    console.error( err );
    return { key: code, isInstalled: await checkFallbacks( code ) };
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
    const userSettings = require( 'ini' ).parse( await require( 'fs-extra' )
      .readFile( appData + '/FSOLauncher.ini', 'utf-8' ) );

    return userSettings.LocalRegistry || {};
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
      .map( getInstallStatus )
  ),
};