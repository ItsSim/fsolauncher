const { captureWithSentry, getJSON, strFormat, getDisplayRefreshRate } = require( './lib/utils' );
const { locale } = require( './locale' );
const { checks, version, homeDir, appData } = require( './constants' );

const Modal = require( './lib/modal' );
const Events = require( './events' );
const IPCBridge = require( './lib/ipc-bridge' );
const Toast = require( './lib/toast' );

/**
 * Main launcher class.
 */
class FSOLauncher {
  /**
   * @param {Electron.BrowserWindow} window The main window.
   * @param {import('../main').UserSettings} userSettings The configuration object.
   */
  constructor( window, userSettings ) {
    this.userSettings = userSettings;
    this.window = window;
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
    this.ociFolder = null;
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
    this.window.on( 'minimize', () => {
      if ( ! this.minimizeReminder ) {
        Modal.sendNotification(
          'FreeSO Launcher',
          locale.current.MINIMIZE_REMINDER,
          null, null, this.isDarkMode()
        );
        this.minimizeReminder = true;
      }
      this.window.hide();
    } );
    this.IPC = Toast.IPC = Modal.IPC = new IPCBridge( window );
    this.events = new Events( this );
    this.checkUpdatesRecursive();
    this.updateTipRecursive();
    this.updateNetRequiredUIRecursive( true );
    this.events.listen();
  }

  /**
   * Reads the registry and updates the programs list.
   *
   * @returns {Promise<void>} A promise that resolves when the programs
   *                          list and paths have been updated.
   */
  async updateInstalledPrograms() {
    const registry = require( './lib/registry' ),
      programs = await registry.getInstalled();

    for ( let i = 0; i < programs.length; i++ ) {
      this.isInstalled[ programs[ i ].key ] = programs[ i ].isInstalled;
    }
    console.info( 'updateInstalledPrograms', this.isInstalled );
    this.IPC.sendInstalledPrograms( this.isInstalled );
  }

