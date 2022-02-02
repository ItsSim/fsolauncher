/**
 * Wrapper for renderer events.
 */
class RendererEvent {
  /**
   * Creates an instance of Event.
   * 
   * @param {string} eventName
   */
  constructor( eventName ) {
    this.eventName = eventName;
  }
  /**
   * Establishes the callback for the event.
   *
   * @param {Function} callback The callback to fire.
   */
  onFire( callback ) {
    require( 'electron' ).ipcMain.on( this.eventName, callback );
  }
}

module.exports = RendererEvent;
