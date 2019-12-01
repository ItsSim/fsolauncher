/**
 * Utility class to display little toasts in the bottom right corner of the launcher.
 *
 * @class Toast
 */
class Toast {
  /**
   * Creates an instance of Toast.
   * @param {*} Message
   * @param {*} View
   * @param {number} [timeout=0]
   * @memberof Toast
   */
  constructor(Message, View, timeout = 0) {
    this.id = Math.floor(Date.now() / 1000);
    this.View = View;
    this.show(Message);
    if(timeout > 0) {
      setTimeout(() => { this.destroy(); }, timeout);
    }
  }
  /**
   * Shows the toast.
   *
   * @param {any} Message
   * @memberof Toast
   */
  show(Message) {
    this.View.toast(this.id, Message);
  }
  /**
   * Destroys the toast and removes it from the view.
   *
   * @memberof Toast
   */
  destroy() {
    this.View.removeToast(this.id);
  }
}

module.exports = Toast;
