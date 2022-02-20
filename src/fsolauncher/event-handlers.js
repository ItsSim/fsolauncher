const Modal = require( './library/modal' );
const RendererEvent = require( './library/renderer-event' );

/**
 * Handles all events from the client.
 */
class EventHandlers {
  /**
   * @param {import('./fsolauncher')} FSOLauncher The FSOLauncher instance.
   */
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
  }
  /**
   * Defines all the currently supported client events.
   */
  defineEvents() {
    const onInitDOM                   = new RendererEvent( 'INIT_DOM' );
    const onInstall                   = new RendererEvent( 'INSTALL' );
    const onSetConfiguration          = new RendererEvent( 'SET_CONFIGURATION' );
    const onInstallerRedirect         = new RendererEvent( 'INSTALLER_REDIRECT' );
    const onInstallComponent          = new RendererEvent( 'INSTALL_COMPONENT' );
    const onPlay                      = new RendererEvent( 'PLAY' );
    const onPlaySimitone              = new RendererEvent( 'PLAY_SIMITONE' );
    const onFullInstall               = new RendererEvent( 'FULL_INSTALL' );
    const onFullInstallConfirm        = new RendererEvent( 'FULL_INSTALL_CONFIRM' );
    const onChangeGamePath            = new RendererEvent( 'CHANGE_GAME_PATH' );
    const onCheckUpdates              = new RendererEvent( 'CHECK_UPDATES' );
    const onInstallUpdate             = new RendererEvent( 'INSTALL_UPDATE' );
    const onPlayVolcanic              = new RendererEvent( 'PLAY_VOLCANIC' );
    const onPlayVolcanicSimitone      = new RendererEvent( 'PLAY_VOLCANIC_SIMITONE' );
    const onSocketMessage             = new RendererEvent( 'SOCKET_MESSAGE' );
    const onConsoleLog                = new RendererEvent( 'CONSOLE_LOG' );
    const onFTPTSO                    = new RendererEvent( 'FTP_TSO' );
    const onFTPTSOResponse            = new RendererEvent( 'FTP_TSOResponse' );
    const onCheckSimitoneRequirements = new RendererEvent( 'CHECK_SIMITONE' );
    const onInstallSimitoneUpdate     = new RendererEvent( 'INSTALL_SIMITONE_UPDATE' );

    onInitDOM
      .onFire( this.onInitDOM.bind( this ) );
    onSetConfiguration
      .onFire( this.onSetConfiguration.bind( this ) );
    onInstallerRedirect
      .onFire( this.onInstallerRedirect.bind( this ) );
    onInstallComponent
      .onFire( this.onInstallComponent.bind( this ) );
    onInstall
      .onFire( this.onInstall.bind( this ) );
    onPlay
      .onFire( this.onPlay.bind( this ) );
    onPlaySimitone
      .onFire( this.onPlaySimitone.bind( this ) );
    onFullInstall
      .onFire( this.onFullInstall.bind( this ) );
    onFullInstallConfirm
      .onFire( this.onFullInstallConfirm.bind( this ) );
    onChangeGamePath
      .onFire( this.onChangeGamePath.bind( this ) );
    onCheckUpdates
      .onFire( this.onCheckUpdates.bind( this ) );
    onInstallUpdate
      .onFire( this.onInstallUpdate.bind( this ) );
    onPlayVolcanic
      .onFire( this.onPlayVolcanic.bind( this ) );
    onPlayVolcanicSimitone
      .onFire( this.onPlayVolcanicSimitone.bind( this ) );
    onSocketMessage
      .onFire( this.onSocketMessage.bind( this ) );
    onConsoleLog
      .onFire( this.onConsoleLog.bind( this ) );
    onFTPTSO
      .onFire( this.onFTPTSO.bind( this ) );
    onFTPTSOResponse
      .onFire( this.onFTPTSOResponse.bind( this ) );
    onCheckSimitoneRequirements
      .onFire( this.onCheckSimitoneRequirements.bind( this ) );
    onInstallSimitoneUpdate
      .onFire( this.onInstallSimitoneUpdate.bind( this ) );
  }
  /**
   * Received when the user request a Simitone update.
   */
  onInstallSimitoneUpdate() {
    this.FSOLauncher.install( 'Simitone', { dir: this.FSOLauncher.isInstalled.Simitone } )
      .catch( console.error );
  }
  /**
   * Received when the renderer process asks the main process to check for 
   * Simitone updates.
   */
  onCheckSimitoneRequirements() {
    this.FSOLauncher.checkSimitoneRequirements();
  }
  /**
   * Fires when the user requests an alternative TSO installation source.
   * @deprecated Not used since there's really only one source available right now
   *             since largedownloads went down.
   */
  onFTPTSO() {
    Modal.showFTPTSO();
  }
  /**
   * Fires as a user's response to showFTPTSO().
   * @deprecated Not used since there's really only one source available right now
   *             since largedownloads went down.
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   */
  onFTPTSOResponse( e, yes ) {
    if ( yes ) {
      const params = {
        fullInstall: false,
        tsoInstaller: 'WebArchiveFTPInstaller',
        override: false
      };
      this.FSOLauncher.install( 'TSO', params )
        .catch( console.error );
    }
  }
  /**
   * Fires when the DOM is initialized.
   */
  onInitDOM() {
    this.FSOLauncher.IPC.setTheme( this.FSOLauncher.conf.Launcher.Theme );
    this.FSOLauncher.IPC.restoreConfiguration( this.FSOLauncher.conf );
    this.FSOLauncher.checkRemeshInfo();
    this.FSOLauncher.updateNetRequiredUI( true );
    this.FSOLauncher.Window.focus();
    this.FSOLauncher.updateInstalledPrograms();
  }

  /**
   * Fires when the client receives a Socket.io request.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {string[]} response The response from the client.
   */
  onSocketMessage( e, response ) {
    if ( this.FSOLauncher.conf.Launcher.DesktopNotifications === '1' ) {
      Modal.sendNotification( 'FreeSO Announcement', 
        response[0], 
        response[1], 
        null, this.FSOLauncher.isDarkMode() );
    }
  }
  /**
   * When the user wants to install a Component.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {string} componentCode The Component to be installed.
   */
  onInstall( e, componentCode ) {
    this.FSOLauncher.fireInstallModal( componentCode );
  }
  /**
   * When the configuration settings are altered.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {string[]} v [Config Key] - [Config Subkey] - [Config Value]
   */
  onSetConfiguration( e, v ) {
    this.FSOLauncher.setConfiguration( v );
  }
  /**
   * When the user needs to be redirected.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   */
  onInstallerRedirect( e, yes ) {
    if ( yes ) {
      this.FSOLauncher.IPC.changePage( 'installer' );
    }
  }
  /**
   * When the user wants to install a single Component.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes The user clicked yes in the dialog.
   * @param {string} componentCode The Component to be installed.
   * @param {object} options Options for the installer.
   */
  onInstallComponent( e, yes, componentCode, options ) {
    if ( yes ) {
      this.FSOLauncher.install( componentCode, options )
        .catch( console.error );
    }
  }
  /**
   * When the renderer process requests a main process console.log.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {string} v The message to be logged.
   */
  onConsoleLog( e, v ) { console.log( v ); }
  /**
   * When the user clicks the play button.
   *
   * @param {any} e Error (if any)
   * @param {any} useVolcanic Use Volcanic or not.
   */
  onPlay( e, useVolcanic ) {
    this.FSOLauncher.play( useVolcanic );
  }
  /**
   * When the user wants to launch Volcanic.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   */
  onPlayVolcanic( e, yes ) {
    if ( yes ) {
      this.FSOLauncher.launchGame( true );
    }
  }
  onPlaySimitone( e, useVolcanic ) {
    this.FSOLauncher.play( useVolcanic, true );
  }
  onPlayVolcanicSimitone( e, yes ) {
    if ( yes ) {
      this.FSOLauncher.launchGame( true, true );
    }
  }
  /**
   * When the user requests a launcher update check.
   *
   * @returns {void}
   */
  onCheckUpdates() {
    if ( this.FSOLauncher.activeTasks.length > 0 ) {
      return Modal.showAlreadyInstalling();
    }
    this.FSOLauncher.checkLauncherUpdates();
  }
  /**
   * Update dialog callback.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   */
  onInstallUpdate( e, yes ) {
    if ( yes ) {
      this.FSOLauncher.installLauncherUpdate();
    }
  }
  /**
   * When the user clicks the Full Install button.
   */
  onFullInstall() {
    if ( this.FSOLauncher.activeTasks.length === 0 ) {
      if ( this.FSOLauncher.hasInternet ) Modal.showFullInstall();
      else Modal.showNoInternetFullInstall();
    } else {
      Modal.showAlreadyInstalling();
    }
  }
  /**
   * Full install dialog callback.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   */
  onFullInstallConfirm( e, yes ) {
    if ( yes ) {
      this.FSOLauncher.addActiveTask( 'FULL' );
      this.FSOLauncher.runFullInstaller();
    }
  }
  /**
   * When the user changes the game path.
   *
   * @param {Electron.IpcMainEvent} e The event object.
   * @param {boolean} yes If the user selected yes.
   * @param {object} options The options for the installer.
   */
  onChangeGamePath( e, yes, options ) {
    options = JSON.parse( options );

    if ( yes ) {
      this.FSOLauncher.changeGamePath( options );
    } else {
      this.FSOLauncher.removeActiveTask( options.component );
    }
  }
}

module.exports = EventHandlers;
