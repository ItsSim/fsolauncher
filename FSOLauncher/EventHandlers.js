const Modal = require('./Library/Modal'),
  Event = require('./Library/Event');
/**
 * Handles all events from the client.
 *
 * @class Events
 */
class EventHandlers {
  /**
   * Defines all the currently supported client events.
   *
   * @memberof Events
   */
  defineEvents() {
    let onInitDOM = new Event('INIT_DOM');
    let onInstall = new Event('INSTALL');
    let onSetConfiguration = new Event('SET_CONFIGURATION');
    let onInstallerRedirect = new Event('INSTALLER_REDIRECT');
    let onInstallComponent = new Event('INSTALL_COMPONENT');
    let onPlay = new Event('PLAY');
    let onPlaySimitone = new Event('PLAY_SIMITONE');
    let onFullInstall = new Event('FULL_INSTALL');
    let onFullInstallConfirm = new Event('FULL_INSTALL_CONFIRM');
    let onChangeGamePath = new Event('CHANGE_GAME_PATH');
    let onCheckUpdates = new Event('CHECK_UPDATES');
    let onInstallUpdate = new Event('INSTALL_UPDATE');
    let onPlayVolcanic = new Event('PLAY_VOLCANIC');
    let onPlayVolcanicSimitone = new Event('PLAY_VOLCANIC_SIMITONE');
    let onSocketMessage = new Event('SOCKET_MESSAGE');
    let onConsoleLog = new Event('CONSOLE_LOG');
    let onFTPTSO = new Event('FTP_TSO');
    let onFTPTSOResponse = new Event('FTP_TSOResponse');
    let onCheckSimitoneRequirements = new Event('CHECK_SIMITONE');
    let onInstallSimitoneUpdate = new Event('INSTALL_SIMITONE_UPDATE');

    onInitDOM.onFire(this.onInitDOM.bind(this));
    onSetConfiguration.onFire(this.onSetConfiguration.bind(this));
    onInstallerRedirect.onFire(this.onInstallerRedirect.bind(this));
    onInstallComponent.onFire(this.onInstallComponent.bind(this));
    onInstall.onFire(this.onInstall.bind(this));
    onPlay.onFire(this.onPlay.bind(this));
    onPlaySimitone.onFire(this.onPlaySimitone.bind(this));
    onFullInstall.onFire(this.onFullInstall.bind(this));
    onFullInstallConfirm.onFire(this.onFullInstallConfirm.bind(this));
    onChangeGamePath.onFire(this.onChangeGamePath.bind(this));
    onCheckUpdates.onFire(this.onCheckUpdates.bind(this));
    onInstallUpdate.onFire(this.onInstallUpdate.bind(this));
    onPlayVolcanic.onFire(this.onPlayVolcanic.bind(this));
    onPlayVolcanicSimitone.onFire(this.onPlayVolcanicSimitone.bind(this));
    onSocketMessage.onFire(this.onSocketMessage.bind(this));
    onConsoleLog.onFire(this.onConsoleLog.bind(this));
    onFTPTSO.onFire(this.onFTPTSO.bind(this));
    onFTPTSOResponse.onFire(this.onFTPTSOResponse.bind(this));
    onCheckSimitoneRequirements.onFire(this.onCheckSimitoneRequirements.bind(this));
    onInstallSimitoneUpdate.onFire(this.onInstallSimitoneUpdate.bind(this));
  }

  onInstallSimitoneUpdate() {
    this.install('Simitone', {
      dir: this.isInstalled.Simitone
    });
  }

  onCheckSimitoneRequirements() {
    this.checkSimitoneRequirements();
  }

  onFTPTSO() {
    Modal.showFTPTSO();
  }

  onFTPTSOResponse(e, yes) {
    if (yes) {
      this.install('TSO', {
        fullInstall: false,
        tsoInstaller: 'WebArchiveFTPInstaller',
        override: false
      });
    }
  }
  /**
   * Fires when the DOM is initialized.
   *
   * @memberof Events
   */
  onInitDOM() {
    this.View.setTheme(this.conf.Launcher.Theme);

    this.View.restoreConfiguration(this.conf);

    this.checkRemeshInfo();

    this.updateNetRequiredUI(true);

    //this.checkLauncherUpdates(true);
    this.Window.focus();
  }

  /**
   * Fires when the client receives a Socket.io request.
   *
   * @param {any} e Error (if any)
   * @param {any} Response The actual response.
   * @memberof Events
   */
  onSocketMessage(e, Response) {
    if (this.conf.Launcher.DesktopNotifications === '1') {
      Modal.sendNotification('FreeSO Announcement', Response[0], Response[1]);
    }
  }

  /**
   * When the user wants to install a Component.
   *
   * @param {any} e Error (if any)
   * @param {any} Component The Component to be installed.
   * @memberof Events
   */
  onInstall(e, Component) {
    this.fireInstallModal(Component);
  }

  /**
   * When the configuration settings are altered.
   *
   * @param {*} e Error (if any)
   * @param {*} v 2D Array with key and value.
   */
  onSetConfiguration(e, v) {
    this.setConfiguration(v);
  }

  /**
   * When the user needs to be redirected.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user clicked yes in the dialog.
   * @memberof Events
   */
  onInstallerRedirect(e, yes) {
    if (yes) {
      this.View.changePage('installer');
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
  onInstallComponent(e, yes, Component, options) {
    if (yes) {
      this.install(Component, options);
    }
  }

  onConsoleLog(e, v) {
    console.log(v);
  }

  /**
   * When the user clicks the play button.
   *
   * @param {any} e Error (if any)
   * @param {any} useVolcanic Use Volcanic or not.
   * @memberof Events
   */
  onPlay(e, useVolcanic) {
    this.play(useVolcanic);
  }

  /**
   * When the user wants to launch Volcanic.
   *
   * @param {*} e Error (if any)
   * @param {*} yes The user clicked yes in the dialog.
   */
  onPlayVolcanic(e, yes) {
    if (yes) {
      this.launchGame(true);
    }
  }
  onPlaySimitone(e, useVolcanic) {
    this.play(useVolcanic, true);
  }
  onPlayVolcanicSimitone(e, yes) {
    if (yes) {
      this.launchGame(true, true);
    }
  }

  /**
   * When the user requests a launcher update check.
   *
   * @returns
   * @memberof Events
   */
  onCheckUpdates() {
    if (this.ActiveTasks.length > 0) {
      return Modal.showAlreadyInstalling();
    }
    this.checkLauncherUpdates();
  }

  /**
   * Update dialog callback.
   *
   * @param {any} e Error (if any)
   * @param {any} yes The user said yes.
   * @memberof Events
   */
  onInstallUpdate(e, yes) {
    if (yes) {
      this.installLauncherUpdate();
    }
  }

  /**
   * When the user clicks the Full Install button.
   *
   * @memberof Events
   */
  onFullInstall() {
    if (this.ActiveTasks.length === 0) {
      if (this.hasInternet) Modal.showFullInstall();
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
  onFullInstallConfirm(e, yes) {
    if (yes) {
      this.addActiveTask('FULL');
      this.runFullInstaller();
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
  onChangeGamePath(e, yes, options) {
    options = JSON.parse(options);

    if (yes) {
      this.changeGamePath(options);
    } else {
      this.removeActiveTask(options.component);
    }
  }
}

module.exports = EventHandlers;
