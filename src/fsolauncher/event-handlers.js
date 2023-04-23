const Modal = require( './lib/modal' );
const { ipcMain } = require( 'electron' );

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
    ipcMain.on( 'INIT_DOM',                this.onInitDOM.bind( this ) );
    ipcMain.on( 'INSTALL',                 this.onInstall.bind( this ) );
    ipcMain.on( 'SET_CONFIGURATION',       this.onSetConfiguration.bind( this ) );
    ipcMain.on( 'INSTALLER_REDIRECT',      this.onInstallerRedirect.bind( this ) );
    ipcMain.on( 'INSTALL_COMPONENT',       this.onInstallComponent.bind( this ) );
    ipcMain.on( 'PLAY',                    this.onPlay.bind( this ) );
    ipcMain.on( 'PLAY_SIMITONE',           this.onPlaySimitone.bind( this ) );
    ipcMain.on( 'FULL_INSTALL',            this.onFullInstall.bind( this ) );
    ipcMain.on( 'FULL_INSTALL_CONFIRM',    this.onFullInstallConfirm.bind( this ) );
    ipcMain.on( 'CHANGE_GAME_PATH',        this.onChangeGamePath.bind( this ) );
    ipcMain.on( 'CHECK_UPDATES',           this.onCheckUpdates.bind( this ) );
    ipcMain.on( 'INSTALL_UPDATE',          this.onInstallUpdate.bind( this ) );
    ipcMain.on( 'PLAY_VOLCANIC',           this.onPlayVolcanic.bind( this ) );
    ipcMain.on( 'PLAY_VOLCANIC_SIMITONE',  this.onPlayVolcanicSimitone.bind( this ) );
    ipcMain.on( 'SOCKET_MESSAGE',          this.onSocketMessage.bind( this ) );
    ipcMain.on( 'CONSOLE_LOG',             this.onConsoleLog.bind( this ) );
    ipcMain.on( 'CHECK_SIMITONE',          this.onCheckSimitoneRequirements.bind( this ) );
    ipcMain.on( 'INSTALL_SIMITONE_UPDATE', this.onInstallSimitoneUpdate.bind( this ) );
    ipcMain.on( 'OCI_PICK_FOLDER',         this.onOCIPickFolder.bind( this ) );
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
   * Fires when the DOM is initialized.
   */
  onInitDOM() {
    this.FSOLauncher.IPC.setTheme( this.FSOLauncher.conf.Launcher.Theme );
    this.FSOLauncher.IPC.restoreConfiguration( this.FSOLauncher.conf );
    this.FSOLauncher.checkRemeshInfo( true );
    this.FSOLauncher.updateNetRequiredUI( true );
    this.FSOLauncher.Window.focus();
    this.FSOLauncher.updateInstalledPrograms( true );
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
   * @param {string} folder The folder to install to.
   */
  onFullInstallConfirm( e, folder ) {
    if ( folder ) {
      this.FSOLauncher.addActiveTask( 'FULL' );
      this.FSOLauncher.runFullInstaller( folder );
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

  /**
   * @param {Electron.IpcMainEvent} e The event object.
   */
  onOCIPickFolder( e ) {
    this.FSOLauncher.ociPickFolder();
  }
}

module.exports = EventHandlers;
