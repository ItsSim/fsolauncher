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
    if( process.platform != "win32" ) return Promise.resolve( false );
    const Registry = require( 'winreg' );
    const regKey = new Registry( {
      hive: Registry.HKLM,
      key:  '\\SOFTWARE\\AAA_' + new Date().toISOString()
    } );

    return new Promise( ( resolve, _reject ) => {
      regKey.create( err => {
        if( err ) {
          console.log( 'Registry access check failed (on create):', err );
          return resolve( false );
        }
        regKey.keyExists( function( err, exists ) {
          if( err || !exists ) {
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
    return "\\SOFTWARE\\OpenAL";
  }
  static getFSOPath() {
    return process.platform === "win32" ? 
      "\\SOFTWARE\\Rhys Simpson\\FreeSO" : `${global.homeDir}/Documents/FreeSO/FreeSO.exe`;
  }
  static getTSOPath() {
    return process.platform === "win32" ? 
      "\\SOFTWARE\\Maxis\\The Sims Online" : `${global.homeDir}/Documents/The Sims Online/TSOClient/TSOClient.exe`;
  }
  static getNETPath() {
    return "\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP";
  }
  static getSimitonePath() {
    return process.platform === "win32" ?
      "\\SOFTWARE\\Rhys Simpson\\Simitone" : `${global.homeDir}/Documents/Simitone for Windows/Simitone.Windows.exe`;
  }
  static getTS1Path() {
    return process.platform === "win32" ?
      "\\SOFTWARE\\Maxis\\The Sims" : `${global.homeDir}/Documents/The Sims/Sims.exe`;
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
   * @returns {string|boolean} The path to the program if it is installed,
   */
  static async win32LocalPathFallbacks( program ) {
    const locals = [];
    if( program == 'FSO' ) {
      locals.push( 'C:/Program Files/FreeSO' );
    }
    if( program == 'TSO' ) {
      locals.push( 'C:/Program Files/Maxis/The Sims Online' );
      locals.push( 'C:/Program Files/The Sims Online' ); 
    }
    if( program == 'Simitone' ) {
      locals.push( 'C:/Program Files/Simitone for Windows' );
      locals.push( 'C:/Program Files (x86)/Simitone for Windows' );
    }
    if( program == 'OpenAL' ) {
      locals.push( 'C:/Program Files (x86)/OpenAL' );
    }
    if( program == 'TS1' ) {
      locals.push( 'C:/Program Files (x86)/Maxis/The Sims' );
    }
    if( locals.length > 0 ) {
      for ( let i = 0; i < locals.length; i++ ) {
        const local = locals[i];
        console.log( 'Testing local:', local );
        const exists = await require( 'fs-extra' ).exists( local );
        if( exists ) return local;
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
      const Promises = [];

      Promises.push( Registry.get( 'OpenAL', Registry.getOpenALPath() ) );
      Promises.push( Registry.get( 'FSO', Registry.getFSOPath() ) );
      Promises.push( Registry.get( 'TSO', Registry.getTSOPath() ) );
      Promises.push( Registry.get( 'NET', Registry.getNETPath() ) );
      Promises.push( Registry.get( 'Simitone', Registry.getSimitonePath() ) );
      Promises.push( Registry.get( 'TS1', Registry.getTS1Path() ) );
      if( process.platform == 'darwin' ) {
        Promises.push( Registry.get( 'Mono', Registry.getMonoPath() ) );
        Promises.push( Registry.get( 'SDL', Registry.getSDLPath() ) );
      }

      Promise.all( Promises )
        .then( a => resolve( a ) )
        .catch( err => reject( err ) );
    } );
  }
  /**
   * Checks if a registry key exists.
   *
   * @param {string} e The Component to look for.
   * @param {string} p The Registry Key to look in.
   * @returns {Promise<{key: string, isInstalled: string}>}
   */
  static get( e, p ) {
    if( process.platform === "darwin" ) {
      // when darwin directly test if file exists
      return new Promise( ( resolve, _reject ) => {
        require( 'fs-extra' ).pathExists( p, ( _err, exists ) => {
          console.log( 'Testing Mac:', e, p, exists );
          resolve( { key: e, isInstalled: exists ? require( 'path' ).dirname( p ) : false } );
        } );
      } );
    }
    return new Promise( ( resolve, reject ) => {
      const Registry = require( 'winreg' );
      const Key = new Registry( { hive: Registry.HKLM, key: p } );

      if ( e === 'FSO' || e === 'TSO' || e === 'Simitone' ) {
        Key.get( 'InstallDir', async ( err, RegistryItem ) => {
          if ( err ) {
            console.log( err );
            let isInstalled = false;
            try {
              isInstalled = await this.win32LocalPathFallbacks( e );
            } catch( err ) {/**/}
            return resolve( { key: e, isInstalled, error: err } );
          }
          return resolve( { key: e, isInstalled: RegistryItem.value } );
        } );
      } else if ( e === 'TS1' ) {
        Key.get( 'InstallPath', async ( err, _RegistryItem ) => {
          if ( err ) {
            console.log( err );
            if( await this.win32LocalPathFallbacks( e ) ) {
              return resolve( { key: e, isInstalled: true } );
            }
            return resolve( { key: e, isInstalled: false, error: err } );
          }
          // SIMS_GAME_EDITION = 255 All EPs installed.
          Key.get( 'SIMS_GAME_EDITION', async ( err, RegistryItem ) => {
            if ( err ) {
              console.log( err );
              if( await this.win32LocalPathFallbacks( e ) ) {
                return resolve( { key: e, isInstalled: true } );
              }
              return reject( { key: e, isInstalled: false } );
            }

            if ( RegistryItem.value == 255 ) {
              return resolve( { key: e, isInstalled: true } );
            }
            resolve( { key: e, isInstalled: false } );
          } );
        } );
      } else if ( e === 'NET' ) {
        Key.keys( ( err, Registries ) => {
          if ( err ) {
            console.log( err );
            // Trust our galaxy and return that it’s installed...
            return resolve( { key: e, isInstalled: true, error: err } );
          }
          for ( let i = 0; i < Registries.length; i++ ) {
            if (
              Registries[i].key.indexOf( 'v4.0' ) > -1 ||
              Registries[i].key.indexOf( 'v4' ) > -1
            ) {
              return resolve( { key: e, isInstalled: true } );
            }
          }
          return resolve( { key: e, isInstalled: false } );
        } );
      } else if ( e === 'OpenAL' ) {
        Key.keyExists( async( err, exists ) => {
          if ( err ) {
            console.log( err );
            let isInstalled = false;
            try {
              isInstalled = await this.win32LocalPathFallbacks( e );
            } catch( err ) {/**/}
            return resolve( { key: e, isInstalled, error: err } );
          } 

          if ( exists ) {
            return resolve( { key: e, isInstalled: true } );
          } 
          let isInstalled = false;
          try {
            isInstalled = await this.win32LocalPathFallbacks( e );
          } catch( err ) {/**/}

          return resolve( { key: e, isInstalled } );
        } );
      }
    } );
  }
  /**
   * Creates the default Maxis registry key.
   *
   * @param {string} InstallDir Where TSO was installed.
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createMaxisEntry( InstallDir ) {
    if( ! await Registry.testWinAccess() ) {
      return Promise.resolve();
    }

    return new Promise( ( resolve, reject ) => {
      const Registry = require( 'winreg' );
      const Key = new Registry( {
        hive: Registry.HKLM,
        key: '\\SOFTWARE\\Maxis\\The Sims Online'
      } );

      Key.keyExists( ( err, exists ) => {
        if ( err ) {
          console.log( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          Key.destroy( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }

            Key.create( err => {
              if ( err ) {
                console.log( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }

              Key.set( 'InstallDir', Registry.REG_SZ, InstallDir, err => {
                if ( err ) {
                  console.log( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }

                return resolve();
              } );
            } );
          } );
        } else {
          Key.create( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }

            Key.set( 'InstallDir', Registry.REG_SZ, InstallDir, err => {
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
   * @param {string} InstallDir Where FreeSO was installed.
   * @param {string} KeyName The name of the registry key.
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  static async createFreeSOEntry( InstallDir, KeyName = 'FreeSO' ) {
    if( ! await Registry.testWinAccess() ) {
      return Promise.resolve();
    }
    return new Promise( ( resolve, reject ) => {
      const Registry = require( 'winreg' );
      const Key = new Registry( {
        hive: Registry.HKLM,
        key: '\\SOFTWARE\\Rhys Simpson\\' + KeyName
      } );

      Key.keyExists( ( err, exists ) => {
        if ( err ) {
          console.log( err );
          return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
        }
        if ( exists ) {
          Key.destroy( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_INSTALLDIR_FAIL );
            }

            Key.create( err => {
              if ( err ) {
                console.log( err );
                return reject( global.locale.TSO_INSTALLDIR_FAIL );
              }

              Key.set( 'InstallDir', Registry.REG_SZ, InstallDir, err => {
                if ( err ) {
                  console.log( err );
                  return reject( global.locale.TSO_INSTALLDIR_FAIL );
                }

                return resolve();
              } );
            } );
          } );
        } else {
          Key.create( err => {
            if ( err ) {
              console.log( err );
              return reject( global.locale.TSO_REGISTRY_EDIT_FAIL );
            }

            Key.set( 'InstallDir', Registry.REG_SZ, InstallDir, err => {
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
