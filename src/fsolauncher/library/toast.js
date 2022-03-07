/**
 * Utility class to display little toasts in the bottom right corner of the launcher.
 */
class Toast {
  /**
   * Returns the Modal IPC object.
   * 
   * @returns {import('./ipc-bridge')} The IPC object.
   */
  static getIPC() { return Toast.IPC; }
  /**
   * @param {string} message The message to display.
   * @param {import('./ipc-bridge')} IPC The IPCBridge instance.
   * @param {number} timeout Timeout in seconds.
   */
  constructor( message, timeout = 0 ) {
    this.id = Math.floor( Date.now() / 1000 );
    Toast.getIPC().toast( this.id, message );
    if( timeout > 0 ) {
      setTimeout( () => this.destroy(), timeout );
    }
  }
  /**
   * Instructs the renderer to remove the toast by id.
   */
  destroy() {
    Toast.getIPC().removeToast( this.id );
  }
}

module.exports = Toast;
