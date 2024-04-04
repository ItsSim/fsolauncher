/* eslint-disable no-empty */
const { normalizePathSlashes } = require( './utils' );

/**
 * IPCBridge used to control events sent to the renderer process.
 */
class IPCBridge {
  /**
   * @param {Electron.BrowserWindow} window The window to send messages to.
   */
  constructor( window ) {
    this.window = window;
  }

  /**
   * Informs the renderer process that there is not internet connection.
   */
  hasNoInternet() {
    try {
      this.window.webContents.send( 'NO_INTERNET' );
    } catch ( err ) {}
  }

  /**
   * Informs the renderer process that internet connection was restored.
   */
  hasInternet() {
    try {
      this.window.webContents.send( 'HAS_INTERNET' );
    } catch ( err ) {}
  }

  /**
   * Tells the renderer process to change the active theme.
   *
   * @param {string} Theme The name of the theme to change to.
   */
  setTheme( Theme ) {
    this.window.webContents.send( 'SET_THEME', Theme );
  }

  /**
   * Tells the renderer process to repopulate the setting controls in
   * the settings tab.
   *
   * @param {Object} Configuration The configuration object to set as
   *                               values in the settings page.
   */
  restoreConfiguration( Configuration ) {
    this.window.webContents.send( 'RESTORE_CONFIGURATION', Configuration );
  }

  /**
   * Tells the renderer process to go to another tab.
   *
   * @param {string} page
   */
  changePage( page ) {
    this.window.webContents.send( 'CHANGE_PAGE', page );
  }

  /**
   * Tells the renderer process to show a modal window.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   * @param {string} type        The type of modal to show.
   */
  sendModal( title, text, yesText, noText, modalRespId, extra, type ) {
    this.window.show();
    this.window.restore();
    this.window.focus();
    this.window.webContents.send(
      'POPUP',
      title,
      text,
      yesText,
      noText,
      modalRespId,
      extra,
      type
    );
  }

  /**
   * Asks the renderer process to show a Modal window without forcing
   * window focus.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   * @param {string} type        The type of modal to show.
   */
  sendModalNoFocus( title, text, yesText, noText, modalRespId, extra, type ) {
    this.window.webContents.send(
      'POPUP',
      title,
      text,
      yesText,
      noText,
      modalRespId,
      extra,
      type
    );
  }

  /**
   * Tells the renderer process to show a success modal window.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   */
  sendSuccessModal( title, text, yesText, noText, modalRespId, extra ) {
    this.sendModal( title, text, yesText, noText, modalRespId, extra, 'success' );
  }

  /**
   * Tells the renderer process to show a success modal window without forcing
   * window focus.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   */
  sendSuccessModalNoFocus( title, text, yesText, noText, modalRespId, extra ) {
    this.sendModalNoFocus( title, text, yesText, noText, modalRespId, extra, 'success' );
  }

  /**
   * Tells the renderer process to show an error modal window.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   */
  sendErrorModal( title, text, yesText, noText, modalRespId, extra ) {
    this.sendModal( title, text, yesText, noText, modalRespId, extra, 'error' );
  }

  /**
   * Tells the renderer process to show an error modal window without forcing
   * window focus.
   *
   * @param {string} title       The Modal window title.
   * @param {string} text        The main Modal text.
   * @param {string} yesText     The text for an affirmative button.
   * @param {string} noText      The text for a negative response button.
   * @param {string} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {string} extra       Extra parameters.
   */
  sendErrorModalNoFocus( title, text, yesText, noText, modalRespId, extra ) {
    this.sendModalNoFocus( title, text, yesText, noText, modalRespId, extra, 'error' );
  }

  /**
   * Adds a new progress item in the Downloads tab.
   *
   * @param {string} elId        Unique element ID.
   * @param {string} filename    Text to appear as the filename.
   * @param {string} origin      Text to appear as the file origin.
   * @param {string} progress    Progress text.
   * @param {number} percentage  Current progress percentage.
   * @param {string} miniconsole Deprecated, leave as null.
   */
  addProgressItem( elId, filename, origin, progress, percentage, miniconsole ) {
    filename = normalizePathSlashes( filename );
    origin = normalizePathSlashes( origin );
    try {
      this.window.webContents.send(
        'CREATE_PROGRESS_ITEM',
        elId,
        filename,
        origin,
        progress,
        percentage,
        miniconsole
      );
    } catch ( err ) {}
  }

