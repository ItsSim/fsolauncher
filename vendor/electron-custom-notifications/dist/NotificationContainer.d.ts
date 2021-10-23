import Notification from "./Notification";
/**
 * Container where Notifications are pushed into.
 *
 * @class NotificationContainer
 */
declare class NotificationContainer {
    /**
     * The container's width.
     * @default 300
     *
     * @static
     * @memberof NotificationContainer
     */
    static CONTAINER_WIDTH: number;
    /**
     * Custom CSS styles to add to the container HTML.
     *
     * @static
     * @type {string}
     * @memberof NotificationContainer
     */
    static CUSTOM_STYLES: string;
    /**
     * Determines if the container window has been loaded.
     *
     * @type {boolean}
     * @memberof NotificationContainer
     */
    ready: boolean;
    /**
     * Collection of Notifications that are currently inside
     * the container.
     *
     * @private
     * @type {Notification[]}
     * @memberof NotificationContainer
     */
    notifications: Notification[];
    /**
     * The Electron BrowserWindow for this container.
     *
     * @private
     * @type {BrowserWindow}
     * @memberof NotificationContainer
     */
    private window;
    /**
     * Creates an instance of NotificationContainer.
     * @memberof NotificationContainer
     */
    constructor();
    /**
     * Adds a notification logically (notifications[]) and
     * physically (DOM Element).
     *
     * @param {Notification} notification
     * @memberof NotificationContainer
     */
    addNotification(notification: Notification): void;
    /**
     * Displays the notification visually.
     *
     * @private
     * @param {Notification} notification
     * @memberof NotificationContainer
     */
    private displayNotification;
    /**
     * Removes a notification logically (notifications[]) and
     * physically (DOM Element).
     *
     * @param {Notification} notification
     * @memberof NotificationContainer
     */
    removeNotification(notification: Notification): void;
    /**
     * Destroys the container.
     *
     * @memberof NotificationContainer
     */
    dispose(): void;
}
export default NotificationContainer;
//# sourceMappingURL=NotificationContainer.d.ts.map