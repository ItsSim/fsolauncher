require( 'fix-path' )(); // Fix $PATH on darwin
require( 'v8-compile-cache' );

global.isTestMode = process.argv.includes( '--test-mode' );
if ( global.isTestMode ) {
  console.log( 'CI: Test mode enabled' );
}

const { initSentry } = require( './fsolauncher/lib/utils' );
// init Sentry error logging
initSentry();

const { 
  app, BrowserWindow, shell, Tray, Menu, nativeImage, nativeTheme
} = require( 'electron' );
const oslocale = require( 'os-locale' );
const fs = require( 'fs-extra' );
const ini = require( 'ini' );
const UIText = require( './fsolauncher_ui/uitext.json' );
const FSOLauncher = require( './fsolauncher/fsolauncher' );
const package = require( './package.json' );

process.title = 'FreeSO Launcher';
global.willQuit = false;
global.launcherVersion = package.version;
global.webService = 'beta.freeso.org';
global.homeDir = require( 'os' ).homedir();
global.socketPort = 30001;
global.remeshEndpoint = 'remeshpackage';
global.updateEndpoint = 'updatecheck';

const prevOpenExternal = shell.openExternal;
shell.openExternal = Object.freeze( url => {
  if ( url.startsWith( 'http' ) || url.startsWith( 'https' ) ) {
    prevOpenExternal( url )
  } else {
    console.log( 'openExternal blocked', url )
  }
} );
Object.freeze( shell );

/**
 * On Windows, prefs and temps are written straight to the launcher folder.
 * On Mac, they are written in ~/Library/Application Support/FreeSO Launcher
 */
global.appData = process.platform == 'darwin' ?
  `${global.homeDir}/Library/Application Support/FreeSO Launcher/` : '';
if ( process.platform == 'darwin' ) fs.ensureDirSync( global.appData + 'temp' );

/** @type {Electron.BrowserWindow} */
let Window;

/** @type {Electron.Tray} */
let tray;

/** @type {FSOLauncher} */
let launcher;

/** @type {string} */
let trayIcon;

/**
 * @typedef  {object} UserSettings
 * @property {object} Launcher                      The launcher configuration.
 * @property {string} Launcher.Theme                The launcher theme.
 * @property {string} Launcher.DesktopNotifications Whether to show desktop notifications.
 * @property {string} Launcher.DirectLaunch         Whether to launch the game directly.
 * @property {string} Launcher.Language             The launcher language.
 * @property {string} Launcher.Debug                Whether to enable debug mode.
 * @property {object} Game                          The game configuration.
 * @property {string} Game.GraphicsMode             The game graphics mode.
 * @property {string} Game.Language                 The game language.
 */

/**
 * @type {UserSettings}
 */
let conf;

try {
  conf = ini.parse( fs.readFileSync( global.appData + 'FSOLauncher.ini', 'utf-8' ) );
} catch ( err ) {
  conf = {
    Launcher: {
      Theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'open_beta',
      DesktopNotifications: '1',
      Persistence: process.platform == 'darwin' ? '0' : '1',
      DirectLaunch: '0',
      Language: 'default'
    },
    Game: {
      GraphicsMode: 'ogl',
      Language: 'en'
    }
  };
  fs.writeFileSync( global.appData + 'FSOLauncher.ini', ini.stringify( conf ), 'utf-8' );
}

const code = ( ! conf.Launcher.Language || conf.Launcher.Language == 'default' ) ?
  oslocale.sync().substring( 0, 2 ) : conf.Launcher.Language;

/** @type {Electron.BrowserWindowConstructorOptions} */
const options = {};

global.locale = Object.prototype.hasOwnProperty.call( UIText, code )
  ? UIText[code]
  : UIText.en;

global.locale = Object.assign( UIText.en, global.locale ); // Merge EN strings with current language.
global.locale.LVERSION = global.launcherVersion;
global.locale.PLATFORM = process.platform;
global.locale.LANGCODE = code;