  /**
   * Stop progress animation.
   *
   * @param {string} elId Unique element ID.
   */
  stopProgressItem( elId ) {
    try {
      this.window.webContents.send( 'STOP_PROGRESS_ITEM', elId );
    } catch ( err ) {}
  }

  /**
   * Asks the renderer process to show the Full Install progress Window.
   *
   * @param {string} title Main progress title.
   * @param {string} text1 Text to accompany the title.
   * @param {string} text2 More text.
   * @param {number} progress Progress percentage.
   */
  fullInstallProgressItem( title, text1, text2, progress ) {
    try {
      this.window.webContents.send(
        'FULL_INSTALL_PROGRESS_ITEM',
        title,
        text1,
        text2,
        progress
      );
    } catch ( err ) {}
  }

  /**
   * Asks the renderer process to visually show a toast.
   *
   * @param {string} id   Unique element ID.
   * @param {string} text Text to appear in the toast.
   */
  toast( id, text ) {
    try {
      this.window.webContents.send( 'TOAST', id, text );
    } catch ( err ) {}
  }

  /**
   * Tells the renderer process to remove a toast by ID.
   *
   * @param {string} id Unique element ID.
   */
  removeToast( id ) {
    try {
      this.window.webContents.send( 'REMOVE_TOAST', id );
    } catch ( err ) {}
  }

  /**
   * Sets the obtained remesh info for the renderer process.
   *
   * @param {string} v Version of the remesh package.
   */
  setRemeshInfo( v ) {
    try {
      this.window.webContents.send( 'REMESH_INFO', v );
    } catch ( err ) {}
  }

  /**
   * Updates the current installation tip.
   *
   * @param {string} text The text to display.
   */
  setTip( text ) {
    try {
      this.window.webContents.send( 'SET_TIP', text );
    } catch ( err ) {}
  }

  /**
   * Plays a sound file on the renderer process.
   *
   * @param {string} sound The sound file to play.
   */
  sendSound( sound ) {
    try {
      this.window.webContents.send( 'PLAY_SOUND', sound );
    } catch ( err ) {}
  }

  /**
   * Adds a notification item to the notification log tab.
   *
   * @param {string} title The title of the notification.
   * @param {string} body  The log text of the notification.
   * @param {string} url   The optional URL to open when the notification button is clicked.
   */
  sendNotifLog( title, body, url ) {
    try {
      this.window.webContents.send( 'NOTIFLOG', title, body, url );
    } catch ( err ) {}
  }

  /**
   * Sends a list of installed programs. This is used to display which programs are
   * installed in the installer screen.
   *
   * @param {string} list The list of installed programs.
   */
  sendInstalledPrograms( list ) {
    try {
      this.window.webContents.send( 'INSPROG', list );
    } catch ( err ) {}
  }

  /**
   * Makes the renderer process show that a Simitone update is available.
   *
   * @param {string} v The version of the update.
   */
  sendSimitoneShouldUpdate( v ) {
    try {
      this.window.webContents.send( 'SIMITONE_SHOULD_UPDATE', v );
    } catch ( err ) {}
  }

  /**
   * Sets the Simitone Version for the UI.
   *
   * @param {string} v Simitone version
   */
  setSimitoneVersion( v ) {
    try {
      this.window.webContents.send( 'SIMITONE_SET_VER', v );
    } catch ( err ) {}
  }

  /**
   * @param {string} folder
   */
  ociPickedFolder( folder ) {
    try {
      this.window.webContents.send( 'OCI_PICKED_FOLDER', normalizePathSlashes( folder ) );
    } catch ( err ) {}
  }

  /**
   * @param {string} rate
   */
  setMaxRefreshRate( rate ) {
    try {
      this.window.webContents.send( 'MAX_REFRESH_RATE', rate );
    } catch ( err ) {}
  }
}

module.exports = IPCBridge;
