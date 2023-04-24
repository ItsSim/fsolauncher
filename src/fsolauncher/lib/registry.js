const { captureWithSentry } = require( './utils' );

/**
 * Interacts with a Windows PC Registry to handle all the different
 * keys FreeSO and TSO need to function properly.
 */
class Registry {
  /**
   * Tests to see if the current user has access to the registry by
   * creating and deleting a key.
   * 
   * https://github.com/fresc81/node-winreg#access-to-restricted-keys
   * 
   * @returns {Promise<boolean>} A promise that resolves to true if the
   *                             user has access to the registry.
   */
  static testWinAccess() {
    if ( process.platform != 'win32' ) return Promise.resolve( false );
    const winreg = require( 'winreg' );
    const regKey = new winreg( {
      hive: winreg.HKLM,
      key:  '\\SOFTWARE\\AAA_' + new Date().toISOString()
    } );

    return new Promise( ( resolve, _reject ) => {
      regKey.create( err => {
        if ( err ) {
          console.error( 'Registry access check failed (on create):', err );
          return resolve( false );
        }
        regKey.keyExists( function( err, exists ) {
          if ( err || ! exists ) {
            console.error( 'Registry access check failed (on keyExists):', err );
            return resolve( false );
          }
          regKey.destroy( function ( err ) {
            if ( err ) {
              console.error( 'Registry access check failed (on destroy):', err );
              return resolve( false );
            }
            console.info( 'Registry access OK: This user can access the Windows registry.' );
            resolve( true );
          } )
        } );
      } )
    } );
  }
  static getOpenALPath() {
    return '\\SOFTWARE\\OpenAL';
  }
  static getFSOPath() {
    return process.platform === 'win32' ? 
      '\\SOFTWARE\\Rhys Simpson\\FreeSO' : 
      `${global.homeDir}/Documents/FreeSO/FreeSO.exe`;
  }
  static getTSOPath() {
    return process.platform === 'win32' ? 
      '\\SOFTWARE\\Maxis\\The Sims Online' : 
      `${global.homeDir}/Documents/The Sims Online/TSOClient/TSOClient.exe`;
  }
  static getNETPath() {
    return '\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP';
  }
  static getSimitonePath() {
    return process.platform === 'win32' ?
      '\\SOFTWARE\\Rhys Simpson\\Simitone' : 
      `${global.homeDir}/Documents/Simitone for Windows/Simitone.Windows.exe`;
  }
  static getTS1Path() {
    return process.platform === 'win32' ?
      '\\SOFTWARE\\Maxis\\The Sims' : 
      `${global.homeDir}/Documents/The Sims/Sims.exe`;
  }
  static getMonoPath() {
    return '/Library/Frameworks/Mono.framework';
  }
  static getSDLPath() {
    return '/Library/Frameworks/SDL2.framework';
  }

  /**
   * Checks if the program is installed in several predefined local paths. 
   * This is useful for those cases where the current user does not have access
   * to the registry even in admin mode:
   * 
   * https://github.com/fresc81/node-winreg#access-to-restricted-keys
   * 
   * @param {string} componentCode The program ID.
   * 
   * @returns {string|boolean} The path to the program if it is installed,
   */
  static async win32LocalPathFallbacks( componentCode ) {
    const localRegistry = await this.getLocalRegistry();
    const locals = [];
    if ( localRegistry[componentCode] ) {
      locals.push( localRegistry[componentCode] );
    }
    if ( componentCode == 'FSO' ) {
      locals.push( 'C:/Program Files/FreeSO/FreeSO.exe' );
    }
    if ( componentCode == 'TSO' ) {
      locals.push( 'C:/Program Files/Maxis/The Sims Online/TSOClient/TSOClient.exe' );
      locals.push( 'C:/Program Files/The Sims Online/TSOClient/TSOClient.exe' ); 
    }
    if ( componentCode == 'Simitone' ) {
      locals.push( 'C:/Program Files/Simitone for Windows/Simitone.Windows.exe' );
      locals.push( 'C:/Program Files (x86)/Simitone for Windows/Simitone.Windows.exe' );
    }
    if ( componentCode == 'OpenAL' ) {
      locals.push( 'C:/Program Files (x86)/OpenAL' );
    }
    if ( componentCode == 'TS1' ) {
      locals.push( 'C:/Program Files (x86)/Maxis/The Sims' );
    }
    for ( let i = 0; i < locals.length; i++ ) {
      const local = locals[i];

      console.info( 'testing local:', local );
      if ( ! await require( 'fs-extra' ).pathExists( local ) ) {
        continue;
      }
      console.info( 'found local:', local );

      return this.stripLocalPath( componentCode, local );
    }
    return false;
  }

