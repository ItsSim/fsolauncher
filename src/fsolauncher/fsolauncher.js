const Modal = require( './lib/modal' );
const EventHandlers = require( './event-handlers' );
const IPCBridge = require( './lib/ipc-bridge' );
const Toast = require( './lib/toast' );
const { captureWithSentry, getJSON } = require( './lib/utils' );

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
    this.isInstalled = {
      OpenAL: false,
      FSO: false,
      TSO: false,
      NET: false,
      Simitone: false,
      TS1: false,
      Mono: false,
      SDL: false
    };
    this.Window.on( 'minimize', () => {
      if ( ! this.minimizeReminder ) {
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
      const registry = require( './lib/registry' ),
        programs = await registry.getInstalled();

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
        this.hasInternet = ! ( err && err.code === 'ENOTFOUND' );
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
  getSimitoneReleaseInfo() {
    return getJSON( {
      host: 'api.github.com',
      path: '/repos/riperiperi/Simitone/releases/latest',
      headers: { 'user-agent': 'node.js' }
    } );
  }

  /**
   * Hides all view elements that need internet connection.
   *
   * @param {boolean} _init Whether this is the initial call.
   */
  async updateNetRequiredUI( _init ) {
    const hasInternet = await this.getInternetStatus();

    if ( ! hasInternet ) {
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
   * 
   * @param {string} folder Folder to install the game to.
   */
  async runFullInstall( folder ) {
    const fullInstaller = new ( require( './lib/installers/complete-installer' ) )( this );
    try {
      this.addActiveTask( 'FULL' );
      await fullInstaller.install( folder );
      Modal.sendNotification(
        'FreeSO Launcher', global.locale.INS_FINISHED_LONG, null, true, this.isDarkMode()
      );
    } finally {
      setTimeout( () => {
        this.removeActiveTask( 'FULL' );
        this.FSOLauncher.IPC.fullInstallProgressItem();
      }, 5000 );
    }
  }

  /**
   * Adds a task in progress.
   *
   * @param {string} name Name of the task in progress. 
   */
  addActiveTask( name ) {
    if ( ! this.isActiveTask( name ) ) {
      console.log( 'Adding active task:', name );
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
      console.log( 'Removing active task:', name );
      return this.activeTasks.splice( this.activeTasks.indexOf( name ), 1 );
    }
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
   * Obtains remesh package information.
   *
   * @returns {Promise<object>} A promise that resolves to the response.
   */
  async getRemeshData() {
    const data = await getJSON( {
      host: global.webService,
      path: '/' + global.remeshEndpoint
    } );
    this.remeshInfo.location = data.Location;
    this.remeshInfo.version  = data.Version;
    return data;
  }

  /**
   * Returns the launcher's update endpoint response.
   *
   * @returns {Promise<object>} A promise that resolves to the response.
   */
  async getLauncherData() {
    const data = await getJSON( {
      host: global.webService,
      path: `/${global.updateEndpoint}?os=${require( 'os' ).release()}` + 
      `&version=${global.launcherVersion}` + 
      `&fso=${( this.isInstalled && this.isInstalled.FSO ) ? '1' : '0'}`
    } );
    this.updateLocation = data.Location;
    return data;
  }

  /**
   * Obtains remesh info and updates the renderer process.
   *
   * @returns {Promise<void>} A promise that resolves when the remesh info is obtained.
   */
  async checkRemeshInfo() {
    try {
      await this.getRemeshData();
    } catch ( e ) {
      captureWithSentry( e );
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
    const reg = require( './lib/registry' );
    const simitoneStatus = await reg.get( 'Simitone', reg.getSimitonePath() );
    const ts1Status = await reg.get( 'TS1', reg.getTS1Path() );
    let simitoneUpdateStatus = null;
    if ( simitoneStatus.isInstalled ) {
      if ( this.conf.Game && this.conf.Game.SimitoneVersion ) {
        this.IPC.setSimitoneVersion( this.conf.Game.SimitoneVersion );
      } else {
        this.IPC.setSimitoneVersion( null );
      }
      try {
        simitoneUpdateStatus = await this.getSimitoneReleaseInfo();
      } catch ( e ) {
        captureWithSentry( e );
        console.log( e );
      }
      if ( simitoneUpdateStatus && 
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
    this.isInstalled['TS1'] = ts1Status.isInstalled;
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
      ! this.isSearchingForUpdates &&
      ! this.isUpdating &&
      this.hasInternet &&
      this.activeTasks.length === 0
    ) {
      const toast = new Toast( global.locale.TOAST_CHECKING_UPDATES );
      this.isSearchingForUpdates = true;
      try {
        const data = await this.getLauncherData();
        if ( data.Version !== global.launcherVersion ) {
          if (
            this.lastUpdateNotification !== data.Version &&
            ! this.Window.isVisible()
          ) {
            Modal.sendNotification(
              `${global.locale.MODAL_UPDATE_X} ${data.Version} ${global.locale.X_AVAILABLE}`,
              global.locale.MODAL_UPDATE_DESCR,
              null, null, this.isDarkMode()
            );
          }
          if ( this.lastUpdateNotification !== data.Version ) {
            this.lastUpdateNotification = data.Version;
            Modal.showInstallUpdate( data.Version );
          } else {
            if ( ! wasAutomatic ) {
              Modal.showInstallUpdate( data.Version );
            }
          }
        }
      } catch ( e ) {
        captureWithSentry( e, { wasAutomatic } );
        if ( ! wasAutomatic ) Modal.showFailedUpdateCheck();
      } finally {
        toast.destroy();
        this.isSearchingForUpdates = false;
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
      captureWithSentry( e, { component: options.component } );
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
        if ( ! this.isInstalled['TSO'] ) 
          missing.push( this.getPrettyName( 'TSO' ) );
        if ( ! this.isInstalled['Mono'] && process.platform === 'darwin' ) 
          missing.push( this.getPrettyName( 'Mono' ) );
        if ( ! this.isInstalled['SDL'] && process.platform === 'darwin' ) 
          missing.push( this.getPrettyName( 'SDL' ) );
        if ( ! this.isInstalled['OpenAL'] && process.platform === 'win32' )
          missing.push( this.getPrettyName( 'OpenAL' ) );
        break;

      case 'TSO':
        // No requirements.
        break;

      case 'RMS':
      case 'MacExtras':
        if ( ! this.isInstalled['FSO'] ) missing.push( this.getPrettyName( 'FSO' ) );
        break;

      case 'Simitone': 
        if ( ! this.isInstalled['Mono'] && process.platform === 'darwin' ) 
          missing.push( this.getPrettyName( 'Mono' ) );
        if ( ! this.isInstalled['SDL'] && process.platform === 'darwin' ) 
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
      ! this.hasInternet
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
          } catch ( e ) {
            captureWithSentry( e );
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

      if ( ! this.isInstalled[componentCode] ) {
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
   * @param {string}         componentCode       The Component to install.
   * @param {object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   * 
   * @returns {Promise<void>} A promise that resolves when the Component is installed.
   */
  async install( componentCode, options = { fullInstall: false, override: false, dir: false } ) {
    this.addActiveTask( componentCode );
    console.log( 'Installing', componentCode, options );
    try {
      switch ( componentCode ) {
        case 'Mono':
        case 'MacExtras':
        case 'SDL':
        case 'RMS':
          await this.handleGameDependentInstall( componentCode, options );
          break;
        case 'TSO':
        case 'FSO':
        case 'Simitone':
          await this.handleStandardInstall( componentCode, options );
          break;
        case 'OpenAL':
        case 'NET':
          await this.handleExecutableInstall( componentCode, options );
          break;
        default:
          console.error( 'Component not found:', componentCode );
          this.removeActiveTask( componentCode );
          return Promise.reject( new Error( 'Component not found' ) );
      }
      if ( ! options.fullInstall ) {
        Modal.showInstalled( this.getPrettyName( componentCode ) );
      }
    } catch ( err ) {
      if ( ! options.fullInstall ) {
        Modal.showFailedInstall( this.getPrettyName( componentCode ), err );
      }
      this.setProgressBar( 1, { mode: 'error' } );
      captureWithSentry( err, { component: componentCode, options } );
      throw err;
    } finally {
      setTimeout( () => this.setProgressBar( -1 ), 5000 );
      this.removeActiveTask( componentCode );
      this.updateInstalledPrograms();
    }
  }
  
  /**
   * Runs an installer that depends on the game being installed.
   * For example: the remesh package that needs to be installed where
   * FreeSO and Simitone is.
   * 
   * @param {string}         componentCode       The Component to install.
   * @param {object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   */
  async handleGameDependentInstall( componentCode, options ) {
    const runner = require( `./lib/installers/${componentCode.toLowerCase()}-installer` );
    const installer = new runner( this, this.isInstalled.FSO );
    if ( ! options.fullInstall ) {
      this.IPC.changePage( 'downloads' );
    }
    await installer.install();

    if ( componentCode === 'MacExtras' || componentCode === 'RMS' ) {
      // Do an install for Simitone as well.
      const simitoneInstaller = new runner( this, this.isInstalled.Simitone, 'Simitone' );
      await simitoneInstaller.install();
    }
  }
  
  /**
   * Handles the standard installation process for a given component.
   * 
   * @param {string} componentCode The code for the component being installed.
   * @param {Object} options Options for the installation process.
   * 
   * @returns {Promise<void>}
   */
  async handleStandardInstall( componentCode, options ) {
    const runner = require( `./lib/installers/${componentCode.toLowerCase()}-installer` );

    if ( options.override ) {
      // Modify registry to point to the override path.
      const registry = require( './lib/registry' );
      if ( componentCode === 'TSO' ) {
        await registry.createMaxisEntry( options.override );
      }
      if ( componentCode === 'FSO' ) {
        await registry.createFreeSOEntry( options.override );
      }
      if ( componentCode === 'Simitone' ) {
        await registry.createFreeSOEntry( options.override, 'Simitone' );
      }
      return;
    }

    // No override, so we need to get the install path.
    let installDir = options.dir; // Start with a predefined base directory.
    if ( ! installDir ) {
      installDir = await this.obtainInstallDirectory( componentCode );
    }
    if ( ! installDir ) {
      throw new Error( 'User canceled the installation.' );
    }
    const installer = new runner( this, installDir );
    const isInstalled = await installer.isInstalledInPath();
    
    if ( isInstalled && ! options.fullInstall && ! options.dir && 
      await ( require( './lib/registry' ).testWinAccess() ) ) {
        // Already installed in the given path, let the user know.
        return Modal.showAlreadyInstalled( this.getPrettyName( componentCode ), 
          componentCode, installDir );
    }
    if ( ! options.fullInstall ) {
      this.IPC.changePage( 'downloads' );
    }
    await installer.install();
  }

  /**
   * Handles the installation process for an executable component.
   * 
   * @param {string} componentCode The code for the component being installed.
   * @param {Object} options Options for the installation process.
   * 
   * @returns {Promise<void>}
   */
  async handleExecutableInstall( componentCode, options ) {
    const runner = require( './lib/installers/executable-installer' );
    const installer = new runner();
    const file = componentCode === 'NET' ? 'NDP46-KB3045560-Web.exe' : 'oalinst.exe';
    const cmdOptions = componentCode === 'NET' ? [ '/q', '/norestart' ]  : [ '/SILENT' ];

    await installer.run( file, cmdOptions );
  }

  /**
   * Prompts the user to choose an installation folder for a given component.
   * 
   * @param {string} componentCode The code for the component being installed.
   * 
   * @returns {Promise<string|null>} The selected installation folder or
   *                                 null if the user cancels.
   */
  async askForInstallFolder( componentCode ) {
    const toast = new Toast(
      `${global.locale.INSTALLER_CHOOSE_WHERE_X} ${this.getPrettyName( componentCode )}`
    );
    const folders = await Modal.showChooseDirectory(
      this.getPrettyName( componentCode ), this.Window
    );
    toast.destroy();
    if ( folders && folders.length > 0 ) {
      return folders[0] + '/' + this.getPrettyName( componentCode );
    }
    return null;
  }

  /**
   * Obtains the installation directory for a given component.
   * 
   * @param {string} componentCode The code for the component being installed.
   * 
   * @returns {Promise<string>} The installation directory for the component.
   */
  async obtainInstallDirectory( componentCode ) {
    if ( await ( require( './lib/registry' ).testWinAccess() ) ) {
      return await this.askForInstallFolder( componentCode );
    } else {
      // Use well-known paths.
      if ( process.platform != 'win32' ) {
        // For darwin, everything goes to Documents for now.
        return global.homeDir + '/Documents/' + this.getPrettyName( componentCode );
      }
      if ( componentCode == 'TSO' ) {
        return 'C:/Program Files/Maxis/' + this.getPrettyName( componentCode );
      }
      return 'C:/Program Files/' + this.getPrettyName( componentCode );
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
  if ( ! this.isInstalled.TSO || ! this.isInstalled.FSO ) {
    return Modal.showNeedFSOTSO();
  }
  this.addActiveTask( 'CHLANG' );
  const fs = require( 'fs-extra' ), 
    ini = require( 'ini' ), 
    path = require( 'path' );
  const toast = new Toast( global.locale.TOAST_LANGUAGE );

  try {
    process.noAsar = true;
    const exportTSODir = path.join( __dirname, `../export/language_packs/${language.toUpperCase()}/TSO` )
      .replace( 'app.asar', 'app.asar.unpacked' );
    const exportFSODir = path.join( __dirname, `../export/language_packs/${language.toUpperCase()}/FSO` )
      .replace( 'app.asar', 'app.asar.unpacked' );
    await fs.copy( exportTSODir, process.platform == 'win32' ? this.isInstalled.TSO + '/TSOClient' : this.isInstalled.TSO );
    await fs.copy( exportFSODir, this.isInstalled.FSO );
  } catch ( err ) {
    captureWithSentry( err, { language } );
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
  } catch ( err ) {
    captureWithSentry( err, { language } );
    console.log( err );
    this.removeActiveTask( 'CHLANG' );
    toast.destroy();
    return Modal.showFirstRun();
  }

  data.CurrentLang = this.getLangString( this.getLangCode( language ) )[0];

  try {
    await fs.writeFile( this.isInstalled.FSO + '/Content/config.ini', ini.stringify( data ) );
  } catch ( err ) {
    captureWithSentry( err, { language } );
    this.removeActiveTask( 'CHLANG' );
    toast.destroy();
    return Modal.showIniFail();
  }

  this.removeActiveTask( 'CHLANG' );
  toast.destroy();
  this.conf.Game.Language = this.getLangString( this.getLangCode( language ) )[1];
  this.persist( true );
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

      case newConfig[1] == 'GraphicsMode' && newConfig[2] == 'sw' 
        && this.conf.Game.GraphicsMode != 'sw':
        if ( ! this.isInstalled.FSO ) Modal.showNeedFSOTSO();
        else {
          try {
            await this.enableSoftwareMode();
            Modal.showSoftwareModeEnabled();
            this.conf[newConfig[0]][newConfig[1]] = newConfig[2];
            this.persist( true );
          } catch ( e ) {
            captureWithSentry( e, { newConfig } );
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
          captureWithSentry( e, { newConfig } );
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
    if ( process.platform === 'darwin' ) {
      // no volcanic for darwin
      useVolcanic = false;
    }

    if ( ! this.isInstalled.FSO && ! isSimitone ) {
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
          if ( err ) return Modal.showCouldNotRecover( isSimitone );
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
    if ( ! isSimitone ) {
      // for now disable this for Simitone
      args.push( `-lang${this.getLangCode( this.conf.Game.Language )}` );
    }
    // SW only allows ogl
    let graphicsMode = this.conf.Game.GraphicsMode != 'sw'
      ? this.conf.Game.GraphicsMode : 'ogl';
    if ( process.platform === 'darwin' ) graphicsMode = 'ogl';
    args.push( `-${graphicsMode}` );
    // 3d is forced off when in SW
    if ( this.conf.Game['3DMode'] === '1' && ( this.conf.Game.GraphicsMode != 'sw' || isSimitone ) ) {
      args.push( '-3d' );
    }
    if ( isSimitone && useVolcanic ) {
      // w Simitone you need to launch Simitone.Windows.exe with the -ide flag
      args.push( '-ide' );
      file = 'Simitone.Windows.exe';
    }
    if ( isSimitone && this.conf.Game.SimitoneAA === '1' ) {
      args.push( '-aa' );
    }

    if ( subfolder ) {
      cwd += subfolder;
    }

    if ( process.platform === 'darwin' ) {
      if ( isSimitone ) {
        file = '/Library/Frameworks/Mono.framework/Commands/mono';
        args.unshift( 'Simitone.Windows.exe' );
      } else {
        file = './freeso.command';
      }
    }
    const spawnOptions = { 
      cwd, detached: true, stdio: 'ignore' 
    };
    if ( process.platform === 'darwin' ) { 
      spawnOptions.shell = true;
    }
    console.log( 'Running', file + ' ' + args.join( ' ' ), cwd );
    ( require( 'child_process' ).spawn( file, args, spawnOptions ) ).unref();

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
      0: [ 'English', 'en' ], // default
      6: [ 'Spanish', 'es' ],
      5: [ 'Italian', 'it' ],
      14: [ 'Portuguese', 'pt' ]
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
    const reg = require( './lib/registry' );
    try {
      console.log( dir );
      await reg.createFreeSOEntry( dir );
      Modal.showChangedGamePath();
      this.updateInstalledPrograms();
    } catch ( e ) {
      captureWithSentry( e );
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
    if ( this.Window ) {
      try {
        this.Window.setProgressBar( val, options );
      } catch ( err ) {
        captureWithSentry( err );
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
    return [ 'halloween', 'dark' ].includes( this.conf.Launcher.Theme );
  }

  async ociPickFolder() {
    const folders = await Modal.showChooseDirectory( 'FreeSO Game', this.Window );
    if ( folders && folders.length > 0 ) {
      this.IPC.ociPickedFolder( folders[0] + '/FreeSO Game' );
    }
  }
}

module.exports = FSOLauncher;
