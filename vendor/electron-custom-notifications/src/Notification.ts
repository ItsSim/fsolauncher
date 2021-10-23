import NotificationManager from "./NotificationManager";
import INotificationOptions from "./INotificationOptions";

import uuid from "uuid/v4";

import { EventEmitter } from "events";

/**
 * Represents a Notification.
 * Emits two events:
 *  - display: Fires when the notification is actually visible
 *  - close: Fires when the notification is closed
 *
 * @class Notification
 */
class Notification extends EventEmitter {
  /**
   * The notification´s unique ID.
   *
   * @type {string}
   * @memberof Notification
   */
  public id: string;
  /**
   * Supplied notification options.
   *
   * @private
   * @type {INotificationOptions}
   * @memberof Notification
   */
  public options: INotificationOptions;

  /**
   * Creates an instance of Notification.
   * @param {INotificationOptions} options
   * @memberof Notification
   */
  constructor(options: INotificationOptions) {
    super();
    this.id = uuid();
    this.options = options;
  }
  /**
   * Asks the NotificationManager to remove this notification.
   *
   * @memberof Notification
   */
  public close() {
    NotificationManager.destroyNotification(this);
  }
  /**
   * Returns the processed template source.
   *
   * @returns
   * @memberof Notification
   */
  public getSource(): string {
    if(!this.options.content) return '';
    const firstClosingTagIndex = this.options.content?.indexOf('>');
    const idAttribute = ` data-notification-id="${this.id}"`;
    const output = [
      this.options.content.slice(0, firstClosingTagIndex), 
      idAttribute, 
      this.options.content.slice(firstClosingTagIndex)
    ];
    return output.join('');
  }
}

export default Notification;
