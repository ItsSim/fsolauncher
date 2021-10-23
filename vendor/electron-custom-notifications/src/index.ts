import Notification from "./Notification";
import NotificationManager from "./NotificationManager";
import INotificationOptions from "./INotificationOptions";
import NotificationContainer from "./NotificationContainer";
/**
 * Spawns a new notification.
 * Warning: You MUST use this library from another
 * Electron application (after the 'ready' event).
 * If you try to use this from a regular Node app, it
 * will not work.
 *
 * @param {*} [options]
 */
function createNotification(options: INotificationOptions): Notification {
  return NotificationManager.createNotification(options);
}
/**
 * Adds custom CSS to the notification container head.
 *
 * @param {string} css
 */
function setGlobalStyles(css: string) {
  NotificationContainer.CUSTOM_STYLES = css;
}
/**
 * Changes the container's width.
 * @default 300
 *
 * @param {number} width
 */
function setContainerWidth(width: number) {
  NotificationContainer.CONTAINER_WIDTH = width;
}

export {
  createNotification,
  setContainerWidth,
  setGlobalStyles
};
