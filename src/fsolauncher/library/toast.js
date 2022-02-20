/**
 * Utility class to display little toasts in the bottom right corner of the launcher.
 */
class Toast {
  /**
   * @param {string} Message The message to display.
   * @param {import('./ipc-bridge')} IPC The IPCBridge instance.
   * @param {number} timeout Timeout in seconds.
   */
  constructor( message, IPC, timeout = 0 ) {
    this.id = Math.floor( Date.now() / 1000 );
    this.IPC = IPC;
    this.IPC.toast( this.id, message );
    if( timeout > 0 ) {
      setTimeout( () => this.destroy(), timeout );
    }
  }
  /**
   * Instructs the renderer to remove the toast by id.
   */
  destroy() {
    this.IPC.removeToast( this.id );
  }
}

module.exports = Toast;
