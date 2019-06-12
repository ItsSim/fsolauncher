const { app, dialog, BrowserWindow, shell, Tray, Menu } = require("electron");

const oslocale = require("os-locale");
const fs = require("fs");
const ini = require("ini");
const UIText = require("./FSOLauncher_UI/UIText.json");
const FSOLauncher = require("./FSOLauncher/FSOLauncher");

// Use for hot reload while developing:
// require("electron-reload")(__dirname, {	
//   electron:	
//     "%APPDATA%\\Roaming\\npm\\node_modules\\electron\\dist",	
// });

process.title = "FreeSO Launcher";
global.version = "1.5.5";
global.webService = "173.212.246.204";
global.sockEndpoint = "30001";
global.rmsPkgEndpoint = "RemeshPackage";
global.updateEndpoint = "UpdateCheck";

let Window = null;
let tray = null;
let launcher;
let options = {};

global.willQuit = false;

let code = oslocale.sync().substring(0, 2);

global.locale = UIText.hasOwnProperty(code) ? UIText[code] : UIText["en"];
global.locale.LVERSION = global.version;

require("electron-pug")({ pretty: false, }, global.locale);

let conf;

try {
  // Check if launcher configuration exists.
  conf = ini.parse(require("fs").readFileSync("FSOLauncher.ini", "utf-8"));
} catch (e) {
  // Else create the configuration with default values.
  conf = {
    Launcher: {
      Theme: "open_beta",
      DesktopNotifications: "1",
      Persistence: "1",
      DirectLaunch: "0"
    },
    Game: {
      GraphicsMode: "ogl",
      Language: "en",
      TTS: "0",
    },
  };

  fs.writeFileSync(
    "FSOLauncher.ini",
    ini.stringify(conf),
    "utf-8"
  );
}

function CreateWindow() {
  tray = new Tray("beta.ico");

  let width = 1100;
  let height = 675;

  options.minWidth = width;
  options.minHeight = height;
  options.maxWidth = width;
  options.maxHeight = height;
  options.center = true;
  options.maximizable = false;
  options.width = width;
  options.height = height;
  options.show = false;
  options.resizable = false;
  options.title = "FreeSO Launcher"/* + global.version*/;
  options.icon = "beta.ico";
  options.webPreferences = {
    nodeIntegration: true
  }; // Since we're not displaying untrusted content 
     // (all links are opened in a real browser window), we can enable this.

  Window = new BrowserWindow(options);

  Window.setMenu(null);
  //Window.openDevTools({ mode: "detach" });
  Window.loadURL("file://" + __dirname + "/FSOLauncher_UI/FSOLauncher.pug");

  launcher = new FSOLauncher(Window, conf);

  const trayTemplate = [
    {
      label: global.locale.TRAY_LABEL_1,
      click: () => {
        launcher.onPlay();
      },
    },
    {
      type: "separator",
    },
    {
      label: global.locale.TRAY_LABEL_2,
      click: () => {
        global.willQuit = true;
        Window.close();
      },
    },
  ];

  const ContextMenu = Menu.buildFromTemplate(trayTemplate);

  tray.setToolTip("FreeSO Launcher " + global.version);
  tray.setContextMenu(ContextMenu);

  tray.on("click", () => {
    Window.isVisible() ? Window.hide() : Window.show();
  });

  Window.on("closed", () => {
    Window = null;
  });

  Window.once("ready-to-show", () => {
    if(!launcher.isInstalled.FSO || conf.Launcher.DirectLaunch==='0') {
      Window.show()
    }
  });

  Window.on("close", e => {
    if (!global.willQuit && launcher.conf.Launcher.Persistence === "1") {
      e.preventDefault();
      Window.minimize();
    }
  });

  Window.webContents.on("new-window", (e, url) => {
    e.preventDefault();
    shell.openExternal(url);
  });
}

app.on("ready", CreateWindow);

app.on("before-quit", function() {
  tray.destroy();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  null === Window && CreateWindow();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (Window) {
      Window.show();
      Window.focus();
    }
  });
}