global.locale.WS_PORT = global.socketPort;
global.locale.WS_URL = global.webService;
global.locale.SENTRY = require( './sentry.config' ).browserLoader;

function CreateWindow() {
  require( 'electron-pug' )( { pretty: false }, global.locale );
  if ( process.platform == 'darwin' ) {
    const darwinAppMenu = require( './darwin-app-menu' );
    Menu.setApplicationMenu( Menu.buildFromTemplate( darwinAppMenu( app.getName() ) ) );
  }
  trayIcon = nativeImage.createFromPath(
    require( 'path' ).join( __dirname, process.platform == 'darwin' ? 'beta.png' : 'beta.ico' )
  );
  if ( process.platform == 'darwin' ) {
    trayIcon = trayIcon.resize( { width: 16, height: 16 } );
  }
  tray = new Tray( trayIcon );

  const width = 1090, height = process.platform == 'darwin' ? 646 : 664;

  options.minWidth = width;
  options.minHeight = height;
  options.maxWidth = width;
  options.maxHeight = height;
  options.center = true;
  options.maximizable = false;
  options.width = width;
  options.height = height;
  options.useContentSize = true;
  options.show = false;
  options.resizable = false;
  options.title = 'FreeSO Launcher ' + global.launcherVersion;
  options.webPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    backgroundThrottling: false,
    preload: require( 'path' ).join( __dirname, './fsolauncher_ui/preload.js' )
  };

  Window = new BrowserWindow( options );

  Window.setMenu( null );
  if ( conf.Launcher.Debug == '1' ) {
    console.log( 'Debug mode enabled' );
    Window.openDevTools( { mode: 'detach' } );
  }
  Window.loadURL( `file://${__dirname}/fsolauncher_ui/fsolauncher.pug` );
  Window.on( 'restore', _e => Window.setSize( width, height ) );

  launcher = new FSOLauncher( Window, conf );

  tray.setToolTip( `FreeSO Launcher ${global.launcherVersion}` );
  tray.setContextMenu( Menu.buildFromTemplate( [
    {
      label: global.locale.TRAY_LABEL_1,
      click: () => launcher.launchGame()
    },
    {
      type: 'separator'
    },
    {
      label: global.locale.TRAY_LABEL_2,
      click: () => {
        global.willQuit = true;
        Window.close();
      }
    }
  ] ) );

  tray.on( 'click', () => {
    Window.isVisible() ? Window.hide() : Window.show();
  } );

  Window.on( 'closed', () => { Window = null; } );

  Window.once( 'ready-to-show', () => {
    launcher
      .updateInstalledPrograms()
      .then( () => {
        if ( conf.Launcher.DirectLaunch === '1' && launcher.isInstalled.FSO ) {
          launcher.launchGame()
          if ( process.platform == 'darwin' ) {
            Window.show();
          }
        } else {
          Window.show();
        }
      } )
      .catch( err => {
        console.log( err );
        Window.show();
      } );
  } );

  Window.on( 'close', e => {
    if ( ! global.willQuit && launcher.conf.Launcher.Persistence === '1' ) {
      e.preventDefault();
      Window.minimize();
    }
  } );

  Window.webContents.setWindowOpenHandler( ( { url } ) => {
    shell.openExternal( url );
    return { action: 'deny' };
  } );

  if ( global.isTestMode ) {
    global.willQuit = true;
    Window.webContents.on( 'did-finish-load', () => {
      app.quit();
    } );
  }
}

app.on( 'ready', CreateWindow );

app.on( 'before-quit', function () {
  if ( tray ) tray.destroy();
} );

app.on( 'window-all-closed', () => {
  app.quit();
} );

app.on( 'activate', () => {
  null === Window && CreateWindow();
} );

const gotTheLock = app.requestSingleInstanceLock();

if ( ! gotTheLock ) {
  app.quit();
} else {
  app.on( 'second-instance', ( _event, _commandLine, _workingDirectory ) => {
    if ( Window ) {
      Window.show();
      Window.focus();
    }
  } );
}
