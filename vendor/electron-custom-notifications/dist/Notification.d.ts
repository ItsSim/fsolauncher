/// <reference types="node" />
import INotificationOptions from "./INotificationOptions";
import { EventEmitter } from "events";
/**
 * Represents a Notification.
 * Emits two events:
 *  - display: Fires when the notification is actually visible
 *  - close: Fires when the notification is closed
 *
 * @class Notification
 */
declare class Notification extends EventEmitter {
    /**
     * The notification´s unique ID.
     *
     * @type {string}
     * @memberof Notification
     */
    id: string;
    /**
     * Supplied notification options.
     *
     * @private
     * @type {INotificationOptions}
     * @memberof Notification
     */
    options: INotificationOptions;
    /**
     * Creates an instance of Notification.
     * @param {INotificationOptions} options
     * @memberof Notification
     */
    constructor(options: INotificationOptions);
    /**
     * Asks the NotificationManager to remove this notification.
     *
     * @memberof Notification
     */
    close(): void;
    /**
     * Returns the processed template source.
     *
     * @returns
     * @memberof Notification
     */
    getSource(): string;
}
export default Notification;
//# sourceMappingURL=Notification.d.ts.map