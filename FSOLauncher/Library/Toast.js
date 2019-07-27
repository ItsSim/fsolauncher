/**
 * Utility class to display little toasts in the bottom right corner of the launcher.
 *
 * @class Toast
 */
class Toast {
  /**
   * Creates an instance of Toast.
   * @param {any} Message The message to show.
   * @param {any} View The Electron Window view.
   * @memberof Toast
   */
  constructor(Message, View) {
    this.id = Math.floor(Date.now() / 1000);
    this.View = View;
    this.show(Message);
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
