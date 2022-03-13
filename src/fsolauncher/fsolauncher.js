const Modal = require( './library/modal' );
const EventHandlers = require( './event-handlers' );
const IPCBridge = require( './library/ipc-bridge' );
const Toast = require( './library/toast' );
const { net } = require( 'electron' );
const { https } = require( 'follow-redirects' ).wrap( {
  http: net,
  https: net,
} );

/**
 * Main launcher class.
 */
class FSOLauncher {
  /**
   * @param {Electron.BrowserWindow} BrowserWindow The main window.
   * @param {import('../main').UserSettings} UserSettings The configuration object.
   */
  constructor( BrowserWindow, UserSettings ) {
    this.conf = UserSettings;
    this.Window = BrowserWindow;
    this.minimizeReminder = false;
    this.lastUpdateNotification = false;
    this.isSearchingForUpdates = false;
    this.isUpdating = false;
    this.hasInternet = false;
    this.updateLocation = false;
    this.remeshInfo = {};
    this.remeshInfo.location = false;
    this.remeshInfo.version = false;
    this.remoteSimitoneVersion = null;
    this.lastDetected = null;
    this.activeTasks = [];
    this.isInstalled = {};
    this.Window.on( 'minimize', () => {
      if ( !this.minimizeReminder ) {
        Modal.sendNotification(
          'FreeSO Launcher', 
          global.locale.MINIMIZE_REMINDER,
          null, null, this.isDarkMode()
        );
        this.minimizeReminder = true;
      }
      this.Window.hide();
    } );
    this.IPC = Toast.IPC = Modal.IPC = new IPCBridge( BrowserWindow );
    this.eventHandlers = new EventHandlers( this );
    this.checkUpdatesRecursive();
    this.updateTipRecursive();
    this.updateNetRequiredUIRecursive( true );
    this.eventHandlers.defineEvents();
  }
  /**
   * Reads the registry and updates the programs list.
   *
   * @returns {Promise<void>} A promise that resolves when the programs
   *                          list and paths have been updated.
   */
  async updateInstalledPrograms() {
    const toast = new Toast( global.locale.TOAST_REGISTRY );
    try {
      const Registry = require( './library/registry' ),
        programs = await Registry.getInstalled();

      for ( let i = 0; i < programs.length; i++ ) {
        this.isInstalled[programs[i].key] = programs[i].isInstalled;
      }
      console.log( 'updateInstalledPrograms', this.isInstalled );
      this.IPC.sendInstalledPrograms( this.isInstalled );
    } finally {
      toast.destroy();
    }
  }
  /**
   * Update installer tips recursively, every 10 seconds.
   */
  updateTipRecursive() {
    const tips = [
      global.locale.TIP1,
      global.locale.TIP2,
      global.locale.TIP3,
      global.locale.TIP4,
      global.locale.TIP5,
      global.locale.TIP6,
      global.locale.TIP7,
      global.locale.TIP8,
      global.locale.TIP9,
      global.locale.TIP10,
      // global.locale.TIP11,
      global.locale.TIP12,
      global.locale.TIP13
    ];
    this.IPC.setTip( tips[Math.floor( Math.random() * tips.length )] );
    setTimeout( () => this.updateTipRecursive(), 10000 );
  }
  /**
   * Returns the current internet status, and updates the global
   * this.hasInternet variable.
   *
   * @returns {Promise<boolean>} A promise that resolves to the current
   *                             internet status.
   */
  getInternetStatus() {
    return new Promise( ( resolve, _reject ) => {
      require( 'dns' ).lookup( 'google.com', err => {
        this.hasInternet = !( err && err.code === 'ENOTFOUND' );
        return resolve( this.hasInternet );
      } );
    } );
  }
  /**
   * Obtains Simitone release information from GitHub.
   *
   * @returns {Promise<void>} A promise that resolves to the Simitone
   *                          release data.
   */
  async getSimitoneReleaseInfo() {
    return new Promise( ( resolve, reject ) => {
      const options = {
        host: 'api.github.com',
        path: '/repos/riperiperi/Simitone/releases/latest',
        headers: { 'user-agent': 'node.js' }
      };
      const request = https.request( options, res => {
        let data = '';
        res.on( 'data', chunk => data += chunk );
        res.on( 'end', () => {
          try {
            resolve( JSON.parse( data ) );
          } catch ( e ) { reject( e ); }
        } );
      } );
      request.setTimeout( 30000, () => reject(
        'Timed out while trying to get GitHub release data for Simitone.'
      ) );
      request.on( 'error', reject );
      request.end();
    } );
  }
  /**
   * Hides all view elements that need internet connection.
   *
   * @param {boolean} _init Whether this is the initial call.
   */
  async updateNetRequiredUI( _init ) {
    const hasInternet = await this.getInternetStatus();

    if ( !hasInternet ) {
      return this.IPC.hasNoInternet();
    }
    return this.IPC.hasInternet();
  }
  /**
   * Recursively updates the UI that needs internet.
   */
  updateNetRequiredUIRecursive() {
    setTimeout( () => {
      this.updateNetRequiredUI();
      this.updateNetRequiredUIRecursive();
    }, 5000 );
  }
  /**
   * Installs the game using the complete installer which installs FreeSO,
   * OpenAL, .NET, Mono, SDL, Mac-extras and The Sims Online.
   */
  runFullInstaller() {
    new ( require( './library/installers/complete-installer' ) )( this ).run();
  }
  /**
   * Adds a task in progress.
   *
   * @param {string} name Name of the task in progress. 
   */
  addActiveTask( name ) {
    if ( !this.isActiveTask( name ) ) {
      this.activeTasks.push( name );
    }
  }
  /**
   * Removes a task by name.
   *
   * @param {string} name Name of the task to remove.
   */
  removeActiveTask( name ) {
    if ( name ) {
      return this.activeTasks.splice( this.activeTasks.indexOf( name ), 1 );
    }

    this.activeTasks = [];
  }
  /**
   * Checks if task is active.
   *
   * @param {string} name Name of the task.
   */
  isActiveTask( name ) {
    return this.activeTasks.indexOf( name ) > -1;
  }
  /**
   * Returns a component's hard-coded pretty name.
   *
   * @param {string} componentCode The component's name.
   * @returns {string} The component's pretty name.
   */
  getPrettyName( componentCode ) {
    switch ( componentCode ) {
      case 'TSO':
        return 'The Sims Online';
      case 'FSO':
        return 'FreeSO';
      case 'OpenAL':
        return 'OpenAL';
      case 'NET':
        return '.NET Framework';
      case 'RMS':
        return 'Remesh Package';
      case 'Simitone':
        return 'Simitone for Windows';
      case 'Mono':
        return 'Mono Runtime';
      case 'MacExtras':
        return 'FreeSO MacExtras';
      case 'SDL':
        return 'SDL2';
    }
  }
  /**
   * Modifies TTS Mode.
   * To do this it has to edit FreeSO's config.ini.
   *
   * @deprecated It is now configurable in-game.
   * @param {string} value New TTS value.
   * @returns {Promise<void>} Resolves when done.
   */
  async editTTSMode( value ) {
    const fs = require( 'fs-extra' ), ini = require( 'ini' );
    const toast = new Toast( global.locale.TOAST_TTS_MODE );

    this.addActiveTask( 'CHTTS' );

    if ( !this.isInstalled.FSO ) {
      this.removeActiveTask( 'CHTTS' );
      toast.destroy();
      return Modal.showNeedFSOTSO();
    }
    try {
      const data = await this.getFSOConfig();
      data.EnableTTS = value === '0' ? 'False' : 'True';
      fs.writeFile(
        this.isInstalled.FSO + '/Content/config.ini',
        ini.stringify( data ), err => {
          this.removeActiveTask( 'CHTTS' );
          toast.destroy();
          if ( err ) {
            return Modal.showErrorIni();
          }
          this.conf.Game.TTS = value;
          this.persist( true );
        }
      );
    } catch ( e ) {
      this.removeActiveTask( 'CHTTS' );
      toast.destroy();
      Modal.showFirstRun();
    }
  }
  /**
   * Obtains remesh package information.
   *
   * @returns {Promise<object>} A promise that resolves to the response.
   */
  getRemeshData() {
    return new Promise( ( resolve, reject ) => {
      const options = {
        host: global.webService,
        path: '/' + global.remeshEndpoint
      };
      console.log( 'Getting remesh data from', options.path );
      const request = https.request( options, res => {
        let data = '';
        res.on( 'data', chunk => data += chunk );
        res.on( 'end', () => {
          try {
            const remeshData = JSON.parse( data );
            this.remeshInfo.location = remeshData.Location;
            this.remeshInfo.version  = remeshData.Version;
            console.log( 'getRemeshData', remeshData );
            resolve( remeshData );
          } catch ( e ) {
            reject( e );
          }
        } );
      } );
      request.setTimeout( 30000, () => reject( 'Timed out' ) );
      request.on( 'error', e => reject( e ) );
      request.end();
    } );
  }
  /**
   * Returns the launcher's update endpoint response.
   *
   * @returns {Promise<object>} A promise that resolves to the response.
   */
  getLauncherData() {
    return new Promise( ( resolve, reject ) => {
      const options = {
        host: global.webService,
        path: `/${global.updateEndpoint}?os=${require( 'os' ).release()}` + 
        `&version=${global.launcherVersion}` + 
        `&fso=${( this.isInstalled && this.isInstalled.FSO ) ? '1' : '0'}`
      };
      console.log( 'Getting launcher data from', options.path );
      const request = https.request( options, res => {
        let data = '';
        res.on( 'data', chunk => data += chunk );
        res.on( 'end', () => {
          try {
            const updateData = JSON.parse( data );
            this.updateLocation = updateData.Location;
            console.log( 'getLauncherData', updateData );
            resolve( updateData );
          } catch ( e ) {
            reject( e );
          }
        } );
      } );
      request.setTimeout( 30000, () => reject( 'Timed out' ) );
      request.on( 'error', e => reject( e ) );
      request.end();
    } );
  }
  /**
   * Obtains remesh info and updates the renderer process.
   *
   * @returns {Promise<void>} A promise that resolves when the remesh info is obtained.
   */
  async checkRemeshInfo() {
    try {
      await this.getRemeshData();
    } catch( e ) {
      console.log( e );
    }
    if ( this.remeshInfo.version != null ) {
      this.IPC.setRemeshInfo( this.remeshInfo.version );
    }
  }
  /**
   * Checks Simitone requirements:
   * 1. If Simitone is installed
   * 2. If TS Complete Collection is installed.
   * 3. If Simitone needs an update.
   *
   * @returns {Promise<void>} A promise that resolves when the check is complete.
   */
  async checkSimitoneRequirements() {
    new Toast( global.locale.TOAST_CHECKING_UPDATES, 1500 );
    const Registry = require( './library/registry' );
    const simitoneStatus = await Registry.get( 'Simitone', Registry.getSimitonePath() );
    const ts1ccStatus = await Registry.get( 'TS1', Registry.getTS1Path() );
    let simitoneUpdateStatus = null;
    if( simitoneStatus.isInstalled ) {
      if( this.conf.Game && this.conf.Game.SimitoneVersion ) {
        this.IPC.setSimitoneVersion( this.conf.Game.SimitoneVersion );
      } else {
        this.IPC.setSimitoneVersion( null );
      }
      try {
        simitoneUpdateStatus = await this.getSimitoneReleaseInfo();
      } catch( e ) {
        console.log( e );
      }
      if( simitoneUpdateStatus && 
        ( this.conf.Game.SimitoneVersion != simitoneUpdateStatus.tag_name ) ) {
        this.IPC.sendSimitoneShouldUpdate( simitoneUpdateStatus.tag_name );
      } else {
        this.IPC.sendSimitoneShouldUpdate( false );
      }
    } else {
      this.IPC.setSimitoneVersion( null );
      this.IPC.sendSimitoneShouldUpdate( false );
    }
    this.isInstalled['Simitone'] = simitoneStatus.isInstalled;
    this.isInstalled['TS1'] = ts1ccStatus.isInstalled;
    this.IPC.sendInstalledPrograms( this.isInstalled );
    //toast.destroy();
  }
  /**
   * Checks if any updates are available.
   *
   * @param {boolean} wasAutomatic Indicates if it has been requested by the recursive loop
   *                               to not spam the user with possible request error modals.
   * @returns {Promise<void>} A promise that resolves when the update check is complete.
   */
  async checkLauncherUpdates( wasAutomatic ) {
    if (
      !this.isSearchingForUpdates &&
      !this.isUpdating &&
      this.hasInternet &&
      this.activeTasks.length === 0
    ) {
      const toast = new Toast( global.locale.TOAST_CHECKING_UPDATES );
      this.isSearchingForUpdates = true;
      try {
        const data = await this.getLauncherData();
        this.isSearchingForUpdates = false;
        toast.destroy();

        if ( data.Version !== global.launcherVersion ) {
          if (
            this.lastUpdateNotification !== data.Version &&
            !this.Window.isVisible()
          ) {
            Modal.sendNotification(
              global.locale.MODAL_UPDATE_X +
                ' ' +
                data.Version +
                ' ' +
                global.locale.X_AVAILABLE,
              global.locale.MODAL_UPDATE_DESCR,
              null, null, this.isDarkMode()
            );
          }
          if ( this.lastUpdateNotification !== data.Version ) {
            this.lastUpdateNotification = data.Version;
            Modal.showInstallUpdate( data.Version );
          } else {
            if ( !wasAutomatic ) {
              Modal.showInstallUpdate( data.Version );
            }
          }
        }
      } catch ( e ) {
        this.isSearchingForUpdates = false;
        toast.destroy();
        if ( !wasAutomatic ) Modal.showFailedUpdateCheck();
      }
    }
  }
  /**
   * Opens a new window with the launcher's update page.
   *
   * @returns {Promise<void>} A promise that resolves when the window is opened.
   */
  async installLauncherUpdate() {
    return require( 'electron' ).shell.openExternal( 'https://beta.freeso.org/update' );
  }
  /**
   * Changes the game path in the registry.
   *
   * @param {object}         options           The options object.
   * @param {string}         options.component The component to change the path for.
   * @param {string|boolean} options.override  The path to change to.
   * @returns {Promise<void>} A promise that resolves when the path is changed.
   */
  async changeGamePath( options ) {
    const toast = new Toast( global.locale.TOAST_CHPATH );
    try {
      await this.install( options.component, {
        fullInstall: false,
        override: options.override
      } );
      Modal.showChangedGamePath();

      this.updateInstalledPrograms();
      this.removeActiveTask( options.component );
    } catch ( e ) {
      Modal.showFailedInstall( this.getPrettyName( options.component ), e );
      this.removeActiveTask( options.component );
    } finally {
      toast.destroy();
    }
  }
  /**
   * Shows the confirmation Modal right before installing.
   *
   * @param {string} componentCode The Component that is going to be installed.
   * @returns {Promise<void>} A promise that resolves when the Modal is shown.
   */
  async fireInstallModal( componentCode ) {
    const missing = [];
    const prettyName = this.getPrettyName( componentCode );

    switch ( componentCode ) {
      case 'FSO':
        if ( !this.isInstalled['TSO'] ) 
          missing.push( this.getPrettyName( 'TSO' ) );
        if ( !this.isInstalled['Mono'] && process.platform === "darwin" ) 
          missing.push( this.getPrettyName( 'Mono' ) );
        if ( !this.isInstalled['SDL'] && process.platform === "darwin" ) 
          missing.push( this.getPrettyName( 'SDL' ) );
        if ( !this.isInstalled['OpenAL'] && process.platform === "win32" )
          missing.push( this.getPrettyName( 'OpenAL' ) );
        break;

      case 'TSO':
        // No requirements.
        break;

      case 'RMS':
      case 'MacExtras':
        if ( !this.isInstalled['FSO'] ) missing.push( this.getPrettyName( 'FSO' ) );
        break;

      case 'Simitone': 
        if ( !this.isInstalled['Mono'] && process.platform === "darwin" ) 
          missing.push( this.getPrettyName( 'Mono' ) );
        if ( !this.isInstalled['SDL'] && process.platform === "darwin" ) 
          missing.push( this.getPrettyName( 'SDL' ) );
        break;
    }

    if ( [ // Components that require internet access.
      'TSO',
      'FSO',
      'RMS',
      'Simitone',
      'Mono',
      'MacExtras',
      'SDL'
    ].indexOf( componentCode ) > -1
       &&
      !this.hasInternet
    ) {
      return Modal.showNoInternet();
    }

    if ( this.isActiveTask( componentCode ) ) {
      return Modal.showAlreadyInstalling();
    }

    if ( missing.length > 0 ) {
      Modal.showRequirementsNotMet( missing );
    } else {
      if ( componentCode == 'RMS' ) {
        if ( this.remeshInfo.version == null ) {
          try {
            await this.getRemeshData();
          } catch( e ) {
            console.log( e );
          }
          if ( this.remeshInfo.version == null ) {
            return Modal.showNoRemesh();
          } else {
            return Modal.showFirstInstall( prettyName, componentCode );
          }
        }
        return Modal.showFirstInstall( prettyName, componentCode );
      }

      if ( !this.isInstalled[componentCode] ) {
        Modal.showFirstInstall( prettyName, componentCode );
      } else {
        Modal.showReInstall( prettyName, componentCode );
      }
    }
  }
  /**
   * Installs a single Component.
   * 
   * Each switch case instantiates and runs a different installer.
   * Any errors should be thrown and handled by the caller.
   *
   * @param {string}         componentCode        The Component to install.
   * @param {object}         options              The options object.
   * @param {string|boolean} options.override     The path to change to.
   * @param {boolean}        options.tsoInstaller The TSO installer to use.
   * @param {boolean}        options.fullInstall  Whether to do a full install.
   * @param {string}         options.dir          A predefined directory to install to.
   * @returns {Promise<void>} A promise that resolves when the Component is installed.
   */
  async install( componentCode, options = {
    fullInstall: false, override: false, tsoInstaller: 'FilePlanetInstaller', dir: false
  } ) {
    console.log( 'Installing:', componentCode, options );
    this.addActiveTask( componentCode );

    switch ( componentCode ) {
      case 'Mono':
      case 'MacExtras':
      case 'SDL': {
        const Installer = require( `./library/installers/${componentCode.toLowerCase()}-installer` );
        const singleInstaller = new Installer( this, this.isInstalled.FSO );
        if ( !options.fullInstall ) {
          this.IPC.changePage( 'downloads' );
        } else {
          singleInstaller.isFullInstall = true;
        }
        try {
          await singleInstaller.install();
          if( componentCode == 'MacExtras' && this.isInstalled.Simitone ) {
            // Do an install for Simitone as well.
            const simitoneInstaller = new Installer( this, this.isInstalled.Simitone, "Simitone" );
            await simitoneInstaller.install();
          }
        } finally {
          setTimeout( () => this.setProgressBar( -1 ), 5000 );
        }
        break;
      }
      case 'RMS': {
        const RemeshesInstaller = require( './library/installers/remeshes-installer' );
        const singleInstaller = new RemeshesInstaller(
          this.isInstalled.FSO + '/Content/MeshReplace', this
        );
        this.IPC.changePage( 'downloads' );
        try {
          await singleInstaller.install();
          if( this.isInstalled.Simitone ) {
            // Do an install for Simitone as well.
            const simitoneInstaller = new RemeshesInstaller(
              this.isInstalled.Simitone + '/Content/MeshReplace', this, 'Simitone' );
            await simitoneInstaller.install();
          }
        } finally {
          setTimeout( () => this.setProgressBar( -1 ), 5000 );
        }
        break;
      }
      case 'TSO':
      case 'FSO':
      case 'Simitone': {
        const Installer = ( () => {
          if ( componentCode == 'TSO' ) {
            return require( './library/installers/fileplanet-installer' );
          }
          if ( componentCode == 'FSO' ) {
            return require( './library/installers/github-installer' );
          }
          if ( componentCode == 'Simitone' ) {
            return require( './library/installers/simitone-installer' );
          }
        } )();
        
        if ( !options.override ) {
          let installDir = options.dir;
          if( !installDir ) {
            if( await ( require( './library/registry' ).testWinAccess() ) ) {
              const toast = new Toast(
                `${global.locale.INSTALLER_CHOOSE_WHERE_X} ${this.getPrettyName( componentCode )}`
              );
              const folders = await Modal.showChooseDirectory(
                this.getPrettyName( componentCode ), this.Window
              );
              if( folders && folders.length > 0 ) {
                installDir = folders[0] + '/' + this.getPrettyName( componentCode );
              }
              toast.destroy();
            } else {
              if( process.platform != 'win32' ) {
                // darwin doesnt get to choose
                installDir = global.homeDir + '/Documents/' + this.getPrettyName( componentCode );
              } else {
                if ( componentCode == 'TSO' ) {
                  installDir = 'C:/Program Files/Maxis/' + this.getPrettyName( componentCode );
                } else {
                  installDir = 'C:/Program Files/' + this.getPrettyName( componentCode );
                }
              }
            }
          }

          if ( installDir ) {
            const singleInstaller = new Installer( installDir, this );
            const isInstalled = await singleInstaller.isInstalledInPath();

            if ( isInstalled && !options.fullInstall && !options.dir && 
              await ( require( './library/registry' ).testWinAccess() ) 
            ) {
              return Modal.showAlreadyInstalled( 
                this.getPrettyName( componentCode ), componentCode, installDir );
            }

            if ( !options.fullInstall ) {
              this.IPC.changePage( 'downloads' );
            } else {
              singleInstaller.isFullInstall = true;
            }

            try {
              await singleInstaller.install();
            } finally {
              setTimeout( () => this.setProgressBar( -1 ), 5000 );
            }
          } else {
            if ( !options.fullInstall ) {
              this.removeActiveTask( componentCode );
            } else {
              this.removeActiveTask();
              return Promise.reject( new Error( "User canceled the installation." ) );
            }
          }
        } else {
          const Registry = require( './library/registry' );
          try {
            if ( componentCode === 'TSO' ) {
              await Registry.createMaxisEntry( options.override );
            }
            if ( componentCode === 'FSO' ) {
              await Registry.createFreeSOEntry( options.override );
            }
            if ( componentCode === 'Simitone' ) {
              await Registry.createFreeSOEntry( options.override, 'Simitone' );
            }
          } finally {
            setTimeout( () => this.setProgressBar( -1 ), 5000 );
          }
        }
        break;
      }
      case 'OpenAL':
      case 'NET': {
        const Installer = require( './library/installers/executable-installer' );
        const file = componentCode === 'NET' ? 'NDP46-KB3045560-Web.exe' : 'oalinst.exe';
        const singleInstaller = new Installer();
        try {
          await singleInstaller.run( file );
          this.removeActiveTask( componentCode );
          this.updateInstalledPrograms();
        } finally {
          this.removeActiveTask( componentCode );
          setTimeout( () => this.setProgressBar( -1 ), 5000 );
        }
        break;
      }
      default: {
        console.error( 'Component not found:', componentCode );
        this.removeActiveTask( componentCode );
        return Promise.reject( new Error( 'Component not found' ) );
      }
    }
  }
  /**
   * Checks for all types of updates recursively.
   */
  checkUpdatesRecursive() {
    setTimeout( () => {
      this.checkLauncherUpdates( true );
      this.checkRemeshInfo();
      this.checkUpdatesRecursive();
    }, 60000 );
  }
  /**
   * Switches the game language. 
   * Copies the translation files and changes the current language in FreeSO.ini.
   *
   * @param {string} language The language to change to.
   * @returns {Promise<void>} A promise that resolves when the language is changed.
   */
  async switchLanguage( language ) {
    if ( !this.isInstalled.TSO || !this.isInstalled.FSO ) {
      return Modal.showNeedFSOTSO();
    }
    this.addActiveTask( 'CHLANG' );
    const fs = require( 'fs-extra' ),
      ini = require( 'ini' ),
      path = require( 'path' );
    const toast = new Toast( global.locale.TOAST_LANGUAGE );
    try {
      try {
        process.noAsar = true;
        let exportTSODir = `../export/language_packs/${language.toUpperCase()}/TSO`;
          exportTSODir = path.join( __dirname, exportTSODir );
        if( process.platform == 'darwin' || process.platform == 'win32' ) {
          exportTSODir = exportTSODir.replace( 'app.asar', 'app.asar.unpacked' );
        }
        let exportFSODir = `../export/language_packs/${language.toUpperCase()}/FSO`;
          exportFSODir = path.join( __dirname, exportFSODir );
        if( process.platform == 'darwin' || process.platform == 'win32' ) {
          exportFSODir = exportFSODir.replace( 'app.asar', 'app.asar.unpacked' );
        }
        await fs.copy( exportTSODir, 
          process.platform == 'win32' ? this.isInstalled.TSO + '/TSOClient' : this.isInstalled.TSO
        );
        await fs.copy( exportFSODir, this.isInstalled.FSO );
      } catch( err ) {
        console.log( err );
        this.removeActiveTask( 'CHLANG' );
        toast.destroy();
        return Modal.showFSOLangFail();
      } finally {
        process.noAsar = false;
      }

      let data;
      try {
        data = await this.getFSOConfig();
        data.CurrentLang = this.getLangString( this.getLangCode( language ) )[0];
      } catch( err ) {
        console.log( err );
        this.removeActiveTask( 'CHLANG' );
        toast.destroy();
        return Modal.showFirstRun();
      }
      try {
        await fs.writeFile(
          this.isInstalled.FSO + '/Content/config.ini',
          ini.stringify( data )
        );
      } catch( err ) {
        this.removeActiveTask( 'CHLANG' );
        toast.destroy();
        return Modal.showIniFail();
      }
      this.removeActiveTask( 'CHLANG' );
      toast.destroy();
      this.conf.Game.Language = this.getLangString( this.getLangCode( language ) )[1];
      this.persist( true );
    } catch( err ) {
      return Modal.showGenericError( "An error ocurred: " + err );
    }
  }
  /**
   * Updates a configuration variable. Used after a user changes a setting.
   *
   * @param {object} newConfig The new configuration object.
   */
  async setConfiguration( newConfig ) {
    switch ( true ) {
      case newConfig[0] == 'Game' && newConfig[1] == 'Language':
        this.switchLanguage( newConfig[2] );
        break;

      case newConfig[1] == 'TTS':
        this.editTTSMode( newConfig[2] );
        break;

      case newConfig[1] == 'GraphicsMode' && newConfig[2] == 'sw' 
        && this.conf.Game.GraphicsMode != 'sw':
        if ( !this.isInstalled.FSO ) Modal.showNeedFSOTSO();
        else {
          try {
            await this.enableSoftwareMode();
            Modal.showSoftwareModeEnabled();
            this.conf[newConfig[0]][newConfig[1]] = newConfig[2];
            this.persist( true );
          } catch ( e ) {
            //Modal.showFailedUpdateMove()
            Modal.showGenericError( e.message );
          }
        }
        break;

      case newConfig[1] == 'GraphicsMode' &&
        newConfig[2] != 'sw' &&
        this.conf.Game.GraphicsMode == 'sw':
        try {
          await this.disableSoftwareMode();
          this.conf[newConfig[0]][newConfig[1]] = newConfig[2];
          this.persist( true );
        } catch ( e ) {
          Modal.showGenericError( e.message );
        }
        break;

      case newConfig[0] == 'Launcher' && newConfig[1] == 'Language':
        this.conf[newConfig[0]][newConfig[1]] = newConfig[2];
        this.persist( true );
        Modal.showLanguageOnRestart();
        break;

      default:
        this.conf[newConfig[0]][newConfig[1]] = newConfig[2];
        this.persist( newConfig[1] !== 'Language' );
    }
  }
  /**
   * Disables Software Mode and removes dxtn.dll and opengl32.dll.
   */
  async disableSoftwareMode() {
    const toast = new Toast( global.locale.TOAST_DISABLING_SWM );
    this.addActiveTask( 'CHSWM' );
    try {
      await require( 'fs-extra' ).remove( this.isInstalled.FSO + '/dxtn.dll' );
      await require( 'fs-extra' ).remove( this.isInstalled.FSO + '/opengl32.dll' );
    } finally {
      toast.destroy();
      this.removeActiveTask( 'CHSWM' );
    }
  }
  /**
   * Enables Software Mode and adds the needed files.
   * 
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async enableSoftwareMode() {
    const toast = new Toast( global.locale.TOAST_ENABLING_SWM );
    this.addActiveTask( 'CHSWM' );
    try {
      await require( 'fs-extra' ).copy( 'bin/dxtn.dll', this.isInstalled.FSO + '/dxtn.dll' );
      await require( 'fs-extra' ).copy( 'bin/opengl32.dll', this.isInstalled.FSO + '/opengl32.dll' );
    } finally {
      toast.destroy();
      this.removeActiveTask( 'CHSWM' );
    }
  }
  /**
   * Runs FreeSO or Simitone's executable.
   *
   * @param {boolean} useVolcanic If Volcanic.exe should be launched.
   */
  play( useVolcanic, isSimitone = false ) {
    if ( process.platform === "darwin" ) {
      // no volcanic for darwin
      useVolcanic = false;
    }

    if ( !this.isInstalled.FSO && !isSimitone ) {
      return Modal.showNeedToPlay();
    }

    if ( this.isActiveTask( 'CHLANG' ) ) {
      return Modal.showFailPlay();
    }

    if ( useVolcanic ) {
      if ( isSimitone ) {
        return Modal.showVolcanicPromptSimitone();
      }
      return Modal.showVolcanicPrompt();
    }
    
    const fs = require( 'fs-extra' );
    const exeLocation = isSimitone
      ? this.isInstalled.Simitone + '/Simitone.Windows.exe'
      : this.isInstalled.FSO + '/FreeSO.exe';

    fs.stat( exeLocation, ( err, _stat ) => {
      if ( err ) {
        const altExeLocation = isSimitone
        ? this.isInstalled.Simitone + '/FreeSOClient/Simitone.Windows.exe'
        : this.isInstalled.FSO + '/FreeSOClient/FreeSO.exe';

        return fs.stat( altExeLocation, ( err, _stat ) => {
          if( err ) return Modal.showCouldNotRecover( isSimitone );
          this.launchGame( false, isSimitone, '/FreeSOClient' );
        } );
      }
      this.launchGame( false, isSimitone );
    } );
  }
  /**
   * Launches the game with the user's configuration.
   *
   * @param {boolean} useVolcanic If Volcanic.exe should be launched.
   * @param {boolean} isSimitone  If Simitone should be launched.
   * @param {string}  subfolder   Subfolder if game is in subfolder.
   */
  launchGame( useVolcanic, isSimitone = false, subfolder ) {
    const gameFilename = isSimitone ? 'Simitone.Windows.exe' : 'FreeSO.exe';
    let file = useVolcanic ? 'Volcanic.exe' : gameFilename;
    let cwd = isSimitone
      ? this.isInstalled.Simitone
      : this.isInstalled.FSO;

    const toastText = isSimitone
      ? global.locale.TOAST_LAUNCHING.replace( 'FreeSO', 'Simitone' )
      : global.locale.TOAST_LAUNCHING;
    const toast = new Toast( toastText );
    const args = [];

    // windowed by default
    args.push( 'w' );
    // game language, by default english
    if( !isSimitone ) {
      // for now disable this for Simitone
      args.push( `-lang${this.getLangCode( this.conf.Game.Language )}` );
    }
    // SW only allows ogl
    let graphicsMode = this.conf.Game.GraphicsMode != 'sw'
      ? this.conf.Game.GraphicsMode : 'ogl';
    if( process.platform === "darwin" ) graphicsMode = "ogl";
    args.push( `-${graphicsMode}` );
    // 3d is forced off when in SW
    if( this.conf.Game['3DMode'] === '1' && ( this.conf.Game.GraphicsMode != 'sw' || isSimitone ) ) {
      args.push( '-3d' );
    }
    if( isSimitone && useVolcanic ) {
      // w Simitone you need to launch Simitone.Windows.exe with the -ide flag
      args.push( '-ide' );
      file = 'Simitone.Windows.exe';
    }
    if( isSimitone && this.conf.Game.SimitoneAA === '1' ) {
      args.push( '-aa' );
    }

    if( subfolder ) {
      cwd += subfolder;
    }

    if( process.platform === "darwin" ) {
      if( isSimitone ) {
        file = "/Library/Frameworks/Mono.framework/Commands/mono";
        args.unshift( "Simitone.Windows.exe" );
      } else {
        file = "./freeso.command";
      }
    }
    console.log( 'Running', file + ' ' + args.join( ' ' ), cwd );
    ( require( 'child_process' ).spawn( 
      file, args, { cwd, detached: true, stdio: 'ignore' } ) ).unref();

    setTimeout( () => { toast.destroy(); }, 4000 );
  }
  /**
   * Promise that returns FreeSO configuration
   * variables.
   *
   * @returns {Promise<object>} A promise that returns FreeSO configuration variables.
   */
  getFSOConfig() {
    return new Promise( ( resolve, reject ) => {
      const ini = require( 'ini' );
      const fs = require( 'fs-extra' );

      fs.readFile(
        this.isInstalled.FSO + '/Content/config.ini',
        'utf8',
        ( err, data ) => {
          if ( err ) return reject( err );
          return resolve( ini.parse( data ) );
        }
      );
    } );
  }
  /**
   * Returns hardcoded language integers from the language string.
   * Example: 'en', 'es'...
   *
   * @param {string} lang The language string.
   * @returns {number} The language code.
   */
  getLangCode( lang ) {
    const codes = {
      en: 0,
      es: 6,
      it: 5,
      pt: 14
    };
    return codes[lang];
  }
  /**
   * Returns the full language strings from the code.
   *
   * @param {number} code Language code (gettable from getLangCode).
   * @returns {string[]} The language strings.
   */
  getLangString( code ) {
    const languageStrings = {
      0: ['English', 'en'], // default
      6: ['Spanish', 'es'],
      5: ['Italian', 'it'],
      14: ['Portuguese', 'pt']
    };

    return languageStrings[code];
  }
  /**
   * Save the current state of the configuration.
   *
   * @param {boolean} showToast Display a toast while it is saving.
   */
  persist( _showToast ) {
    const toast = new Toast( global.locale.TOAST_SETTINGS );
    console.log( 'persist', this.conf );
    require( 'fs-extra' ).writeFile(
      global.appData + 'FSOLauncher.ini',
      require( 'ini' ).stringify( this.conf ),
      _err => setTimeout( () => toast.destroy(), 1500 )
    );
  }
  /**
   * Change FreeSO installation path.
   *
   * @param {string} dir The installation path.
   */
  async changeFSOPath( dir ) {
    const Registry = require( './library/registry' );
    try {
      console.log( dir );
      await Registry.createFreeSOEntry( dir );
      Modal.showChangedGamePath();
      this.IPC.sendDetectorResponse();
      this.updateInstalledPrograms();
    } catch( e ) {
      Modal.showGenericError( 
        'Failed while trying to change the FreeSO installation directory: ' + e );
    }
  }
  /**
   * Sets the native progress bar to the given value.
   * 
   * @param {number} val The value to set.
   * @param {Electron.ProgressBarOptions} options The options to use. 
   */
  setProgressBar( val, options ) {
    if( this.Window ) {
      try {
        this.Window.setProgressBar( val, options );
      } catch( err ) {
        console.log( 'Failed setting ProgressBar' )
      }
    }
  }
  /**
   * Returns if the current theme is considerd dark.
   * 
   * @returns {boolean} If the theme is dark.
   */
  isDarkMode() {
    return ['halloween', 'dark'].includes( this.conf.Launcher.Theme );
  }
}

module.exports = FSOLauncher;
