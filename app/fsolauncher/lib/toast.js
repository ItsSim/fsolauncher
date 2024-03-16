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
   * @param {number} timeout Timeout in seconds.
   */
  constructor( message, timeout = 0 ) {
    this.id = this.hashDjb2( message );
    Toast.getIPC().toast( this.id, message );
    if ( timeout > 0 ) {
      setTimeout( () => this.destroy(), timeout );
    }
  }

  /**
   * Instructs the renderer to remove the toast by id.
   */
  destroy() {
    Toast.getIPC().removeToast( this.id );
  }

  hashDjb2( str ) {
    let hash = 5381;
    for ( let i = 0; i < str.length; i++ ) {
      const char = str.charCodeAt( i );
      hash = ( ( hash << 5 ) + hash ) + char; /* hash * 33 + c */
    }
    return 'toast-' + hash;
  }
}

module.exports = Toast;
