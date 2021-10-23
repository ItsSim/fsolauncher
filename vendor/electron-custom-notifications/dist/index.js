"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalStyles = exports.setContainerWidth = exports.createNotification = void 0;
var NotificationManager_1 = __importDefault(require("./NotificationManager"));
var NotificationContainer_1 = __importDefault(require("./NotificationContainer"));
/**
 * Spawns a new notification.
 * Warning: You MUST use this library from another
 * Electron application (after the 'ready' event).
 * If you try to use this from a regular Node app, it
 * will not work.
 *
 * @param {*} [options]
 */
function createNotification(options) {
    return NotificationManager_1.default.createNotification(options);
}
exports.createNotification = createNotification;
/**
 * Adds custom CSS to the notification container head.
 *
 * @param {string} css
 */
function setGlobalStyles(css) {
    NotificationContainer_1.default.CUSTOM_STYLES = css;
}
exports.setGlobalStyles = setGlobalStyles;
/**
 * Changes the container's width.
 * @default 300
 *
 * @param {number} width
 */
function setContainerWidth(width) {
    NotificationContainer_1.default.CONTAINER_WIDTH = width;
}
exports.setContainerWidth = setContainerWidth;
//# sourceMappingURL=index.js.map