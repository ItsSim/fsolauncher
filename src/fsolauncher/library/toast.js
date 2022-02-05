// eslint-disable-next-line no-unused-vars
const IPCBridge = require( "./ipc-bridge" );

/**
 * Utility class to display little toasts in the bottom right corner of the launcher.
 */
class Toast {
  /**
   * @param {string} Message The message to display.
   * @param {IPCBridge} View The IPCBridge instance.
   * @param {number} timeout Timeout in seconds.
   */
  constructor( message, View, timeout = 0 ) {
    this.id = Math.floor( Date.now() / 1000 );
    this.View = View;
    this.show( message );
    if( timeout > 0 ) {
      setTimeout( () => this.destroy(), timeout );
    }
  }
  /**
   * Instructs the renderer to display the toast.
   *
   * @param {string} message The message to display.
   */
  show( message ) {
    this.View.toast( this.id, message );
  }
  /**
   * Instructs the renderer to remove the toast by id.
   */
  destroy() {
    this.View.removeToast( this.id );
  }
}

module.exports = Toast;
