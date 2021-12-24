const { app } = require('electron');
const os = require( 'os' );

/**
 * Container class for all the Modal windows.
 *
 * @class Modal
 */
class Modal {
  
  /**
   * Show diagnostics modal
   *
   * @static
   * @memberof Modal
   */
  static showDiagnostics() {
    Modal.View.sendModal(
      'Diagnostics',
      '<p><span style="padding: 3px; background-color:rgba(1,1,1,0.1); font-size:12px; width:350px; height:100px; display: inline-block; -webkit-user-select:all; overflow-y:scroll">' +
      'FSOLauncher Version: ' + app.getVersion() + '<br />' +
      'OS Version: ' + os.version() + '<br />' +
      'CPU: ' + os.cpus()[0].model + '<br />' +
      '</span></p>',
      'Close'
    );
  }
  /**
   * Dialog for the alternative TSO download.
   *
   * @static
   * @memberof Modal
   */
  static showFTPTSO() {
    Modal.View.sendModal(
      'Try alternative download?',
      'This will try and download The Sims Online from an alternative source. This is useful if the primary download is not working for you.',
      'Continue',
      'Cancel',
      'FTP_TSOResponse'
    );
  }
  /**
   * When a user is missing a program that is needed
   * to install another.
   *
   * @static
   * @param {any} Missing An Array of strings of all the missing programs.
   * @memberof Modal
   */
  static showRequirementsNotMet( Missing ) {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_AVAILABLE,
      global.locale.MODAL_NOT_AVAILABLE_DESCR_1 +
        ' <strong>' +
        Missing.join( ', ' ) +
        '</strong> ' +
        global.locale.MODAL_NOT_AVAILABLE_DESCR_2,
      global.locale.MODAL_OK2
    );
  }
  /**
   * When a user installs a program for the first time.
   *
   * @static
   * @param {any} ComponentName The visual name of the Component.
   * @param {any} ComponentID The Component ID to install if YES.
   * @memberof Modal
   */
  static showFirstInstall( ComponentName, ComponentID ) {
    Modal.View.sendModal(
      ComponentName,
      global.locale.MODAL_INSTALL_DESCR_1 +
        ' <strong>' +
        ComponentName +
        '</strong> ' +
        global.locale.MODAL_INSTALL_DESCR_2,
      global.locale.MODAL_INSTALL,
      global.locale.MODAL_CANCEL,
      'INSTALL_COMPONENT',
      ComponentID
    );
  }
  /**
   * When a user decides to reinstall a program.
   *
   * @static
   * @param {any} ComponentName The visual name of the Component.
   * @param {any} ComponentID The Component ID to install if YES.
   * @memberof Modal
   */
  static showReInstall( ComponentName, ComponentID ) {
    Modal.View.sendModal(
      ComponentName,
      global.locale.MODAL_REINSTALL_DESCR_X +
        ' <strong>' +
        ComponentName +
        '</strong>?',
      global.locale.MODAL_CONTINUE,
      global.locale.MODAL_CANCEL,
      'INSTALL_COMPONENT',
      ComponentID
    );
  }
  /**
   * When the user tries to do an action that requires an
   * active internet connection.
   *
   * @static
   * @memberof Modal
   */
  static showNoInternet() {
    Modal.View.sendModal(
      global.locale.MODAL_NO_INTERNET,
      global.locale.MODAL_NEED_INTERNET_SINGLE,
      global.locale.MODAL_OK
    );
  }
  /**
   * When a user tries to do a full install with no internet.
   *
   * @static
   * @memberof Modal
   */
  static showNoInternetFullInstall() {
    Modal.View.sendModal(
      global.locale.MODAL_NO_INTERNET,
      global.locale.MODAL_NEED_INTERNET_FULL,
      global.locale.MODAL_OK
    );
  }
  /**
   * When a Component has been installed successfully.
   *
   * @static
   * @param {any} ComponentName Visual Component name.
   * @memberof Modal
   */
  static showInstalled( ComponentName ) {
    Modal.View.sendModal(
      global.locale.MODAL_INS_COMPLETE,
      ComponentName + ' ' + global.locale.MODAL_INS_COMPLETE_DESCR,
      global.locale.MODAL_OK2
    );
  }
  /**
   * When a Component failed to install.
   *
   * @static
   * @param {any} ComponentName Visual Component name.
   * @param {any} ErrorMessage Error message to display.
   * @memberof Modal
   */
  static showFailedInstall( ComponentName, ErrorMessage ) {
    Modal.View.sendModal(
      global.locale.MODAL_INS_FAILED,
      ComponentName +
        ' ' +
        global.locale.MODAL_INS_FAILED_DESCR_1 +
        ' ' +
        ErrorMessage,
      global.locale.MODAL_OK2
    );
  }
  /**
   * When a user tries to install something else while
   * already installing a program.
   *
   * @static
   * @memberof Modal
   */
  static showAlreadyInstalling() {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_AVAILABLE2,
      global.locale.MODAL_INS_PROGRESS,
      global.locale.MODAL_OK
    );
  }
  /**
   * When a user does a full install.
   *
   * @static
   * @memberof Modal
   */
  static showFullInstall() {
    Modal.View.sendModal(
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
   * @static
   * @param {any} ComponentName Visual Component name.
   * @param {any} ComponentID The Component's Id.
   * @param {any} path The path to install to.
   * @memberof Modal
   */
  static showAlreadyInstalled( ComponentName, ComponentID, path ) {
    const options = {
      component: ComponentID,
      override: path
    };

    Modal.View.sendModal(
      global.locale.MODAL_NOT_AVAILABLE2,
      global.locale.MODAL_DETECTED_THAT_1 +
        ' <strong>' +
        ComponentName +
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
   *
   * @static
   * @memberof Modal
   */
  static showChangedGamePath() {
    Modal.View.sendModal(
      global.locale.MODAL_MODIFIED_PATH,
      global.locale.MODAL_MODIFIED_PATH_DESCR,
      global.locale.MODAL_OK2
    );
  }
  /**
   * Shows a FilePicker to install the game.
   *
   * @static
   * @param {any} ComponentName Visual Component name.
   * @returns
   * @memberof Modal
   */
  static showChooseDirectory( ComponentName, Window ) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise( async( resolve, _reject ) => {
      let defaultPath = null;
      if( process.platform === "win32" ){
        try {
          const winDefaultPath = await require( 'fs-extra' ).stat( 'C:\\Program Files' );
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

      const response = await require( 'electron' ).dialog.showOpenDialog(
        Window,
        {
          properties: ['openDirectory'],
          title: `${global.locale.MODAL_INSTALL} ${ComponentName}`,
          defaultPath: defaultPath,
          buttonLabel: global.locale.MODAL_INSTALL_FOLDER
        }
      );
        resolve( response.canceled ? [] : response.filePaths );
    } );
  }

  /**
   * When the user tries to do an action that requires
   * both FreeSO and TSO.
   *
   * @static
   * @memberof Modal
   */
  static showNeedFSOTSO() {
    Modal.View.sendModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_NEED_FSOTSO,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the user tried to play while updating.
   *
   * @static
   * @memberof Modal
   */
  static showFailPlay() {
    Modal.View.sendModal(
      global.locale.MODAL_NEGATIVE,
      global.locale.MODAL_LAUNCH_UPDATING,
      global.locale.MODAL_OK
    );
  }

  /**
   * When a user clicks play without installing
   * FSO or TSO.
   *
   * @static
   * @memberof Modal
   */
  static showNeedToPlay() {
    Modal.View.sendModal(
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
   * @static
   * @param {any} c Count of FreeSO processes that have been closed.
   * @memberof Modal
   */
  static showKilled( c ) {
    Modal.View.sendModalNoFocus(
      global.locale.MODAL_CLOSED_FREESO,
      global.locale.MODAL_CLOSED + ' ' + c + ' ' + global.locale.MODAL_CLOSED_2,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to change language settings for TSO.
   *
   * @static
   * @memberof Modal
   */
  static showTSOLangFail() {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_TSO_LANG_ERR,
      global.locale.MODAL_OK
    );
  }
  /**
   * When the launcher failed to change language settings for FSO.
   *
   * @static
   * @memberof Modal
   */
  static showFSOLangFail() {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_FSO_LANG_ERR,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the language change was successful.
   *
   * @static
   * @memberof Modal
   */
  static showCHLangComplete() {
    Modal.View.sendModal(
      global.locale.MODAL_SUCCESS,
      global.locale.MODAL_LANG_SUCCESS,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the TTS settings change was successful.
   *
   * @static
   * @param {any} value The new value.
   * @memberof Modal
   */
  static showCHTTSComplete( value ) {
    Modal.View.sendModal(
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
   *
   * @static
   * @memberof Modal
   */
  static showIniFail() {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_COMPLETE,
      global.locale.MODAL_INI_ERR,
      global.locale.MODAL_OK
    );
  }

  /**
   * When the user is required to launch the game
   * at least once to do an action.
   * This is because the launcher might need some files
   * that FreeSO doesn't generate until it's launched for the first time.
   *
   * @static
   * @memberof Modal
   */
  static showFirstRun() {
    Modal.View.sendModal(
      global.locale.MODAL_NOT_AVAILABLE,
      global.locale.MODAL_FIRSTTIME,
      global.locale.MODAL_OK2
    );
  }

  static showNoRemesh() {
    Modal.View.sendModal(
      global.locale.MODAL_RPU,
      global.locale.MODAL_RPU_DESCR,
      global.locale.MODAL_OK
    );
  }

  /**
   * Sends a notification.
   *
   * @static
   * @param {any} title Notification title.
   * @param {any} message Notification message.
   * @param {any} url Notification url.
   * @memberof Modal
   */
  static async sendNotification( title, message, url, ok = false ) {
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

      const shouldBeDark = require( 'electron' ).nativeTheme.shouldUseDarkColors

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
        Modal.View.sendSound( ok ? 'ok' : 'notification' );
        Modal.View.sendNotifLog( title, message, url );
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
   *
   * @static
   * @memberof Modal
   */
  static showAlreadyRunning() {
    Modal.View.sendModal(
      global.locale.MODAL_RUNNING,
      global.locale.MODAL_RUNNING_DESC,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the update check failed due to some
   * HTTP error.
   *
   * @static
   * @memberof Modal
   */
  static showFailedUpdateCheck() {
    Modal.View.sendModal(
      global.locale.MODAL_UPDATE_CHECK_FAILED,
      global.locale.MODAL_UPDATE_CHECK_FAILED_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * To confirm a launcher update installation.
   *
   * @static
   * @param {any} v
   * @memberof Modal
   */
  static showInstallUpdate( v ) {
    Modal.View.sendModal(
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
   *
   * @static
   * @memberof Modal
   */
  static showFailedUpdateDownload() {
    Modal.View.sendModal(
      global.locale.MODAL_UPDATE_FAILED,
      global.locale.MODAL_UPDATE_FAILED_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher failed to move the installer package.
   *
   * @static
   * @memberof Modal
   */
  static showFailedUpdateMove() {
    Modal.View.sendModal(
      global.locale.MODAL_UPDATE_FAILED,
      global.locale.MODAL_UPDATE_FAILED_MOVE_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher download completed.
   *
   * @static
   * @memberof Modal
   */
  static showUpdateComplete() {
    Modal.View.sendModal(
      global.locale.MODAL_UPDATE_COMPLETE,
      global.locale.MODAL_UPDATE_COMPLETE_DESCR,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the user right-clicks the play button to use Volcanic.
   *
   * @static
   * @memberof Modal
   */
  static showVolcanicPrompt() {
    Modal.View.sendModal(
      global.locale.MODAL_START_VOLCANIC,
      global.locale.MODAL_START_VOLCANIC_DESC,
      global.locale.MODAL_START_VOLCANIC_OK,
      global.locale.MODAL_CANCEL,
      'PLAY_VOLCANIC'
    );
  }
  static showVolcanicPromptSimitone() {
    Modal.View.sendModal(
      global.locale.MODAL_START_VOLCANIC,
      global.locale.MODAL_START_VOLCANIC_DESC,
      global.locale.MODAL_START_VOLCANIC_OK,
      global.locale.MODAL_CANCEL,
      'PLAY_VOLCANIC_SIMITONE'
    );
  }

  /**
   * When the launcher could not recover from not
   * having a FreeSO.exe to run due to some user-generated error.
   *
   * @static
   * @memberof Modal
   */
  static showCouldNotRecover( isSimitone = false ) {
    let str2 = global.locale.MODAL_FAILED_LAUNCH_DESC;
    if( isSimitone ) {
      str2 = str2
        .replace( 'FreeSO.exe', 'Simitone.Windows.exe' )
        .replace( 'FreeSO', 'Simitone' ); 
    }
    Modal.View.sendModal(
      global.locale.MODAL_FAILED_LAUNCH,
      str2,
      global.locale.MODAL_OK2
    );
  }

  /**
   * When the launcher could find the game's .exe.bak to recover.
   *
   * @static
   * @memberof Modal
   */
  static showRecovered() {
    Modal.View.sendModal(
      global.locale.MODAL_GAME_AUTORECOVERED,
      global.locale.MODAL_GAME_AUTORECOVERED_DESC,
      global.locale.MODAL_OK
    );
  }

  /**
   * Tells the user that Software Mode will be slower than the other options.
   *
   * @static
   * @memberof Modal
   */
  static showSoftwareModeEnabled() {
    Modal.View.sendModal(
      global.locale.MODAL_SWM,
      global.locale.MODAL_SWM_DESCR,
      global.locale.MODAL_OK
    );
  }

  /**
   * Language will be displayed on launcher restart.
   *
   * @static
   * @memberof Modal
   */
     static showLanguageOnRestart() {
      Modal.View.sendModal( 
        global.locale.MODAL_REQUIRES_RESTART, 
        global.locale.MODAL_REQUIRES_RESTART_DESC, 
        global.locale.MODAL_OK 
      );
    }

  /**
   * Used in generic error modal display.
   *
   * @static
   * @param {*} error Error text.
   * @memberof Modal
   */
  static showGenericError( error ) {
    Modal.View.sendModal( 'Ooops!', error, global.locale.MODAL_OK );
  }
}

module.exports = Modal;
