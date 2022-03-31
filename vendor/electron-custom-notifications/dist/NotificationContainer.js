"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = __importStar(require("path"));
/**
 * Container where Notifications are pushed into.
 *
 * @class NotificationContainer
 */
var NotificationContainer = /** @class */ (function () {
    /**
     * Creates an instance of NotificationContainer.
     * @memberof NotificationContainer
     */
    function NotificationContainer() {
        var _this = this;
        /**
         * Determines if the container window has been loaded.
         *
         * @type {boolean}
         * @memberof NotificationContainer
         */
        this.ready = false;
        /**
         * Collection of Notifications that are currently inside
         * the container.
         *
         * @private
         * @type {Notification[]}
         * @memberof NotificationContainer
         */
        this.notifications = [];
        /**
         * Displays the notification visually.
         *
         * @private
         * @param {Notification} notification
         * @memberof NotificationContainer
         */
        this.displayNotification = function (notification) {
            _this.window &&
                _this.window.webContents.send("notification-add", notification.getSource());
            notification.emit("display");
            if (notification.options.timeout) {
                setTimeout(function () {
                    notification.close();
                }, notification.options.timeout);
            }
        };
        var options = {};
        var display = require("electron").screen.getPrimaryDisplay();
        var displayWidth = display.workArea.x + display.workAreaSize.width;
        var displayHeight = display.workArea.y + display.workAreaSize.height;
        options.height = displayHeight;
        options.width = NotificationContainer.CONTAINER_WIDTH;
        options.alwaysOnTop = true;
        options.skipTaskbar = true;
        options.resizable = false;
        options.minimizable = false;
        options.fullscreenable = false;
        options.focusable = false;
        options.show = false;
        options.frame = false;
        options.transparent = true;
        options.x = displayWidth - NotificationContainer.CONTAINER_WIDTH;
        options.y = 0;
        options.webPreferences = {
            nodeIntegration: true,
            contextIsolation: false,
        }; // Since we're not displaying untrusted content 
        // (all links are opened in a real browser window), we can enable this.
        this.window = new electron_1.BrowserWindow(options);
        this.window.setVisibleOnAllWorkspaces(true);
        this.window.setAlwaysOnTop(true, "normal");
        this.window.loadURL(path.join("file://", __dirname, "/container.html"));
        this.window.setIgnoreMouseEvents(true, { forward: true });
        this.window.showInactive();
        // this.window.webContents.openDevTools({ mode: 'detach' });
        electron_1.ipcMain.on("notification-clicked", function (e, id) {
            var notification = _this.notifications.find(function (notification) { return notification.id == id; });
            if (notification) {
                notification.emit("click");
            }
        });
        electron_1.ipcMain.on("make-clickable", function (e) {
            _this.window && _this.window.setIgnoreMouseEvents(false);
        });
        electron_1.ipcMain.on("make-unclickable", function (e) {
            _this.window && _this.window.setIgnoreMouseEvents(true, { forward: true });
        });
        this.window.webContents.on("did-finish-load", function () {
            _this.ready = true;
            if (NotificationContainer.CUSTOM_STYLES) {
                _this.window &&
                    _this.window.webContents.send("custom-styles", NotificationContainer.CUSTOM_STYLES);
            }
            _this.notifications.forEach(_this.displayNotification);
        });
        this.window.on("closed", function () {
            _this.window = null;
        });
    }
    /**
     * Adds a notification logically (notifications[]) and
     * physically (DOM Element).
     *
     * @param {Notification} notification
     * @memberof NotificationContainer
     */
    NotificationContainer.prototype.addNotification = function (notification) {
        if (this.ready) {
            this.displayNotification(notification);
        }
        this.notifications.push(notification);
    };
    /**
     * Removes a notification logically (notifications[]) and
     * physically (DOM Element).
     *
     * @param {Notification} notification
     * @memberof NotificationContainer
     */
    NotificationContainer.prototype.removeNotification = function (notification) {
        this.notifications.splice(this.notifications.indexOf(notification), 1);
        this.window &&
            this.window.webContents.send("notification-remove", notification.id);
        notification.emit("close");
    };
    /**
     * Destroys the container.
     *
     * @memberof NotificationContainer
     */
    NotificationContainer.prototype.dispose = function () {
        this.window && this.window.close();
    };
    /**
     * The container's width.
     * @default 300
     *
     * @static
     * @memberof NotificationContainer
     */
    NotificationContainer.CONTAINER_WIDTH = 300;
    return NotificationContainer;
}());
exports.default = NotificationContainer;
//# sourceMappingURL=NotificationContainer.js.map