  /**
   * Returns the status of all the required programs (Installed/not installed).
   *
   * @returns {Promise<object>} A promise that resolves to an object with
   *                            the program names as keys and the status as values.
   */
  static getInstalled() {
    return new Promise( ( resolve, reject ) => {
      const checks = [];

      checks.push( this.get( 'OpenAL',   this.getOpenALPath() ) );
      checks.push( this.get( 'FSO',      this.getFSOPath() ) );
      checks.push( this.get( 'TSO',      this.getTSOPath() ) );
      checks.push( this.get( 'NET',      this.getNETPath() ) );
      checks.push( this.get( 'Simitone', this.getSimitonePath() ) );
      checks.push( this.get( 'TS1',      this.getTS1Path() ) );

      if ( process.platform == 'darwin' ) {
        checks.push( this.get( 'Mono', this.getMonoPath() ) );
        checks.push( this.get( 'SDL',  this.getSDLPath() ) );
      }

      Promise.all( checks )
        .then( a => resolve( a ) )
        .catch( err => reject( err ) );
    } );
  }

  /**
   * Cleans a path to remove the executable name.
   * 
   * @param {string} componentCode The Component to look for.
   * @param {string} path The path to clean.
   * 
   * @returns {string}
   */
  static stripLocalPath( componentCode, path ) {
    if ( componentCode == 'FSO' ) {
      return path.replace( '/FreeSO.exe', '' );
    }
    if ( componentCode == 'TSO' ) {
      return path.replace( '/TSOClient/TSOClient.exe', '' );
    } 
    if ( componentCode == 'Simitone' ) {
      return path.replace( '/Simitone.Windows.exe', '' );
    }
    return path;
  }

  /**
   * Checks if a registry path exists.
   *
   * @param {string} componentCode The Component to look for.
   * @param {string} regPath The registry path to look in.
   * 
   * @returns {Promise<{key: string, isInstalled: string}>}
   */
  static get( componentCode, regPath ) {
    if ( process.platform === 'darwin' ) {
      // when darwin directly test if file exists
      return new Promise( ( resolve, _reject ) => {
        require( 'fs-extra' ).pathExists( regPath, ( _err, exists ) => {
          console.info( 'tested mac:', componentCode, regPath, exists );
          resolve( { 
            key: componentCode, 
            isInstalled: exists ? this.stripLocalPath( componentCode, regPath ) : false 
          } );
        } );
      } );
    }
    return new Promise( ( resolve, reject ) => {
      const winreg = require( 'winreg' );
      const regKey = new winreg( { hive: winreg.HKLM, key: regPath } );

      if ( componentCode === 'FSO' || componentCode === 'TSO' || componentCode === 'Simitone' ) {
        regKey.get( 'InstallDir', async ( err, item ) => {
          if ( err ) {
            console.error( err );
            let isInstalled = false;
            try {
              isInstalled = await this.win32LocalPathFallbacks( componentCode );
            } catch ( err ) {/**/}
            return resolve( { key: componentCode, isInstalled, error: err } );
          }
          return resolve( { key: componentCode, isInstalled: item.value } );
        } );
      } else if ( componentCode === 'TS1' ) {
        regKey.get( 'InstallPath', async ( err, _item ) => {
          if ( err ) {
            console.error( err );
            if ( await this.win32LocalPathFallbacks( componentCode ) ) {
              return resolve( { key: componentCode, isInstalled: true } );
            }
            return resolve( { key: componentCode, isInstalled: false, error: err } );
          }
          // SIMS_GAME_EDITION = 255 All EPs installed.
          regKey.get( 'SIMS_GAME_EDITION', async ( err, item ) => {
            if ( err ) {
              console.error( err );
              if ( await this.win32LocalPathFallbacks( componentCode ) ) {
                return resolve( { key: componentCode, isInstalled: true } );
              }
              return reject( { key: componentCode, isInstalled: false } );
            }
            if ( item.value == 255 ) {
              return resolve( { key: componentCode, isInstalled: true } );
            }
            resolve( { key: componentCode, isInstalled: false } );
          } );
        } );
      } else if ( componentCode === 'NET' ) {
        regKey.keys( ( err, registries ) => {
          if ( err ) {
            console.error( err );
            // Trust our galaxy and return that it’s installed...
            return resolve( { key: componentCode, isInstalled: true, error: err } );
          }
          for ( let i = 0; i < registries.length; i++ ) {
            if (
              registries[i].key.indexOf( 'v4.0' ) > -1 ||
              registries[i].key.indexOf( 'v4' ) > -1
            ) {
              return resolve( { key: componentCode, isInstalled: true } );
            }
          }
          return resolve( { key: componentCode, isInstalled: false } );
        } );
      } else if ( componentCode === 'OpenAL' ) {
        regKey.keyExists( async( err, exists ) => {
          if ( err ) {
            console.error( err );
            let isInstalled = false;
            try {
              isInstalled = await this.win32LocalPathFallbacks( componentCode );
            } catch ( err ) {/**/}
            return resolve( { key: componentCode, isInstalled, error: err } );
          } 

          if ( exists ) {
            return resolve( { key: componentCode, isInstalled: true } );
          } 
          let isInstalled = false;
          try {
            isInstalled = await this.win32LocalPathFallbacks( componentCode );
          } catch ( err ) {/**/}

          return resolve( { key: componentCode, isInstalled } );
        } );
      }
    } );
  }