  /**
   * Update installer tips recursively, every 10 seconds.
   */
  updateTipRecursive() {
    const tips = [
      locale.current.TIP1,
      locale.current.TIP2,
      locale.current.TIP3,
      locale.current.TIP4,
      locale.current.TIP5,
      locale.current.TIP6,
      locale.current.TIP7,
      locale.current.TIP8,
      locale.current.TIP9,
      locale.current.TIP10,
      // locale.current.TIP11,
      locale.current.TIP12,
      locale.current.TIP13
    ];
    const randomTip = tips[ Math.floor( Math.random() * tips.length ) ];

    this.IPC.setTip( randomTip );
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
   */
  async updateNetRequiredUI() {
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
    const fullInstaller = new ( require( './lib/installers/complete' ) )( this );
    try {
      this.addActiveTask( 'FULL' );
      await fullInstaller.install( folder );
      Modal.sendNotification(
        'FreeSO Launcher', locale.current.INS_FINISHED_LONG, null, true, this.isDarkMode()
      );
    } catch ( err ) {
      console.error( 'runFullInstall', err );
    } finally {
      setTimeout( () => {
        this.removeActiveTask( 'FULL' );
        this.IPC.fullInstallProgressItem();
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
      console.info( 'addActiveTask', name );
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
      console.info( 'removeActiveTask', name );
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
   *
   * @returns {string} The component's pretty name.
   */
  getPrettyName( componentCode ) {
    return require( './constants' ).components[ componentCode ];
  }

  /**
   * Obtains remesh package information.
   *
   * @returns {Promise<object>} A promise that resolves to the response.
   */
  async getRemeshData() {
    const data = await getJSON( {
      host: checks.siteUrl,
      path: '/' + checks.remeshEndpoint
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
      host: checks.siteUrl,
      path: `/${checks.updateEndpoint}?os=${require( 'os' ).release()}` +
      `&version=${version}` +
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
    } catch ( err ) {
      captureWithSentry( err );
      console.error( err );
    }
    if ( this.remeshInfo?.version ) {
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
    new Toast( locale.current.TOAST_CHECKING_UPDATES, 1500 );

    await this.updateInstalledPrograms();

    if ( ! this.isInstalled.Simitone ) {
      this.IPC.setSimitoneVersion( null );
      return this.IPC.sendSimitoneShouldUpdate( false );
    }

    this.IPC.setSimitoneVersion( this.userSettings.Game?.SimitoneVersion || null );

    let releaseInfo;
    try {
      releaseInfo = await this.getSimitoneReleaseInfo();
    } catch ( err ) {
      captureWithSentry( err );
      console.error( err );
    }
    const shouldUpdate = releaseInfo &&
      ( this.userSettings.Game.SimitoneVersion != releaseInfo.tag_name );
    this.IPC.sendSimitoneShouldUpdate( shouldUpdate ? releaseInfo.tag_name : false );
  }

  /**
   * Checks if any updates are available.
   *
   * @param {boolean} wasAutomatic Indicates if it has been requested by the recursive loop
   *                               to not spam the user with possible request error modals.
   *
   * @returns {Promise<void>} A promise that resolves when the update check is complete.
   */
  async checkLauncherUpdates( wasAutomatic ) {
    if (
      this.isSearchingForUpdates || this.isUpdating || ! this.hasInternet ||
      this.activeTasks.length !== 0
    ) return;

    const toast = new Toast( locale.current.TOAST_CHECKING_UPDATES );
    this.isSearchingForUpdates = true;

    try {
      const data = await this.getLauncherData();
      const isNewVersion = data?.Version && data.Version !== version;

      if ( isNewVersion && ( this.lastUpdateNotification !== data.Version || ! wasAutomatic ) ) {
        Modal.showInstallUpdate( data.Version );
        this.lastUpdateNotification = data.Version;
      }
    } catch ( err ) {
      captureWithSentry( err, { wasAutomatic } );
      console.error( err );
      if ( ! wasAutomatic ) Modal.showFailedUpdateCheck();
    } finally {
      toast.destroy();
      this.isSearchingForUpdates = false;
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
   * @param {Object}         options           The options object.
   * @param {string}         options.component The component to change the path for.
   * @param {string|boolean} options.override  The path to change to.
   *
   * @returns {Promise<void>} A promise that resolves when the path is changed.
   */
  async changeGamePath( options ) {
    const toast = new Toast( locale.current.TOAST_CHPATH );
    try {
      await this.install( options.component, {
        fullInstall: false,
        override: options.override
      } );
      Modal.showChangedGamePath();
    } catch ( err ) {
      captureWithSentry( err, { options } );
      console.error( err );
      Modal.showFailedInstall( this.getPrettyName( options.component ), err );
    } finally {
      this.removeActiveTask( options.component );
      toast.destroy();
    }
  }

  /**
   * Displays the appropriate installation confirmation Modal.
   *
   * @param {string} componentCode The Component to be installed.
   */
  async fireInstallModal( componentCode ) {
    const missing = this.getMissingDependencies( componentCode );

    if ( this.requiresInternet( componentCode ) && ! this.hasInternet ) {
      return Modal.showNoInternet();
    }
    if ( this.isActiveTask( componentCode ) ) {
      return Modal.showAlreadyInstalling();
    }
    if ( missing.length > 0 ) {
      Modal.showRequirementsNotMet( missing );
    } else {
      await this.handleInstallationModal( componentCode );
    }
  }

  /**
   * Returns an array of missing dependencies for a given component.
   *
   * @param {string} componentCode The Component for which dependencies
   *                               should be checked.
   *
   * @returns {Array<string>} An array of missing dependencies' pretty names.
   */
  getMissingDependencies( componentCode ) {
    const { dependencies } = require( './constants' );

    return ( dependencies[ componentCode ] || [] )
      .filter( dependency => ! this.isInstalled[ dependency ] )
      .map( dependency => this.getPrettyName( dependency ) );
  }

  /**
   * Checks if a component requires an internet connection for installation.
   *
   * @param {string} componentCode The Component to be checked.
   *
   * @returns {boolean} True if the component requires internet access,
   *                    false otherwise.
   */
  requiresInternet( componentCode ) {
    return require( './constants' ).needInternet.includes( componentCode );
  }

  /**
   * Handles the installation Modal display based on the component's
   * current installation status.
   *
   * @param {string} componentCode The Component to be installed.
   */
  async handleInstallationModal( componentCode ) {
    const prettyName = this.getPrettyName( componentCode );

    if ( componentCode === 'RMS' ) {
      if ( ! this.remeshInfo?.version ) {
        try {
          await this.getRemeshData();
        } catch ( err ) {
          captureWithSentry( err );
          console.error( err );
        }
        if ( ! this.remeshInfo?.version ) {
          return Modal.showNoRemesh();
        }
      }
    }
    if ( ! this.isInstalled[ componentCode ] ) {
      Modal.showFirstInstall( prettyName, componentCode );
    } else {
      Modal.showReInstall( prettyName, componentCode );
    }
  }

  /**
   * Installs a single Component.
   *
   * Each switch case instantiates and runs a different installer.
   * Any errors that are thrown should be handled by the caller.
   *
   * @param {string}         componentCode       The Component to install.
   * @param {Object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   *
   * @returns {Promise<void>} A promise that resolves when the Component is installed.
   */
  async install( componentCode, options = { fullInstall: false, override: false, dir: false } ) {
    this.addActiveTask( componentCode );
    console.info( 'install', { componentCode, options } );
    try {
      let display = false;
      switch ( componentCode ) {
      case 'Mono':
      case 'MacExtras':
      case 'SDL':
      case 'RMS':
        display = await this.handleSimpleInstall( componentCode, options );
        break;
      case 'TSO':
      case 'FSO':
      case 'Simitone':
        display = await this.handleStandardInstall( componentCode, options );
        break;
      case 'OpenAL':
      case 'NET':
        display = await this.handleExecutableInstall( componentCode, options );
        break;
      default:
        console.error( 'invalid componentCode', componentCode );
        this.removeActiveTask( componentCode );
        throw new Error( strFormat( 'Component %s not found', componentCode ) );
      }
      if ( ! options.fullInstall && display ) {
        Modal.showInstalled( this.getPrettyName( componentCode ) );
      }
    } catch ( err ) {
      Modal.showFailedInstall( this.getPrettyName( componentCode ), err );
      this.setProgressBar( 1, { mode: 'error' } );
      captureWithSentry( err,
        { component: componentCode, options, isInstalled: this.isInstalled } );
      throw err;
    } finally {
      setTimeout( () => this.setProgressBar( -1 ), 5000 );
      this.removeActiveTask( componentCode );
      this.updateInstalledPrograms();
    }
  }

  /**
   * Runs an installer that does not need to ask the user for any input.
   *
   * @param {string}         componentCode       The Component to install.
   * @param {Object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   *
   * @returns {Promise<boolean>}
   */
  async handleSimpleInstall( componentCode, options ) {
    const runner = require( './lib/installers' )[ componentCode ];
    const subfolder = componentCode === 'RMS' ? '/Content/MeshReplace' : '';
    const installer = new runner( this, this.isInstalled.FSO + subfolder );
    if ( ! options.fullInstall ) {
      this.IPC.changePage( 'downloads' );
    }
    await installer.install();

    if ( [ 'MacExtras', 'RMS' ].includes( componentCode )
      && this.isInstalled.Simitone ) {
      // Do an install for Simitone as well.
      const smtInstaller = new runner( this, this.isInstalled.Simitone + subfolder, 'Simitone' );
      await smtInstaller.install();
    }
    return true;
  }

  /**
   * Handles the standard installation process for a given component.
   *
   * @param {string}         componentCode       The code for the component being installed.
   * @param {Object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   *
   * @returns {Promise<boolean>}
   */
  async handleStandardInstall( componentCode, options ) {
    const runner = require( './lib/installers' )[ componentCode ];

    if ( options.override ) {
      const {
        createMaxisEntry,
        createGameEntry,
        createSimitoneEntry
      } = require( './lib/registry' );

      // Modify registry to point to the override path.
      if ( componentCode === 'TSO' ) {
        await createMaxisEntry(
          this.setConfiguration.bind( this ), options.override
        );
      }
      if ( componentCode === 'FSO' ) {
        await createGameEntry(
          this.setConfiguration.bind( this ), options.override
        );
      }
      if ( componentCode === 'Simitone' ) {
        await createSimitoneEntry(
          this.setConfiguration.bind( this ), options.override
        );
      }
      return false;
    }

    // No override, so we need to get the install path.
    let installDir = options.dir; // Start with a predefined base directory.
    if ( ! installDir ) {
      installDir = await this.obtainInstallDirectory( componentCode );
    }
    if ( ! installDir ) {
      return false;
    }
    const installer = new runner( this, installDir );
    const isInstalled = await installer.isInstalledInPath();

    if ( isInstalled && ! options.fullInstall && ! options.dir &&
      await ( require( './lib/registry' ).hasRegistryAccess() ) ) {
      // Already installed in the given path, let the user know.
      Modal.showAlreadyInstalled( this.getPrettyName( componentCode ),
        componentCode, installDir );
      return false;
    }
    if ( ! options.fullInstall ) {
      this.IPC.changePage( 'downloads' );
    }
    await installer.install();

    return true;
  }

  /**
   * Handles the installation process for an executable component.
   *
   * @param {string}         componentCode       The code for the component being installed.
   * @param {Object}         options             The options object.
   * @param {boolean}        options.fullInstall Whether to do a full install.
   * @param {string|boolean} options.override    The path to change to.
   * @param {string}         options.dir         A predefined directory to install to.
   *
   * @returns {Promise<boolean>}
   */
  async handleExecutableInstall( componentCode, options ) {
    const runner = require( './lib/installers/executable' );
    const installer = new runner();
    const file = componentCode === 'NET' ? 'NDP46-KB3045560-Web.exe' : 'oalinst.exe';
    let cmdOptions;
    if ( options.fullInstall ) {
      cmdOptions = componentCode === 'NET' ? [ '/q', '/norestart' ]  : [ '/SILENT' ];
    }
    await installer.run( file, cmdOptions );

    return false;
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
      `${locale.current.INSTALLER_CHOOSE_WHERE_X} ${this.getPrettyName( componentCode )}`
    );
    const folders = await Modal.showChooseDirectory(
      this.getPrettyName( componentCode ), this.window
    );
    toast.destroy();
    if ( folders && folders.length > 0 ) {
      return folders[ 0 ] + '/' + this.getPrettyName( componentCode );
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
    if ( await ( require( './lib/registry' ).hasRegistryAccess() ) ) {
      return this.askForInstallFolder( componentCode );
    } else {
      // Use well-known paths.
      if ( process.platform == 'darwin' ) {
        // For darwin, everything goes to Documents for now.
        return homeDir + '/Documents/' + this.getPrettyName( componentCode );
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
   *
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
    const toast = new Toast( locale.current.TOAST_LANGUAGE );

    try {
      process.noAsar = true;
      const fsoDir = path.join( __dirname, `../export/language_packs/${language.toUpperCase()}/TSO` )
        .replace( 'app.asar', 'app.asar.unpacked' );
      const tsoDir = path.join( __dirname, `../export/language_packs/${language.toUpperCase()}/FSO` )
        .replace( 'app.asar', 'app.asar.unpacked' );
      await fs.copy( fsoDir, this.isInstalled.TSO + '/TSOClient' );
      await fs.copy( tsoDir, this.isInstalled.FSO );
    } catch ( err ) {
      captureWithSentry( err, { language } );
      console.error( err );
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
      console.error( err );
      this.removeActiveTask( 'CHLANG' );
      toast.destroy();
      return Modal.showFirstRun();
    }

    data.CurrentLang = this.getLangString( this.getLangCode( language ) )[ 0 ];

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

    return this.updateAndPersistConfig( 'Game', 'Language',
      this.getLangString( this.getLangCode( language ) )[ 1 ]  );
  }

  /**
   * Updates a configuration variable based on user input.
   *
   * @param {Object} newConfig The new configuration object.
   *
   * @returns {Promise<void>} A promise that resolves when the configuration is updated.
   */
  async setConfiguration( newConfig ) {
    const [ category, key, value ] = newConfig;

    if ( category === 'Game' && key === 'Language' ) {
      return this.switchLanguage( value );
    } else if ( key === 'GraphicsMode' ) {
      return this.handleGraphicsModeChange( value );
    } else if ( category === 'Launcher' && key === 'Language' ) {
      return this.setLauncherLanguage( value );
    } else {
      return this.updateAndPersistConfig( category, key, value );
    }
  }

  /**
   * Handles changes to the graphics mode setting.
   *
   * @param {string} newValue The new graphics mode value.
   *
   * @returns {Promise<void>} A promise that resolves when the graphics mode is changed.
   */
  handleGraphicsModeChange( newValue ) {
    const oldGraphicsMode = this.userSettings.Game.GraphicsMode;

    if ( newValue === 'sw' && oldGraphicsMode !== 'sw' ) {
      if ( ! this.isInstalled.FSO ) {
        Modal.showNeedFSOTSO();
      } else {
        return this.toggleSoftwareMode( true );
      }
    } else if ( newValue !== 'sw' && oldGraphicsMode === 'sw' ) {
      return this.toggleSoftwareMode( false, newValue );
    } else {
      return this.updateAndPersistConfig( 'Game', 'GraphicsMode', newValue );
    }
  }

  /**
   * Toggles software mode on or off.
   *
   * @param {boolean} enable   If true, enable software mode, otherwise
   *                           disable it.
   * @param {string}  newValue The new graphics mode value.
   *
   * @returns {Promise<void>} A promise that resolves when the graphics mode is changed.
   */
  async toggleSoftwareMode( enable, newValue ) {
    try {
      if ( enable ) {
        await this.enableSoftwareMode();
        Modal.showSoftwareModeEnabled();
      } else {
        await this.disableSoftwareMode();
      }
      return this.updateAndPersistConfig( 'Game', 'GraphicsMode', enable ? 'sw' : newValue );
    } catch ( err ) {
      captureWithSentry( err );
      console.error( err );
      Modal.showGenericError( err.message );
    }
  }

  /**
   * Sets the launcher language and shows a language change modal.
   *
   * @param {string} value The new language value.
   *
   * @returns {Promise<void>} A promise that resolves when the language is changed.
   */
  async setLauncherLanguage( value ) {
    await this.updateAndPersistConfig( 'Launcher', 'Language', value );
    Modal.showLanguageOnRestart();
  }

  /**
   * Updates a configuration variable and persists it if necessary.
   *
   * @param {string} category The configuration category.
   * @param {string} key      The configuration key.
   * @param {*}      value    The new configuration value.
   *
   * @returns {Promise<void>} A promise that resolves when the configuration
   *                          has been updated and persisted.
   */
  updateAndPersistConfig( category, key, value ) {
    this.userSettings[ category ] = this.userSettings[ category ] || {};
    this.userSettings[ category ][ key ] = value;

    return this.persist();
  }

  /**
   * Disables Software Mode and removes dxtn.dll and opengl32.dll.
   */
  async disableSoftwareMode() {
    const toast = new Toast( locale.current.TOAST_DISABLING_SWM );
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
    const toast = new Toast( locale.current.TOAST_ENABLING_SWM );
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

    const exeLocation = isSimitone
      ? this.isInstalled.Simitone + '/Simitone.Windows.exe'
      : this.isInstalled.FSO + '/FreeSO.exe';

    require( 'fs-extra' ).stat( exeLocation, ( err, _stat ) => {
      if ( err ) {
        captureWithSentry( err, {
          exeLocation, useVolcanic, isSimitone, userSettings: this.userSettings,
          isInstalled: this.isInstalled
        } );
        console.error( 'could not find exe', {
          exeLocation, useVolcanic, isSimitone, userSettings: this.userSettings,
          isInstalled: this.isInstalled
        } );
        return Modal.showCouldNotRecover( exeLocation, isSimitone );
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

    if ( ! cwd ) {
      captureWithSentry( new Error( 'Entered launchGame without cwd' ), {
        cwd, file, useVolcanic, isSimitone,
        userSettings: this.userSettings, isInstalled: this.isInstalled, subfolder
      } );
      console.error( 'launchGame with no cwd', {
        cwd, file, useVolcanic, isSimitone,
        userSettings: this.userSettings, isInstalled: this.isInstalled, subfolder
      } );
      return Modal.showNeedToPlay();
    }

    const toastText = isSimitone
      ? locale.current.TOAST_LAUNCHING.replace( 'FreeSO', 'Simitone' )
      : locale.current.TOAST_LAUNCHING;
    const toast = new Toast( toastText );
    const args = [];

    // windowed by default
    args.push( 'w' );
    // game language, by default english
    if ( ! isSimitone ) {
      // for now disable this for Simitone
      args.push( `-lang${this.getLangCode( this.userSettings.Game.Language )}` );
    }
    // SW only allows ogl
    let graphicsMode = this.userSettings.Game.GraphicsMode != 'sw'
      ? this.userSettings.Game.GraphicsMode : 'ogl';
    if ( process.platform === 'darwin' ) graphicsMode = 'ogl';
    args.push( `-${graphicsMode}` );
    // 3d is forced off when in SW
    if ( this.userSettings.Game[ '3DMode' ] === '1' && ( this.userSettings.Game.GraphicsMode != 'sw' || isSimitone ) ) {
      args.push( '-3d' );
    }
    if ( isSimitone && useVolcanic ) {
      // w Simitone you need to launch Simitone.Windows.exe with the -ide flag
      args.push( '-ide' );
      file = 'Simitone.Windows.exe';
    }
    if ( isSimitone && this.userSettings.Game.SimitoneAA === '1' ) {
      args.push( '-aa' );
    }
    // hz option
    args.push( `-hz${this.getEffectiveRefreshRate()}` );

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
    console.info( 'run', file + ' ' + args.join( ' ' ), cwd );
    ( require( 'child_process' ).spawn( file, args, spawnOptions ) ).unref();

    setTimeout( () => { toast.destroy(); }, 5000 );
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
      const fs  = require( 'fs-extra' );

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
   *
   * @returns {number} The language code.
   */
  getLangCode( lang ) {
    return require( './constants' ).langCodes[ lang ];
  }

  /**
   * Returns the full language strings from the code.
   *
   * @param {number} code Language code (gettable from getLangCode).
   *
   * @returns {string[]} The language strings.
   */
  getLangString( code ) {
    return require( './constants' ).langStrings[ code ];
  }

  /**
   * Save the current state of the configuration.
   *
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   */
  async persist() {
    const toast = new Toast( locale.current.TOAST_SETTINGS );
    const fs = require( 'fs-extra' );
    const ini = require( 'ini' );
    try {
      await fs.writeFile(
        appData + '/FSOLauncher.ini',
        ini.stringify( this.userSettings )
      );
      console.info( 'persist', this.userSettings );
    } catch ( err ) {
      captureWithSentry( err );
      console.error( 'error persisting', { err, userSettings: this.userSettings } );
    } finally {
      setTimeout( () => toast.destroy(), 1500 );
    }
  }

  /**
   * Sets the native progress bar to the given value.
   *
   * @param {number} val The value to set.
   * @param {Electron.ProgressBarOptions} options The options to use.
   */
  setProgressBar( val, options ) {
    if ( ! this.window || this.window.isDestroyed() ) return;
    try {
      this.window.setProgressBar( val, options );
    } catch ( err ) {
      captureWithSentry( err );
      console.error( err );
    }
  }

  /**
   * Returns if the current theme is considerd dark.
   *
   * @returns {boolean} If the theme is dark.
   */
  isDarkMode() {
    return [ 'halloween', 'dark', 'indigo' ].includes( this.userSettings.Launcher.Theme );
  }

  /**
   * Picks a folder for the OCI (one-click installer) flow.
   */
  async ociPickFolder() {
    const { ociName } = require( './constants' ).registry;
    const folders = await Modal.showChooseDirectory( ociName, this.window );
    if ( folders && folders.length > 0 ) {
      this.ociFolder = folders[ 0 ] + '/' + ociName;
      this.IPC.ociPickedFolder( this.ociFolder );
    }
  }

  /**
   * Once the DOM is ready, this method is called.
   */
  initDOM() {
    this.IPC.setTheme( this.userSettings.Launcher.Theme );
    this.IPC.setMaxRefreshRate( getDisplayRefreshRate() );
    this.IPC.restoreConfiguration( this.userSettings );
    this.checkRemeshInfo();
    this.updateNetRequiredUI();
    this.window.focus();
  }

  /**
   * Returns the refresh rate to use.
   *
   * @returns {number} The refresh rate to use.
   */
  getEffectiveRefreshRate() {
    const savedRefreshRate = this.userSettings?.Game?.RefreshRate;
    if ( ! savedRefreshRate ) {
      return getDisplayRefreshRate();
    }
    return parseInt( savedRefreshRate );
  }
}

module.exports = FSOLauncher;
