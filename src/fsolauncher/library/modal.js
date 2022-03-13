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
      global.locale.MODAL_NOT_AVAILABLE,
      global.locale.MODAL_NOT_AVAILABLE_DESCR_1 +
        ' <strong>' +
        missing.join( ', ' ) +
        '</strong> ' +
        global.locale.MODAL_NOT_AVAILABLE_DESCR_2,
      global.locale.MODAL_OK2
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
      global.locale.MODAL_INSTALL_DESCR_1 +
        ' <strong>' +
        componentName +
        '</strong> ' +
        global.locale.MODAL_INSTALL_DESCR_2,
      global.locale.MODAL_INSTALL,
      global.locale.MODAL_CANCEL,
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
      global.locale.MODAL_REINSTALL_DESCR_X +
        ' <strong>' +
        componentName +
        '</strong>?',
      global.locale.MODAL_CONTINUE,
      global.locale.MODAL_CANCEL,
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
      global.locale.MODAL_NO_INTERNET,
      global.locale.MODAL_NEED_INTERNET_SINGLE,
      global.locale.MODAL_OK
    );
  }

  /**
   * When a user tries to do a full install with no internet.
   */
  static showNoInternetFullInstall() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NO_INTERNET,
      global.locale.MODAL_NEED_INTERNET_FULL,
      global.locale.MODAL_OK
    );
  }

  /**
   * When a Component has been installed successfully.
   *
   * @param {string} componentName The visual name of the Component.
   */
  static showInstalled( componentName ) {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_INS_COMPLETE,
      componentName + ' ' + global.locale.MODAL_INS_COMPLETE_DESCR,
      global.locale.MODAL_OK2
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
      global.locale.MODAL_INS_FAILED,
      componentName +
        ' ' +
        global.locale.MODAL_INS_FAILED_DESCR_1 +
        ' ' +
        errorMessage,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When a user tries to install something else while already installing 
   * a program. 
   */
  static showAlreadyInstalling() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_INS_PROGRESS,
      global.locale.MODAL_OK
    );
  }

  /**
   * When a user does a full install.
   */
  static showFullInstall() {
    Modal.getIPC().sendModal(
      global.locale.MODAL_INSTALLATION,
      global.locale.MODAL_INSTALLATION_DESCR,
      global.locale.MODAL_START,
      global.locale.MODAL_CANCEL,
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
      global.locale.MODAL_NOT_AVAILABLE2,
      global.locale.MODAL_DETECTED_THAT_1 +
        ' <strong>' +
        componentName +
        '</strong> ' +
        global.locale.MODAL_DETECTED_THAT_2,
      global.locale.MODAL_USE_IT,
      global.locale.MODAL_CANCEL,
      'CHANGE_GAME_PATH',
      JSON.stringify( options )
    );
  }

  /**
   * When the user has changed the game's path.
   */
  static showChangedGamePath() {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_MODIFIED_PATH,
      global.locale.MODAL_MODIFIED_PATH_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * Shows a FilePicker to install the game.
   *
   * @param {string} componentName The visual name of the Component.
   * @param {Electron.BrowserWindow} Window The window to show the FilePicker in.
   * @returns {Promise<string>} The chosen path.
   */
  static async showChooseDirectory( componentName, Window ) {
    let defaultPath = null;
    if( process.platform === "win32" ){
      try {
        const winDefaultPath = await require( 'fs-extra' )
          .stat( 'C:\\Program Files' );
        if( winDefaultPath.isDirectory() ) {
          defaultPath = 'C:\\Program Files';
        }
      } catch( err ) {
        console.log( err );
      }
    }
    if( process.platform === "darwin" ) {
      defaultPath = "~/Documents";
    }
    const response = await require( 'electron' )
      .dialog.showOpenDialog( Window,
      {
        properties: ['openDirectory'],
        title: `${global.locale.MODAL_INSTALL} ${componentName}`,
        defaultPath: defaultPath,
        buttonLabel: global.locale.MODAL_INSTALL_FOLDER
      }
    );
    return response.canceled ? [] : response.filePaths;
  }

  /**
   * When the user tries to do an action that requires both FreeSO and TSO.
   */
  static showNeedFSOTSO() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_NEED_FSOTSO,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the user tried to play while updating.
   */
  static showFailPlay() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_LAUNCH_UPDATING,
      global.locale.MODAL_OK
    );
  }

  /**
   * When a user clicks play without installing FSO or TSO.
   */
  static showNeedToPlay() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_NEED_FSOTSO_PLAY,
      global.locale.MODAL_GOTO_INSTALLER,
      global.locale.MODAL_CANCEL,
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
      global.locale.MODAL_CLOSED_FREESO,
      global.locale.MODAL_CLOSED + ' ' + c + ' ' + global.locale.MODAL_CLOSED_2,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to change language settings for TSO.
   */
  static showTSOLangFail() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_TSO_LANG_ERR,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the launcher failed to change language settings for FSO.
   */
  static showFSOLangFail() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_FSO_LANG_ERR,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the language change was successful.
   */
  static showCHLangComplete() {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_SUCCESS,
      global.locale.MODAL_LANG_SUCCESS,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the TTS settings change was successful.
   * 
   * @param {string} value The new value.
   */
  static showCHTTSComplete( value ) {
    Modal.getIPC().sendSuccessModal(
      value === '1'
        ? global.locale.MODAL_SUCCESS
        : global.locale.MODAL_TTS_DISABLED,
      value === '1'
        ? global.locale.MODAL_TTS_ENABLED_TEXT
        : global.locale.MODAL_TTS_DISABLED_TEXT,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the launcher could not access/write to INI file.
   */
  static showIniFail() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_INI_ERR,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the user is required to launch the game at least once to do an action.
   * This is because the launcher might need some files that FreeSO doesn't generate 
   * until it's launched for the first time.
   */
  static showFirstRun() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_NOT_AVAILABLE,
      global.locale.MODAL_FIRSTTIME,
      global.locale.MODAL_OK2
    );
  }

  /**
   * Shows when there's no remesh available to download from the server.
   */
  static showNoRemesh() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_RPU,
      global.locale.MODAL_RPU_DESCR,
      global.locale.MODAL_OK
    );
  }

  /**
   * Sends a desktop notification to the user.
   *
   * @param {string} title   Notification title.
   * @param {string} message Notification message.
   * @param {string} url     Notification url.
   * @return {Promise<void>} Promise that resolves when the notification is sent.
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
          '../../fsolauncher_ui/fsolauncher_fonts',
          'hinted-Munged-otVXWjH6W8.ttf'
        ),
        { encoding: 'base64' }
      );
      const b64fontFredokaOne = await fs.readFile(
        path.join(
          __dirname,
          '../../fsolauncher_ui/fsolauncher_fonts',
          'FredokaOne-Regular.ttf'
        ),
        { encoding: 'base64' }
      );

      setContainerWidth( 360 );
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
        notification {
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
        notification h1 {
          font-family:'Fredoka One';
          margin-bottom:8px;
          font-size:18px;
          font-weight:200!important;
          color:#4B88E4;
        }
        notification p {
          font-family:'Munged';
          font-size:14px;
          font-weight:normal!important;
          line-height:16px;
          letter-spacing:-0.02em;
          ${shouldBeDark ? 'color: rgba(255, 255, 255, 0.65);' : 'color:#595959;'}
        }
        notification #logo {
          background-image:url("data:image/png;base64,${b64icon}");
          background-size:contain;
          background-position:center center;
          background-repeat:no-repeat;
          width:50px;
          height:50px;
          margin-right:10px;
          flex:0.2;
        }
        notification #content {
          flex:0.8;
        }
        ` );

      const notification = createNotification( {
        content: /* html */`
          <notification class="animate__animated animate__fadeInUp animate__faster">
            <div id="logo"></div>
            <div id="content">
              <h1>${title}</h1>
              <p>${message}</p>
            </div>
          </notification> 
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
    } catch ( e ) {
      console.log( 'Notification broke:', e );
    }
  }

  /**
   * When a user tries to open FreeSO twice.
   */
  static showAlreadyRunning() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_RUNNING,
      global.locale.MODAL_RUNNING_DESC,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the update check failed due to some HTTP error.
   */
  static showFailedUpdateCheck() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_UPDATE_CHECK_FAILED,
      global.locale.MODAL_UPDATE_CHECK_FAILED_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * To confirm a launcher update installation.
   *
   * @param {string} v Version to show in the modal.
   */
  static showInstallUpdate( v ) {
    Modal.getIPC().sendModal(
      global.locale.MODAL_INSTALL_UPDATE,
      global.locale.MODAL_INSTALL_UPDATE_DESCR_1 +
        v +
        global.locale.MODAL_INSTALL_UPDATE_DESCR_2,
      global.locale.MODAL_UPDATE,
      global.locale.MODAL_LATER,
      'INSTALL_UPDATE'
    );
  }

  /**
   * When the launcher update failed to download.
   */
  static showFailedUpdateDownload() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_UPDATE_FAILED,
      global.locale.MODAL_UPDATE_FAILED_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to move the installer package.
   */
  static showFailedUpdateMove() {
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_UPDATE_FAILED,
      global.locale.MODAL_UPDATE_FAILED_MOVE_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher download completed.
   */
  static showUpdateComplete() {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_UPDATE_COMPLETE,
      global.locale.MODAL_UPDATE_COMPLETE_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the user right-clicks the play button to use Volcanic.
   */
  static showVolcanicPrompt() {
    Modal.getIPC().sendModal(
      global.locale.MODAL_START_VOLCANIC,
      global.locale.MODAL_START_VOLCANIC_DESC,
      global.locale.MODAL_START_VOLCANIC_OK,
      global.locale.MODAL_CANCEL,
      'PLAY_VOLCANIC'
    );
  }

  /**
   * When the user right-clicks the play button to use Volcanic, but for Simitone.
   */
  static showVolcanicPromptSimitone() {
    Modal.getIPC().sendModal(
      global.locale.MODAL_START_VOLCANIC,
      global.locale.MODAL_START_VOLCANIC_DESC,
      global.locale.MODAL_START_VOLCANIC_OK,
      global.locale.MODAL_CANCEL,
      'PLAY_VOLCANIC_SIMITONE'
    );
  }

  /**
   * When the launcher could not recover from not having a FreeSO.exe to
   * run due to some program removing the FreeSO/Simitone executables..
   */
  static showCouldNotRecover( isSimitone = false ) {
    let str2 = global.locale.MODAL_FAILED_LAUNCH_DESC;
    if( isSimitone ) {
      str2 = str2
        .replace( 'FreeSO.exe', 'Simitone.Windows.exe' )
        .replace( 'FreeSO', 'Simitone' ); 
    }
    Modal.getIPC().sendErrorModal(
      global.locale.MODAL_FAILED_LAUNCH,
      str2,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher could find the game's .exe.bak to recover.
   */
  static showRecovered() {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_GAME_AUTORECOVERED,
      global.locale.MODAL_GAME_AUTORECOVERED_DESC,
      global.locale.MODAL_OK
    );
  }

  /**
   * Tells the user that Software Mode will be slower than the other options.
   */
  static showSoftwareModeEnabled() {
    Modal.getIPC().sendSuccessModal(
      global.locale.MODAL_SWM,
      global.locale.MODAL_SWM_DESCR,
      global.locale.MODAL_OK
    );
  }

  /**
   * Language will be displayed on launcher restart.
   */
  static showLanguageOnRestart() {
    Modal.getIPC().sendSuccessModal( 
      global.locale.MODAL_REQUIRES_RESTART, 
      global.locale.MODAL_REQUIRES_RESTART_DESC, 
      global.locale.MODAL_OK 
    );
  }

  /**
   * Dialog for the alternative TSO download.
   */
   static showFTPTSO() {
    Modal.getIPC().sendModal(
      'Try alternative download?',
      'This will try and download The Sims Online from an alternative source. ' + 
      'This is useful if the primary download is not working for you.',
      'Continue',
      'Cancel',
      'FTP_TSOResponse'
    );
  }

  /**
   * Used in generic error modal display.
   * 
   * @param {string} error Error message to show.
   */
  static showGenericError( error ) {
    Modal.getIPC().sendErrorModal( 'Ooops!', error, global.locale.MODAL_OK );
  }
}

module.exports = Modal;