  /**
   * Creates the default Maxis registry key.
   *
   * @param {string} installDir Where TSO was installed.
   * 
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createMaxisEntry( installDir ) {
    // Save to backup registry first
    // Paths saved to local registry have to lead to the exe file
    await this.saveToLocalRegistry( 'TSO', installDir + '/TSOClient/TSOClient.exe' );

    if ( ! await this.testWinAccess() ) {
      return Promise.resolve();
    }
    return new Promise( ( resolve, reject ) => {
      const winreg = require( 'winreg' );
      const regKey = new winreg( {
        hive: winreg.HKLM,
        key: '\\SOFTWARE\\Maxis\\The Sims Online'
      } );
      regKey.keyExists( ( err, exists ) => {
        if ( err ) {
          console.error( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          regKey.destroy( err => {
            if ( err ) {
              console.error( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }
            regKey.create( err => {
              if ( err ) {
                console.error( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
                if ( err ) {
                  console.error( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }
                return resolve();
              } );
            } );
          } );
        } else {
          regKey.create( err => {
            if ( err ) {
              console.error( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }
            regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
              if ( err ) {
                console.error( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              return resolve();
            } );
          } );
        }
      } );
    } );
  }

  /**
   * Creates a registry key for the game.
   *
   * @param {string} installDir Where the game was installed.
   * @param {string} keyName The name of the registry key.
   * 
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createGameEntry( installDir, keyName ) {
    if ( ! await this.testWinAccess() ) {
      return Promise.resolve();
    }
    return new Promise( ( resolve, reject ) => {
      const winreg = require( 'winreg' );
      const regKey = new winreg( {
        hive: winreg.HKLM,
        key: '\\SOFTWARE\\Rhys Simpson\\' + keyName
      } );
      regKey.keyExists( ( err, exists ) => {
        if ( err ) {
          console.error( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          regKey.destroy( err => {
            if ( err ) {
              console.error( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }
            regKey.create( err => {
              if ( err ) {
                console.error( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
                if ( err ) {
                  console.error( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }
                return resolve();
              } );
            } );
          } );
        } else {
          regKey.create( err => {
            if ( err ) {
              console.error( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }
            regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
              if ( err ) {
                console.error( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              return resolve();
            } );
          } );
        }
      } );
    } );
  }

  /**
   * Creates the default Simitone Registry Key.
   * 
   * @param {string} installDir Where Simitone was installed.
   * 
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createSimitoneEntry( installDir ) {
    // Save to backup registry first.
    // Paths saved to local registry have to lead to the exe file.
    await this.saveToLocalRegistry( 'Simitone', installDir + '/Simitone.Windows.exe' );

    return await this.createGameEntry( installDir, 'Simitone' );
  }

  /**
   * Creates the default FreeSO Registry Key.
   * 
   * @param {string} installDir Where FreeSO was installed.
   * 
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createFreeSOEntry( installDir ) {
    // Save to backup registry first.
    // Paths saved to local registry have to lead to the exe file.
    await this.saveToLocalRegistry( 'FSO', installDir + '/FreeSO.exe' );

    return await this.createGameEntry( installDir, 'FreeSO' );
  }

  /**
   * @returns {Promise<object>}
   */
  static async getLocalRegistry() {
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

  /**
   * @param {string} key
   * @param {string} value
   * 
   * @returns {Promise<void>}
   */
  static async saveToLocalRegistry( key, value ) {
    console.info( 'persisting to local registry', { key, value } );
    try {
      /**
       * @type {import('../../main').UserSettings}
       */
      const conf = require( 'ini' ).parse( await require( 'fs-extra' )
        .readFile( global.appData + 'FSOLauncher.ini', 'utf-8' ) );

      conf.LocalRegistry = conf.LocalRegistry || {};
      conf.LocalRegistry[key] = value;

      await require( 'fs-extra' )
        .writeFile( global.appData + 'FSOLauncher.ini', require( 'ini' )
          .stringify( conf ) );
      console.info( 'persisted to local registry', conf );
    } catch ( err ) {
      captureWithSentry( err );
      console.error( err );
    }
  }
}

module.exports = Registry;
