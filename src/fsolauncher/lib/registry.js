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
          console.log( 'Registry access check failed (on create):', err );
          return resolve( false );
        }
        regKey.keyExists( function( err, exists ) {
          if ( err || ! exists ) {
            console.log( 'Registry access check failed (on keyExists):', err );
            return resolve( false );
          }
          regKey.destroy( function ( err ) {
            if ( err ) {
              console.log( 'Registry access check failed (on destroy):', err );
              return resolve( false );
            }
            console.log( 'Registry access OK: This user can access the Windows registry.' );
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
      '\\SOFTWARE\\Rhys Simpson\\FreeSO' : `${global.homeDir}/Documents/FreeSO/FreeSO.exe`;
  }
  static getTSOPath() {
    return process.platform === 'win32' ? 
      '\\SOFTWARE\\Maxis\\The Sims Online' : `${global.homeDir}/Documents/The Sims Online/TSOClient/TSOClient.exe`;
  }
  static getNETPath() {
    return '\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP';
  }
  static getSimitonePath() {
    return process.platform === 'win32' ?
      '\\SOFTWARE\\Rhys Simpson\\Simitone' : `${global.homeDir}/Documents/Simitone for Windows/Simitone.Windows.exe`;
  }
  static getTS1Path() {
    return process.platform === 'win32' ?
      '\\SOFTWARE\\Maxis\\The Sims' : `${global.homeDir}/Documents/The Sims/Sims.exe`;
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
   * @param {string} program The program ID.
   * 
   * @returns {string|boolean} The path to the program if it is installed,
   */
  static async win32LocalPathFallbacks( program ) {
    const locals = [];
    if ( program == 'FSO' ) {
      locals.push( 'C:/Program Files/FreeSO/FreeSO.exe' );
    }
    if ( program == 'TSO' ) {
      locals.push( 'C:/Program Files/Maxis/The Sims Online/TSOClient/TSOClient.exe' );
      locals.push( 'C:/Program Files/The Sims Online/TSOClient/TSOClient.exe' ); 
    }
    if ( program == 'Simitone' ) {
      locals.push( 'C:/Program Files/Simitone for Windows/Simitone.Windows.exe' );
      locals.push( 'C:/Program Files (x86)/Simitone for Windows/Simitone.Windows.exe' );
    }
    if ( program == 'OpenAL' ) {
      locals.push( 'C:/Program Files (x86)/OpenAL' );
    }
    if ( program == 'TS1' ) {
      locals.push( 'C:/Program Files (x86)/Maxis/The Sims' );
    }
    if ( locals.length > 0 ) {
      for ( let i = 0; i < locals.length; i++ ) {
        const local = locals[i];
        console.log( 'Testing local:', local );
        if ( await require( 'fs-extra' ).pathExists( local ) ) {
          return local;
        }
      }
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
          console.log( 'Testing Mac:', componentCode, regPath, exists );
          resolve( { key: componentCode, isInstalled: exists ? require( 'path' ).dirname( regPath ) : false } );
        } );
      } );
    }
    return new Promise( ( resolve, reject ) => {
      const winreg = require( 'winreg' );
      const regKey = new winreg( { hive: winreg.HKLM, key: regPath } );

      if ( componentCode === 'FSO' || componentCode === 'TSO' || componentCode === 'Simitone' ) {
        regKey.get( 'InstallDir', async ( err, item ) => {
          if ( err ) {
            console.log( err );
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
            console.log( err );
            if ( await this.win32LocalPathFallbacks( componentCode ) ) {
              return resolve( { key: componentCode, isInstalled: true } );
            }
            return resolve( { key: componentCode, isInstalled: false, error: err } );
          }
          // SIMS_GAME_EDITION = 255 All EPs installed.
          regKey.get( 'SIMS_GAME_EDITION', async ( err, item ) => {
            if ( err ) {
              console.log( err );
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
            console.log( err );
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
            console.log( err );
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
          console.log( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          regKey.destroy( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }
            regKey.create( err => {
              if ( err ) {
                console.log( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
                if ( err ) {
                  console.log( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }
                return resolve();
              } );
            } );
          } );
        } else {
          regKey.create( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }
            regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
              if ( err ) {
                console.log( err );
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
   * Creates the *new* default FreeSO Registry Key.
   * Reused for Simitone, second parameter as "Simitone".
   *
   * @param {string} installDir Where FreeSO was installed.
   * @param {string} keyName The name of the registry key.
   * 
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createFreeSOEntry( installDir, keyName = 'FreeSO' ) {
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
          console.log( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          regKey.destroy( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }
            regKey.create( err => {
              if ( err ) {
                console.log( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
                if ( err ) {
                  console.log( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }
                return resolve();
              } );
            } );
          } );
        } else {
          regKey.create( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }
            regKey.set( 'InstallDir', winreg.REG_SZ, installDir, err => {
              if ( err ) {
                console.log( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }
              return resolve();
            } );
          } );
        }
      } );
    } );
  }
}

module.exports = Registry;
