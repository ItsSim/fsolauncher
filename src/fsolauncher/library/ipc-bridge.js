/* eslint-disable no-empty */
/**
 * IPCBridge used to control events sent to the renderer process.
 *
 * @class IPCBridge
 */
class IPCBridge {
  /**
   * Creates an instance of IPCBridge.
   * @param {any} Window
   * @memberof IPCBridge
   */
  constructor( Window ) { this.Window = Window; }
  /**
   * Loads the FreeSO blog RSS for the main page.
   *
   * @memberof IPCBridge
   */
  loadRss() {
    this.Window.webContents.send( 'LOAD_RSS' );
  }
  /**
   * Informs the renderer process that there is not internet connection.
   *
   * @memberof IPCBridge
   */
  hasNoInternet() {
    this.Window.webContents.send( 'NO_INTERNET' );
  }
  /**
   * Informs the renderer process that internet connection was restored.
   *
   * @memberof IPCBridge
   */
  hasInternet() {
    this.Window.webContents.send( 'HAS_INTERNET' );
  }

  /**
   * Tells the renderer process to change the active theme.
   *
   * @param {any} Theme
   * @memberof IPCBridge
   */
  setTheme( Theme ) {
    this.Window.webContents.send( 'SET_THEME', Theme );
  }

  /**
   * Tells the renderer process to repopulate the setting controls in
   * the settings tab.
   *
   * @param {any} Configuration
   * @memberof IPCBridge
   */
  restoreConfiguration( Configuration ) {
    this.Window.webContents.send( 'RESTORE_CONFIGURATION', Configuration );
  }
  /**
   * Tells the renderer process to go to another tab.
   *
   * @param {any} page
   * @memberof IPCBridge
   */
  changePage( page ) {
    this.Window.webContents.send( 'CHANGE_PAGE', page );
  }
  /**
   * Tells the renderer process to show a modal window.
   *
   * @param {any} title The Modal window title.
   * @param {any} text  The main Modal text.
   * @param {any} yesText The text for an affirmative button.
   * @param {any} noText The text for a negative response button.
   * @param {any} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {any} extra Extra parameters.
   * @memberof IPCBridge
   */
  sendModal( title, text, yesText, noText, modalRespId, extra ) {
    this.Window.focus();
    this.Window.webContents.send(
      'POPUP',
      title,
      text,
      yesText,
      noText,
      modalRespId,
      extra
    );
  }
  /**
   * Asks the renderer process to show a Modal window without focusing and getting the users attention.
   *
   * @param {any} title
   * @param {any} text
   * @param {any} yesText
   * @param {any} noText
   * @param {any} modalRespId
   * @param {any} extra
   * @memberof IPCBridge
   */
  sendModalNoFocus( title, text, yesText, noText, modalRespId, extra ) {
    this.Window.webContents.send(
      'POPUP',
      title,
      text,
      yesText,
      noText,
      modalRespId,
      extra
    );
  }
  /**
   * Adds a new progress item in the Downloads tab.
   *
   * @param {any} elId Unique element ID.
   * @param {any} filename Text to appear as the filename.
   * @param {any} origin Text to appear as the file origin.
   * @param {any} progress Progress text.
   * @param {any} percentage Current progress percentage.
   * @param {any} miniconsole Deprecated, leave as null.
   * @memberof IPCBridge
   */
  addProgressItem( elId, filename, origin, progress, percentage, miniconsole ) {
    try {
      this.Window.webContents.send(
        'CREATE_PROGRESS_ITEM',
        elId,
        global.normalizePathSlashes( filename ),
        global.normalizePathSlashes( origin ),
        progress,
        percentage,
        miniconsole
      );
    } catch ( e ) {}
  }
  /**
   * Stop progress animation.
   * @param {*} elId
   */
  stopProgressItem( elId ) {
    try {
      this.Window.webContents.send( 'STOP_PROGRESS_ITEM', elId );
    } catch ( e ) {}
  }
  /**
   * Asks the renderer process to show the Full Install progress Window.
   *
   * @param {any} title Main progress title.
   * @param {any} text1 Text to accompany the title.
   * @param {any} text2 More text.
   * @param {any} progress Progress percentage.
   * @memberof IPCBridge
   */
  fullInstallProgressItem( title, text1, text2, progress ) {
    try {
      this.Window.webContents.send(
        'FULL_INSTALL_PROGRESS_ITEM',
        title,
        text1,
        text2,
        progress
      );
    } catch ( e ) {}
  }
  /**
   * Asks the renderer process to visually show a toast.
   *
   * @param {any} id Unique element ID.
   * @param {any} text
   * @memberof IPCBridge
   */
  toast( id, text ) {
    try {
      this.Window.webContents.send( 'TOAST', id, text );
    } catch ( e ) {}
  }
  /**
   * Tells the renderer process to remove a toast by ID.
   *
   * @param {any} id
   * @memberof IPCBridge
   */
  removeToast( id ) {
    try {
      this.Window.webContents.send( 'REMOVE_TOAST', id );
    } catch ( e ) {}
  }
  /**
   * Sets the obtained remesh info for the renderer process.
   *
   * @param {*} v
   * @memberof IPCBridge
   */
  setRemeshInfo( v ) {
    try {
      this.Window.webContents.send( 'REMESH_INFO', v );
    } catch ( e ) {}
  }
  /**
   * Updates the current installation tip.
   *
   * @param {any} text
   * @memberof IPCBridge
   */
  setTip( text ) {
    try {
      this.Window.webContents.send( 'SET_TIP', text );
    } catch ( e ) {}
  }
  /**
   * Plays a sound file on the renderer process.
   *
   * @param {*} sound
   * @memberof IPCBridge
   */
  sendSound( sound ) {
    try {
      this.Window.webContents.send( 'PLAY_SOUND', sound );
    } catch ( e ) {}
  }
  /**
   * Displays a notification in the renderer.
   *
   * @param {*} t
   * @param {*} l
   * @param {*} c
   * @memberof IPCBridge
   */
  sendNotifLog( t, l, c ) {
    try {
      this.Window.webContents.send( 'NOTIFLOG', t, l, c );
    } catch ( e ) {}
  }
  /**
   * Sends a list of installed programs. This is used to display
   * which programs are installed in the installer screen.
   *
   * @param {*} i
   * @memberof IPCBridge
   */
  sendInstalledPrograms( i ) {
    try {
      this.Window.webContents.send( 'INSPROG', i );
    } catch ( e ) {}
  }
  /**
   * Makes the renderer process show that a Simitone update is available.
   *
   * @param {*} v
   * @memberof IPCBridge
   */
  sendSimitoneShouldUpdate( v ) {
    try {
      this.Window.webContents.send( 'SIMITONE_SHOULD_UPDATE', v );
    } catch ( e ) {}    
  }
  /**
   * Response of a FSODetector run.
   *
   * @param {*} dir
   * @memberof IPCBridge
   */
  sendDetectorResponse( dir ) {
    try {
      this.Window.webContents.send( 'FSODETECTOR_RESPONSE', dir );
    } catch ( e ) {}   
  }
  /**
   * Useful for debugging with a production build.
   * @param {*} str 
   */
  sendConsoleLog( str ) {
    try {
      this.Window.webContents.send( 'CONSOLE_LOG', str );
    } catch ( e ) {}
  }
}

module.exports = IPCBridge;
