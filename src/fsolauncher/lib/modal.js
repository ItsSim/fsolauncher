const {
  captureWithSentry,
  strFormat,
  normalizePathSlashes
} = require( './utils' );

const { locale } = require( '../locale' );

/**
 * Container class for all the Modal windows.
 */
class Modal {
  /**
   * Returns the Modal IPC object.
   *
   * @returns {import('./ipc-bridge')} The IPC object.
   */
  static getIPC() { return Modal.IPC; }

  /**
   * When a user is missing a program that is needed to install another.
   *
   * @param {string[]} missing List of missing programs.
   */
  static showRequirementsNotMet( missing ) {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NOT_AVAILABLE,
      locale.current.MODAL_NOT_AVAILABLE_DESCR_1 +
        ' <strong>' +
        missing.join( ', ' ) +
        '</strong> ' +
        locale.current.MODAL_NOT_AVAILABLE_DESCR_2,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When a user installs a program for the first time.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {string} componentCode The Component ID to install if the user clicks YES.
   */
  static showFirstInstall( componentName, componentCode ) {
    Modal.getIPC().sendModal(
      componentName,
      locale.current.MODAL_INSTALL_DESCR_1 +
        ' <strong>' +
        componentName +
        '</strong> ' +
        locale.current.MODAL_INSTALL_DESCR_2,
      locale.current.MODAL_INSTALL,
      locale.current.MODAL_CANCEL,
      'INSTALL_COMPONENT',
      componentCode
    );
  }

  /**
   * When a user decides to reinstall a program.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {string} componentCode The Component ID to install if the user clicks YES.
   */
  static showReInstall( componentName, componentCode ) {
    Modal.getIPC().sendModal(
      componentName,
      locale.current.MODAL_REINSTALL_DESCR_X +
        ' <strong>' +
        componentName +
        '</strong>?',
      locale.current.MODAL_CONTINUE,
      locale.current.MODAL_CANCEL,
      'INSTALL_COMPONENT',
      componentCode
    );
  }

  /**
   * When the user tries to do an action that requires an active
   * internet connection.
   */
  static showNoInternet() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NO_INTERNET,
      locale.current.MODAL_NEED_INTERNET_SINGLE,
      locale.current.MODAL_OK
    );
  }

  /**
   * When a user tries to do a full install with no internet.
   */
  static showNoInternetFullInstall() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NO_INTERNET,
      locale.current.MODAL_NEED_INTERNET_FULL,
      locale.current.MODAL_OK
    );
  }

  /**
   * When a Component has been installed successfully.
   *
   * @param {string} componentName The visual name of the Component.
   */
  static showInstalled( componentName ) {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_INS_COMPLETE,
      componentName + ' ' + locale.current.MODAL_INS_COMPLETE_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When a Component failed to install.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {string} errorMessage  Error message to display.
   */
  static showFailedInstall( componentName, errorMessage ) {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_INS_FAILED,
      componentName +
        ' ' +
        locale.current.MODAL_INS_FAILED_DESCR_1 +
        ' ' +
        errorMessage,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When a user tries to install something else while already installing
   * a program.
   */
  static showAlreadyInstalling() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NEGATIVE,
      locale.current.MODAL_INS_PROGRESS,
      locale.current.MODAL_OK
    );
  }

  /**
   * When a user does a full install.
   */
  static showFullInstall() {
    Modal.getIPC().sendModal(
      locale.current.MODAL_INSTALLATION,
      locale.current.MODAL_INSTALLATION_DESCR,
      locale.current.MODAL_START,
      locale.current.MODAL_CANCEL,
      'FULL_INSTALL_CONFIRM'
    );
  }

  /**
   * When a program the user wants to install is already installed.
   * This prompt will let users reinstall it if desired.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {string} componentCode The Component ID to install if the user clicks YES.
   * @param {string} path The path to the Component.
   */
  static showAlreadyInstalled( componentName, componentCode, path ) {
    const options = {
      component: componentCode,
      override: path
    };

    Modal.getIPC().sendModal(
      locale.current.MODAL_NOT_AVAILABLE2,
      locale.current.MODAL_DETECTED_THAT_1 +
        ' <strong>' +
        componentName +
        '</strong> ' +
        locale.current.MODAL_DETECTED_THAT_2,
      locale.current.MODAL_USE_IT,
      locale.current.MODAL_CANCEL,
      'CHANGE_GAME_PATH',
      JSON.stringify( options )
    );
  }

  /**
   * When the user has changed the game's path.
   */
  static showChangedGamePath() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_MODIFIED_PATH,
      locale.current.MODAL_MODIFIED_PATH_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * Shows a FilePicker to install the game.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {Electron.BrowserWindow} window The window to show the FilePicker in.
   *
   * @returns {Promise<string>} The chosen path.
   */
  static async showChooseDirectory( componentName, window ) {
    let defaultPath = null;
    if ( process.platform === 'win32' ) {
      try {
        const winDefaultPath = await require( 'fs-extra' )
          .stat( 'C:\\Program Files' );
        if ( winDefaultPath.isDirectory() ) {
          defaultPath = 'C:\\Program Files';
        }
      } catch ( err ) {
        captureWithSentry( err, { componentName } );
        console.error( err );
      }
    }
    if ( process.platform === 'darwin' ) {
      defaultPath = '~/Documents';
    }
    const response = await require( 'electron' )
      .dialog.showOpenDialog( window,
        {
          properties: [ 'openDirectory' ],
          title: `${locale.current.MODAL_INSTALL} ${componentName}`,
          defaultPath: defaultPath
        }
      );
    return response.canceled ? [] : response.filePaths;
  }

  /**
   * When the user tries to do an action that requires both FreeSO and TSO.
   */
  static showNeedFSOTSO() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NEGATIVE,
      locale.current.MODAL_NEED_FSOTSO,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the user tried to play while updating.
   */
  static showFailPlay() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NEGATIVE,
      locale.current.MODAL_LAUNCH_UPDATING,
      locale.current.MODAL_OK
    );
  }

  /**
   * When a user clicks play without installing FSO or TSO.
   */
  static showNeedToPlay() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NEGATIVE,
      locale.current.MODAL_NEED_FSOTSO_PLAY,
      locale.current.MODAL_GOTO_INSTALLER,
      locale.current.MODAL_CANCEL,
      'INSTALLER_REDIRECT'
    );
  }

  /**
   * When a FreeSO process has been closed.
   *
   * @param {any} c Count of FreeSO processes that have been closed.
   */
  static showKilled( c ) {
    Modal.getIPC().sendSuccessModalNoFocus(
      locale.current.MODAL_CLOSED_FREESO,
      locale.current.MODAL_CLOSED + ' ' + c + ' ' + locale.current.MODAL_CLOSED_2,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to change language settings for TSO.
   */
  static showTSOLangFail() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NOT_COMPLETE,
      locale.current.MODAL_TSO_LANG_ERR,
      locale.current.MODAL_OK
    );
  }

  /**
   * When the launcher failed to change language settings for FSO.
   */
  static showFSOLangFail() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NOT_COMPLETE,
      locale.current.MODAL_FSO_LANG_ERR,
      locale.current.MODAL_OK
    );
  }

  /**
   * When the language change was successful.
   */
  static showCHLangComplete() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_SUCCESS,
      locale.current.MODAL_LANG_SUCCESS,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the launcher could not access/write to INI file.
   */
  static showIniFail() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NOT_COMPLETE,
      locale.current.MODAL_INI_ERR,
      locale.current.MODAL_OK
    );
  }

  /**
   * When the user is required to launch the game at least once to do an action.
   * This is because the launcher might need some files that FreeSO doesn't generate
   * until it's launched for the first time.
   */
  static showFirstRun() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_NOT_AVAILABLE,
      locale.current.MODAL_FIRSTTIME,
      locale.current.MODAL_OK2
    );
  }

  /**
   * Shows when there's no remesh available to download from the server.
   */
  static showNoRemesh() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_RPU,
      locale.current.MODAL_RPU_DESCR,
      locale.current.MODAL_OK
    );
  }

  /**
   * Sends a desktop notification to the user.
   *
   * @param {string} title   Notification title.
   * @param {string} message Notification message.
   * @param {string} url     Notification url.
   *
   * @returns {Promise<void>} Promise that resolves when the notification is sent.
   */
  static async sendNotification( title, message, url, ok = false, shouldBeDark ) {
    const {
      setGlobalStyles,
      createNotification,
      setContainerWidth
    } = require( 'electron-custom-notifications' );

    const path = require( 'path' ),
      fs = require( 'fs-extra' );

    try {
      const b64icon = await fs.readFile(
        path.join( __dirname, '../../', 'beta.ico' ),
        { encoding: 'base64' }
      );
      const b64fontMunged = await fs.readFile(
        path.join(
          __dirname,
          '../../fsolauncher_ui/fonts',
          'hinted-Munged-otVXWjH6W8.ttf'
        ),
        { encoding: 'base64' }
      );
      const b64fontFredokaOne = await fs.readFile(
        path.join(
          __dirname,
          '../../fsolauncher_ui/fonts',
          'FredokaOne-Regular.ttf'
        ),
        { encoding: 'base64' }
      );

      setContainerWidth( 350 );
      // Use the vscode extension es6-string-html to highlight
      // the syntax for this CSS.
      setGlobalStyles( /* css */`
        body {
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
        }
        @font-face {
          font-family: 'Munged';
          src: url(data:font/truetype;charset=utf-8;base64,${b64fontMunged}) format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Fredoka One';
          src: url(data:font/truetype;charset=utf-8;base64,${b64fontFredokaOne}) format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        .notification {
          -webkit-user-select: none;
          cursor:pointer;
          overflow:hidden;
          display:block;
          padding:20px;
          ${shouldBeDark ?
    'background-image: -webkit-linear-gradient(#15202b, #10171e 100%, #15202b);' :
    'background-image: -webkit-linear-gradient(#fafafa, #f4f4f4 40%, #e5e5e5);'}
          margin:10px;
          border-radius:8px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          display:flex;
          ${process.platform == 'darwin' ? 'margin-bottom:40px;' : ''}
          ${shouldBeDark ? 'border: 1px solid #414141;' : ''}
        }
        .notification h1 {
          font-family:'Fredoka One';
          margin-bottom:8px;
          font-size:18px;
          font-weight:200!important;
          color:#4C8DEE;
        }
        .notification p {
          font-family:'Munged';
          font-size:14px;
          font-weight:normal!important;
          line-height:16px;
          letter-spacing:-0.02em;
          ${shouldBeDark ? 'color: rgba(255, 255, 255, 0.65);' : 'color:#595959;'}
        }
        .notification #logo {
          background-image:url("data:image/png;base64,${b64icon}");
          background-size:contain;
          background-position:center center;
          background-repeat:no-repeat;
          width:50px;
          height:50px;
          margin-right:10px;
          flex:0.2;
        }
        .notification #content {
          flex:0.8;
        }
        ` );

      const notification = createNotification( {
        content: /* html */`
          <div class="notification animate__animated animate__fadeInUp animate__faster">
            <div id="logo"></div>
            <div id="content">
              <h1>${title}</h1>
              <p>${message}</p>
            </div>
          </div> 
          `,
        timeout: 10000
      } );

      notification.on( 'display', () => {
        Modal.getIPC().sendSound( ok ? 'ok' : 'notification' );
        Modal.getIPC().sendNotifLog( title, message, url );
      } );

      notification.on( 'click', () => {
        if ( url ) {
          require( 'electron' ).shell.openExternal( url );
        }
        notification.close();
      } );
    } catch ( err ) {
      captureWithSentry( err, { title, message, url } );
      console.error( err );
    }
  }

  /**
   * When a user tries to open FreeSO twice.
   */
  static showAlreadyRunning() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_RUNNING,
      locale.current.MODAL_RUNNING_DESC,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the update check failed due to some HTTP error.
   */
  static showFailedUpdateCheck() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_UPDATE_CHECK_FAILED,
      locale.current.MODAL_UPDATE_CHECK_FAILED_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * To confirm a launcher update installation.
   *
   * @param {string} v Version to show in the modal.
   */
  static showInstallUpdate( v ) {
    Modal.getIPC().sendModal(
      locale.current.MODAL_INSTALL_UPDATE,
      locale.current.MODAL_INSTALL_UPDATE_DESCR_1 +
        v +
        locale.current.MODAL_INSTALL_UPDATE_DESCR_2,
      locale.current.MODAL_UPDATE,
      locale.current.MODAL_LATER,
      'INSTALL_UPDATE'
    );
  }

  /**
   * When the launcher update failed to download.
   */
  static showFailedUpdateDownload() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_UPDATE_FAILED,
      locale.current.MODAL_UPDATE_FAILED_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to move the installer package.
   */
  static showFailedUpdateMove() {
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_UPDATE_FAILED,
      locale.current.MODAL_UPDATE_FAILED_MOVE_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the launcher download completed.
   */
  static showUpdateComplete() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_UPDATE_COMPLETE,
      locale.current.MODAL_UPDATE_COMPLETE_DESCR,
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the user right-clicks the play button to use Volcanic.
   */
  static showVolcanicPrompt() {
    Modal.getIPC().sendModal(
      locale.current.MODAL_START_VOLCANIC,
      locale.current.MODAL_START_VOLCANIC_DESC,
      locale.current.MODAL_START_VOLCANIC_OK,
      locale.current.MODAL_CANCEL,
      'PLAY_VOLCANIC'
    );
  }

  /**
   * When the user right-clicks the play button to use Volcanic, but for Simitone.
   */
  static showVolcanicPromptSimitone() {
    Modal.getIPC().sendModal(
      locale.current.MODAL_START_VOLCANIC,
      locale.current.MODAL_START_VOLCANIC_DESC,
      locale.current.MODAL_START_VOLCANIC_OK,
      locale.current.MODAL_CANCEL,
      'PLAY_VOLCANIC_SIMITONE'
    );
  }

  /**
   * When the launcher could not launch the gme because of a missing
   * executable file.
   *
   * @param {string} path
   * @param {boolean} isSimitone
   */
  static showCouldNotRecover( path, isSimitone = false ) {
    path = normalizePathSlashes( path );
    let str2 = locale.current.MODAL_FAILED_LAUNCH_DESC;
    if ( isSimitone ) {
      str2 = str2
        .replace( 'FreeSO.exe', 'Simitone.Windows.exe' )
        .replace( 'FreeSO', 'Simitone' );
    }
    Modal.getIPC().sendErrorModal(
      locale.current.MODAL_FAILED_LAUNCH,
      strFormat( str2, path ),
      locale.current.MODAL_OK2
    );
  }

  /**
   * When the launcher could find the game's .exe.bak to recover.
   */
  static showRecovered() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_GAME_AUTORECOVERED,
      locale.current.MODAL_GAME_AUTORECOVERED_DESC,
      locale.current.MODAL_OK
    );
  }

  /**
   * Tells the user that Software Mode will be slower than the other options.
   */
  static showSoftwareModeEnabled() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_SWM,
      locale.current.MODAL_SWM_DESCR,
      locale.current.MODAL_OK
    );
  }

  /**
   * Language will be displayed on launcher restart.
   */
  static showLanguageOnRestart() {
    Modal.getIPC().sendSuccessModal(
      locale.current.MODAL_REQUIRES_RESTART,
      locale.current.MODAL_REQUIRES_RESTART_DESC,
      locale.current.MODAL_OK
    );
  }

  /**
   * Used in generic error modal display.
   *
   * @param {string} error Error message to show.
   */
  static showGenericError( error ) {
    Modal.getIPC().sendErrorModal( 'Ooops!', error, locale.current.MODAL_OK );
  }
}

module.exports = Modal;