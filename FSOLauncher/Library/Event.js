/**
 * Electron Client event handler.
 *
 * @class Event
 */
class Event {
  /**
   * Creates an instance of Event.
   * @param {any} eventName
   * @memberof Event
   */
  constructor(eventName) {
    this.eventName = eventName;
  }

  /**
   * Establishes the callback for the event.
   *
   * @param {any} callback
   * @memberof Event
   */
  onFire(callback) {
    require('electron').ipcMain.on(this.eventName, callback);
  }
}

module.exports = Event;
