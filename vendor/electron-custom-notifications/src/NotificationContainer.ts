import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
} from "electron";
import * as path from "path";
import Notification from "./Notification";

/**
 * Container where Notifications are pushed into.
 *
 * @class NotificationContainer
 */
class NotificationContainer {
  /**
   * The container's width.
   * @default 300
   *
   * @static
   * @memberof NotificationContainer
   */
  public static CONTAINER_WIDTH: number = 300;
  /**
   * Custom CSS styles to add to the container HTML.
   *
   * @static
   * @type {string}
   * @memberof NotificationContainer
   */
  public static CUSTOM_STYLES: string;
  /**
   * Determines if the container window has been loaded.
   *
   * @type {boolean}
   * @memberof NotificationContainer
   */
  public ready: boolean = false;
  /**
   * Collection of Notifications that are currently inside
   * the container.
   *
   * @private
   * @type {Notification[]}
   * @memberof NotificationContainer
   */
  public notifications: Notification[] = [];
  /**
   * The Electron BrowserWindow for this container.
   *
   * @private
   * @type {BrowserWindow}
   * @memberof NotificationContainer
   */
  private window: BrowserWindow | null;
  /**
   * Creates an instance of NotificationContainer.
   * @memberof NotificationContainer
   */
  constructor() {
    let options: BrowserWindowConstructorOptions = {};

    const display = require("electron").screen.getPrimaryDisplay();
    const displayWidth = display.workArea.x + display.workAreaSize.width;
    const displayHeight = display.workArea.y + display.workAreaSize.height;

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

    this.window = new BrowserWindow(options);
    this.window.setVisibleOnAllWorkspaces(true);
    this.window.loadURL(path.join("file://", __dirname, "/container.html"));
    this.window.setIgnoreMouseEvents(true, { forward: true });
    this.window.showInactive();
    // this.window.webContents.openDevTools({ mode: 'detach' });

    ipcMain.on("notification-clicked", (e: any, id: string) => {
      const notification = this.notifications.find(
        notification => notification.id == id
      );

      if (notification) {
        notification.emit("click");
      }
    });

    ipcMain.on("make-clickable", (e: any) => {
      this.window && this.window.setIgnoreMouseEvents(false);
    });

    ipcMain.on("make-unclickable", (e: any) => {
      this.window && this.window.setIgnoreMouseEvents(true, { forward: true });
    });

    this.window.webContents.on("did-finish-load", () => {
      this.ready = true;
      if (NotificationContainer.CUSTOM_STYLES) {
        this.window &&
          this.window.webContents.send(
            "custom-styles",
            NotificationContainer.CUSTOM_STYLES
          );
      }
      this.notifications.forEach(this.displayNotification);
    });

    this.window.on("closed", () => {
      this.window = null;
    });
  }

  /**
   * Adds a notification logically (notifications[]) and
   * physically (DOM Element).
   *
   * @param {Notification} notification
   * @memberof NotificationContainer
   */
  public addNotification(notification: Notification) {
    if (this.ready) {
      this.displayNotification(notification);
    }

    this.notifications.push(notification);
  }

  /**
   * Displays the notification visually.
   *
   * @private
   * @param {Notification} notification
   * @memberof NotificationContainer
   */
  private displayNotification = (notification: Notification) => {
    this.window &&
      this.window.webContents.send(
        "notification-add",
        notification.getSource()
      );
    notification.emit("display");
    if (notification.options.timeout) {
      setTimeout(() => {
        notification.close();
      }, notification.options.timeout);
    }
  };

  /**
   * Removes a notification logically (notifications[]) and
   * physically (DOM Element).
   *
   * @param {Notification} notification
   * @memberof NotificationContainer
   */
  public removeNotification(notification: Notification) {
    this.notifications.splice(this.notifications.indexOf(notification), 1);
    this.window &&
      this.window.webContents.send("notification-remove", notification.id);
    notification.emit("close");
  }

  /**
   * Destroys the container.
   *
   * @memberof NotificationContainer
   */
  public dispose() {
    this.window && this.window.close();
  }
}

export default NotificationContainer;
