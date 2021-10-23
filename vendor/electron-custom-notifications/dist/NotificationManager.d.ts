import INotificationOptions from "./INotificationOptions";
import Notification from "./Notification";
/**
 * Handles the creation of NotificationContainer and
 * Notifications that get pushed into them.
 *
 * @todo Change to Singleton
 *
 * @class NotificationManager
 */
declare class NotificationManager {
    /**
     * The active NotificationContainer.
     *
     * @private
     * @static
     * @type {NotificationContainer}
     * @memberof NotificationManager
     */
    private static container;
    /**
     * Prepares a NotificationContainer.
     *
     * @private
     * @static
     * @memberof NotificationManager
     */
    private static getContainer;
    /**
     * Destroys a notification (and container if there are none left).
     *
     * @static
     * @param {Notification} notification
     * @memberof NotificationManager
     */
    static destroyNotification(notification: Notification): void;
    /**
     * Creates a new Notification and pushes it to the
     * NotificationContainer.
     *
     * @static
     * @param {INotificationOptions} options
     * @memberof NotificationManager
     */
    static createNotification(options: INotificationOptions): Notification;
}
export default NotificationManager;
//# sourceMappingURL=NotificationManager.d.ts.map