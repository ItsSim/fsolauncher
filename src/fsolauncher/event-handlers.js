// eslint-disable-next-line no-unused-vars
const FSOLauncher = require( './fsolauncher' ),
  Modal = require( './library/modal' ),
  RendererEvent = require( './library/renderer-event' );
/**
 * Handles all events from the client.
 *
 * @class EventHandlers
 */
class EventHandlers {
  /**
   * Defines all the currently supported client events.
   *
   * @memberof Events
   */
  defineEvents( fsolauncher ) {
    /**
     * The launcher instance.
     * @type {FSOLauncher}
     */
    this.fsolauncher = fsolauncher;

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
   *
   * @memberof EventHandlers
   */
  onInstallSimitoneUpdate() {
    this.fsolauncher.install( 'Simitone', { dir: this.fsolauncher.isInstalled.Simitone } )
      .catch( console.error );
  }
  /**
   * Received when the renderer process asks the main process to check for 
   * Simitone updates.
   *
   * @memberof EventHandlers
   */
  onCheckSimitoneRequirements() {
    this.fsolauncher.checkSimitoneRequirements();
  }
  /**
   * Fires when the user requests an alternative TSO installation source.
   * @deprecated Not used since there's really only one source available right now
   *             since largedownloads went down.
   *
   * @memberof EventHandlers
   */
  onFTPTSO() {
    Modal.showFTPTSO();
  }
  /**
   * Fires as a user's response to showFTPTSO().
   * @deprecated Not used since there's really only one source available right now
   *             since largedownloads went down.
   *
   * @memberof EventHandlers
   */
  onFTPTSOResponse( e, yes ) {
    if ( yes ) {
      const params = {
        fullInstall: false,
        tsoInstaller: 'WebArchiveFTPInstaller',
        override: false
      };
      this.fsolauncher.install( 'TSO', params )
        .catch( console.error );
    }
  }
  /**
   * Fires when the DOM is initialized.
   *
   * @memberof Events
   */
  onInitDOM() {
    this.fsolauncher.View.setTheme( this.fsolauncher.conf.Launcher.Theme );

    this.fsolauncher.View.restoreConfiguration( this.fsolauncher.conf );

    this.fsolauncher.checkRemeshInfo();

    this.fsolauncher.updateNetRequiredUI( true );

    //this.checkLauncherUpdates(true);
    this.fsolauncher.Window.focus();
    this.fsolauncher.updateInstalledPrograms();

    if( process.platform == "win32" ) {
      //this.FSODetector = new FSODetector( this.onDetectorResponse.bind( this ) );
      //this.FSODetector.start();
    }
  }

  /**
   * Fires when the client receives a Socket.io request.
   *
   * @param {any} e Error (if any)
   * @param {any} Response The actual response.
   * @memberof Events
   */
  onSocketMessage( e, Response ) {
    if ( this.fsolauncher.conf.Launcher.DesktopNotifications === '1' ) {
      Modal.sendNotification( 'FreeSO Announcement', Response[0], Response[1] );
    }
  }
  /**
   * When the user wants to install a Component.
   *
   * @param {any} e Error (if any)
   * @param {any} Component The Component to be installed.
   * @memberof Events
   */
  onInstall( e, Component ) {
    this.fsolauncher.fireInstallModal( Component );
  }
  /**
   * When the configuration settings are altered.
   *
   * @param {*} e Error (if any)
   * @param {*} v 2D Array with key and value.
   */
  onSetConfiguration( e, v ) {
    this.fsolauncher.setConfiguration( v );
  }
  /**
   * When the user needs to be redirected.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user clicked yes in the dialog.
   * @memberof Events
   */
  onInstallerRedirect( e, yes ) {
    if ( yes ) {
      this.fsolauncher.View.changePage( 'installer' );
    }
  }
  /**
   * When the user wants to install a single Component.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user clicked yes in the dialog.
   * @param {any} Component The Component to be installed.
   * @param {any} options
   * @memberof Events
   */
  onInstallComponent( e, yes, Component, options ) {
    if ( yes ) {
      this.fsolauncher.install( Component, options )
        .catch( console.error );
    }
  }
  /**
   * When the renderer process requests a main process console.log.
   *
   * @param {*} e
   * @param {*} v
   * @memberof EventHandlers
   */
  onConsoleLog( e, v ) {
    console.log( v );
  }
  /**
   * When the user clicks the play button.
   *
   * @param {any} e Error (if any)
   * @param {any} useVolcanic Use Volcanic or not.
   * @memberof Events
   */
  onPlay( e, useVolcanic ) {
    this.fsolauncher.play( useVolcanic );
  }
  /**
   * When the user wants to launch Volcanic.
   *
   * @param {*} e Error (if any)
   * @param {*} yes The user clicked yes in the dialog.
   */
  onPlayVolcanic( e, yes ) {
    if ( yes ) {
      this.fsolauncher.launchGame( true );
    }
  }
  onPlaySimitone( e, useVolcanic ) {
    this.fsolauncher.play( useVolcanic, true );
  }
  onPlayVolcanicSimitone( e, yes ) {
    if ( yes ) {
      this.fsolauncher.launchGame( true, true );
    }
  }
  /**
   * When the user requests a launcher update check.
   *
   * @returns
   * @memberof Events
   */
  onCheckUpdates() {
    if ( this.fsolauncher.ActiveTasks.length > 0 ) {
      return Modal.showAlreadyInstalling();
    }
    this.fsolauncher.checkLauncherUpdates();
  }
  /**
   * Update dialog callback.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user said yes.
   * @memberof Events
   */
  onInstallUpdate( e, yes ) {
    if ( yes ) {
      this.fsolauncher.installLauncherUpdate();
    }
  }
  /**
   * When the user clicks the Full Install button.
   *
   * @memberof Events
   */
  onFullInstall() {
    if ( this.fsolauncher.ActiveTasks.length === 0 ) {
      if ( this.fsolauncher.hasInternet ) Modal.showFullInstall();
      else Modal.showNoInternetFullInstall();
    } else {
      Modal.showAlreadyInstalling();
    }
  }
  /**
   * Full install dialog callback.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user said yes.
   * @memberof Events
   */
  onFullInstallConfirm( e, yes ) {
    if ( yes ) {
      this.fsolauncher.addActiveTask( 'FULL' );
      this.fsolauncher.runFullInstaller();
    }
  }
  /**
   * When the user changes the game path.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user said yes.
   * @param {any} options ??
   * @memberof Events
   */
  onChangeGamePath( e, yes, options ) {
    options = JSON.parse( options );

    if ( yes ) {
      this.fsolauncher.changeGamePath( options );
    } else {
      this.fsolauncher.removeActiveTask( options.component );
    }
  }
}

module.exports = EventHandlers;
