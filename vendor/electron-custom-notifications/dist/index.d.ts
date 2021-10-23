import Notification from "./Notification";
import INotificationOptions from "./INotificationOptions";
/**
 * Spawns a new notification.
 * Warning: You MUST use this library from another
 * Electron application (after the 'ready' event).
 * If you try to use this from a regular Node app, it
 * will not work.
 *
 * @param {*} [options]
 */
declare function createNotification(options: INotificationOptions): Notification;
/**
 * Adds custom CSS to the notification container head.
 *
 * @param {string} css
 */
declare function setGlobalStyles(css: string): void;
/**
 * Changes the container's width.
 * @default 300
 *
 * @param {number} width
 */
declare function setContainerWidth(width: number): void;
export { createNotification, setContainerWidth, setGlobalStyles };
//# sourceMappingURL=index.d.ts.map