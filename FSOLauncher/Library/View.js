/* eslint-disable no-empty */
/**
 * Handles all the server => client communication.
 *
 * @class View
 */
class View {
  /**
   * Creates an instance of View.
   * @param {any} Window
   * @memberof View
   */
  constructor(Window) {
    this.Window = Window;
  }

  /**
   * Loads the FreeSO blog RSS for the main page.
   *
   * @memberof View
   */
  loadRss() {
    this.Window.webContents.send('LOAD_RSS');
  }

  /**
   * Informs the View that there is not internet connection.
   *
   * @memberof View
   */
  hasNoInternet() {
    this.Window.webContents.send('NO_INTERNET');
  }

  /**
   * Informs the View that internet connection was restored.
   *
   * @memberof View
   */
  hasInternet() {
    this.Window.webContents.send('HAS_INTERNET');
  }

  /**
   * Tells the View to change the active theme.
   *
   * @param {any} Theme
   * @memberof View
   */
  setTheme(Theme) {
    this.Window.webContents.send('SET_THEME', Theme);
  }

  /**
   * Tells the View to repopulate the setting controls in
   * the settings tab.
   *
   * @param {any} Configuration
   * @memberof View
   */
  restoreConfiguration(Configuration) {
    this.Window.webContents.send('RESTORE_CONFIGURATION', Configuration);
  }

  /**
   * Tells the View to go to another tab.
   *
   * @param {any} page
   * @memberof View
   */
  changePage(page) {
    this.Window.webContents.send('CHANGE_PAGE', page);
  }

  /**
   * Tells the View to show a modal window.
   *
   * @param {any} title The Modal window title.
   * @param {any} text  The main Modal text.
   * @param {any} yesText The text for an affirmative button.
   * @param {any} noText The text for a negative response button.
   * @param {any} modalRespId Unique Modal response ID if you want to receive the response in code.
   * @param {any} extra Extra parameters.
   * @memberof View
   */
  sendModal(title, text, yesText, noText, modalRespId, extra) {
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
   * Asks the View to show a Modal window without focusing and getting the users attention.
   *
   * @param {any} title
   * @param {any} text
   * @param {any} yesText
   * @param {any} noText
   * @param {any} modalRespId
   * @param {any} extra
   * @memberof View
   */
  sendModalNoFocus(title, text, yesText, noText, modalRespId, extra) {
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
   * @memberof View
   */
  addProgressItem(elId, filename, origin, progress, percentage, miniconsole) {
    try {
      this.Window.webContents.send(
        'CREATE_PROGRESS_ITEM',
        elId,
        filename,
        origin,
        progress,
        percentage,
        miniconsole
      );
    } catch (e) {}
  }
  /**
   * Stop progress animation.
   * @param {*} elId
   */
  stopProgressItem(elId) {
    try {
      this.Window.webContents.send('STOP_PROGRESS_ITEM', elId);
    } catch (e) {}
  }
  /**
   * Asks the View to show the Full Install progress Window.
   *
   * @param {any} title Main progress title.
   * @param {any} text1 Text to accompany the title.
   * @param {any} text2 More text.
   * @param {any} progress Progress percentage.
   * @memberof View
   */
  fullInstallProgressItem(title, text1, text2, progress) {
    try {
      this.Window.webContents.send(
        'FULL_INSTALL_PROGRESS_ITEM',
        title,
        text1,
        text2,
        progress
      );
    } catch (e) {}
  }

  /**
   * Asks the View to visually show a toast.
   *
   * @param {any} id Unique element ID.
   * @param {any} text
   * @memberof View
   */
  toast(id, text) {
    try {
      this.Window.webContents.send('TOAST', id, text);
    } catch (e) {}
  }

  /**
   * Tells the View to remove a toast by ID.
   *
   * @param {any} id
   * @memberof View
   */
  removeToast(id) {
    try {
      this.Window.webContents.send('REMOVE_TOAST', id);
    } catch (e) {}
  }

  setRemeshInfo(v) {
    try {
      this.Window.webContents.send('REMESH_INFO', v);
    } catch (e) {}
  }

  /**
   * Sets the current installation tip.
   *
   * @param {any} text
   * @memberof View
   */
  setTip(text) {
    try {
      this.Window.webContents.send('SET_TIP', text);
    } catch (e) {}
  }

  sendSound(sound) {
    try {
      this.Window.webContents.send('PLAY_SOUND', sound);
    } catch (e) {}
  }

  sendNotifLog(t, l, c) {
    try {
      this.Window.webContents.send('NOTIFLOG', t, l, c);
    } catch (e) {}
  }

  sendInstalledPrograms(i) {
    try {
      this.Window.webContents.send('INSPROG', i);
    } catch (e) {}
  }

  sendSimitoneShouldUpdate(v) {
    try {
      this.Window.webContents.send('SIMITONE_SHOULD_UPDATE', v);
    } catch (e) {}    
  }
}

module.exports = View;
