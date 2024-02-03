require( 'fix-path' )(); // Fix $PATH on darwin
require( 'v8-compile-cache' );

const { initSentry } = require( './fsolauncher/lib/utils' );
// init Sentry error logging as soon as possible
initSentry();

const { app, BrowserWindow, shell, Tray, Menu, nativeImage, nativeTheme } = require( 'electron' );

const isTestMode = global.isTestMode = app.commandLine.getSwitchValue( 'test-mode' );
const themeColors = require( './theme-colors' );

if ( isTestMode ) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch( 'no-sandbox' );
  app.commandLine.appendSwitch( 'disable-gpu' );
  app.commandLine.appendSwitch( 'disable-software-rasterizer' );
  app.commandLine.appendSwitch( 'disable-gpu-compositing' );
  app.commandLine.appendSwitch( 'disable-gpu-rasterization' );
  app.commandLine.appendSwitch( 'disable-gpu-sandbox' );
  app.commandLine.appendSwitch( '--no-sandbox' );
}

const { appData, version } = require( './fsolauncher/constants' );
const { locale, setLocale } = require( './fsolauncher/locale' );

const oslocale = require( 'os-locale' ),
  fs = require( 'fs-extra' ),
  ini = require( 'ini' );

const FSOLauncher = require( './fsolauncher/fsolauncher' );

process.title = 'FreeSO Launcher';

// Initialize willQuit with false
// Once changed to true, next time the app is closed, it won't
// minimize and will completely close
global.willQuit = false;

// Override shell.openExternal to make sure they are actual URLs
// before opening them
const prevOpenExternal = shell.openExternal;
shell.openExternal = Object.freeze( url => {
  if ( url.startsWith( 'http' ) || url.startsWith( 'https' ) ) {
    prevOpenExternal( url );
  }
} );
Object.freeze( shell );

// Create the temp directory on macOS
if ( process.platform == 'darwin' ) {
  fs.ensureDirSync( appData + '/temp' );
}

/** @type {Electron.BrowserWindow} */
let window;

/** @type {Electron.Tray} */
let tray;

/** @type {FSOLauncher} */
let launcher;

/** @type {string} */
let trayIcon;

/**
 * @typedef  {Object} UserSettings
 * @property {Object} Launcher                      The launcher configuration.
 * @property {string} Launcher.Theme                The launcher theme.
 * @property {string} Launcher.DesktopNotifications Whether to show desktop notifications.
 * @property {string} Launcher.DirectLaunch         Whether to launch the game directly.
 * @property {string} Launcher.Language             The launcher language.
 * @property {string} Launcher.Debug                Whether to enable debug mode.
 * @property {Object} Game                          The game configuration.
 * @property {string} Game.GraphicsMode             The game graphics mode.
 * @property {string} Game.Language                 The game language.
 * @property {string} Game.RefreshRate              The game refresh rate.
 * @property {Object} LocalRegistry                 The local registry.
 * @property {string} LocalRegistry.FSO             The local registry for FSO.
 * @property {string} LocalRegistry.TSO             The local registry for TSO.
 * @property {string} LocalRegistry.Simitone        The local registry for Simitone.
 */

/**
 * @type {UserSettings}
 */
let userSettings;

try {
  // Load the FSOLauncher.ini file and make it available for the launcher
  userSettings = ini.parse( fs.readFileSync( appData + '/FSOLauncher.ini', 'utf-8' ) );
} catch ( err ) {
  // The FSOLauncher.ini file does not exist, create a new one with
  // predefined values
  userSettings = {
    Launcher: {
      Theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'open_beta',
      DesktopNotifications: '1',
      Persistence: process.platform == 'darwin' ? '0' : '1',
      DirectLaunch: '0',
      Language: 'default'
    },
    Game: {
      GraphicsMode: process.platform === 'win32' ? 'dx' : 'ogl',
      Language: 'en'
    }
  };
  // Write the new FSOLauncher.ini to disk
  fs.writeFileSync( appData + '/FSOLauncher.ini', ini.stringify( userSettings ), 'utf-8' );
}
console.info( 'loaded userSettings', userSettings );

// Obtain the user's language code to determine which translation to load
// The user can override their system's language by selecting one manually
// in the launcher settings
const code = ( ! userSettings.Launcher.Language || userSettings.Launcher.Language == 'default' ) ?
  oslocale.sync().substring( 0, 2 ) : userSettings.Launcher.Language;

// Initialize the locale with the obtained language code and add some extra
// values that will be replaced in the HTML
setLocale( code, {
  LVERSION: version,
  LTHEME: userSettings.Launcher.Theme,
  PLATFORM: process.platform,
  SENTRY: require( './sentry.config' ).browserLoader,
  LANGCODE: code,
  DEFAULT_REFRESH_RATE: 60,
  REMESH_PACKAGE_CREDITS: require( './fsolauncher-ui/remesh-package-credits.json' )
} );

/** @type {Electron.BrowserWindowConstructorOptions} */
const options = {};

function showWindow() {
  ! isTestMode && window.show();
}

function createWindow() {
  require( 'electron-pug' )( { pretty: false }, locale.current );

  // Create the trayIcon for macOS and Windows
  trayIcon = nativeImage.createFromPath(
    require( 'path' ).join( __dirname, process.platform == 'darwin' ? 'beta.png' : 'beta.ico' )
  );
  if ( process.platform == 'darwin' ) {
    trayIcon = trayIcon.resize( { width: 16, height: 16 } );
  }
  tray = new Tray( trayIcon );

  const width = 1090, height = process.platform == 'darwin' ? 646 : 664;

  options.backgroundColor = themeColors[ userSettings.Launcher.Theme ] || '#fff';
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
  options.title = 'FreeSO Launcher ' + version;
  options.webPreferences = {
    nodeIntegration: false,
    contextIsolation: true,
    offscreen: isTestMode,
    preload: require( 'path' ).join( __dirname, './fsolauncher-ui/preload.js' )
  };

  window = new BrowserWindow( options );
  window.setMenu( null );

  // Allow the user to open devTools if Debug=1 in FSOLauncher.ini
  if ( userSettings.Launcher.Debug == '1' && ! isTestMode ) {
    console.info( 'debug mode enabled' );
    window.openDevTools( { mode: 'detach' } );
  }

  window.loadURL( `file://${__dirname}/fsolauncher-ui/fsolauncher.pug` );
  window.on( 'restore', _e => window.setSize( width, height ) );

  launcher = new FSOLauncher( window, userSettings );

  if ( process.platform == 'darwin' ) {
    // Create the app menu for macOS
    const darwinAppMenu = require( './darwin-app-menu' );
    Menu.setApplicationMenu( Menu.buildFromTemplate( darwinAppMenu( app.getName(), launcher ) ) );
  }

  tray.setToolTip( `FreeSO Launcher ${version}` );
  tray.setContextMenu( Menu.buildFromTemplate( [
    {
      label: locale.current.TRAY_LABEL_1,
      click: () => launcher.launchGame()
    },
    {
      type: 'separator'
    },
    {
      label: locale.current.TRAY_LABEL_2,
      click: () => {
        global.willQuit = true;
        window?.close();
      }
    }
  ] ) );

  tray.on( 'click', () => {
    window.isVisible() ? ( process.platform == 'darwin' ? window.minimize() : window.hide() ) : showWindow();
  } );

  window.on( 'closed', () => { window = null; } );

  window.once( 'ready-to-show', () => {
    launcher
      .updateInstalledPrograms()
      .then( () => {
        if ( userSettings.Launcher.DirectLaunch === '1' && launcher.isInstalled.FSO ) {
          launcher.launchGame();
          if ( process.platform == 'darwin' ) {
            showWindow();
          }
        } else {
          showWindow();
        }
      } )
      .catch( err => {
        console.error( err );
        showWindow();
      } );
  } );

  window.on( 'close', e => {
    if ( ! global.willQuit && launcher.userSettings.Launcher.Persistence === '1' ) {
      e.preventDefault();
      window.minimize();
    }
  } );

  window.webContents.setWindowOpenHandler( ( { url } ) => {
    shell.openExternal( url );
    return { action: 'deny' };
  } );
}

app.on( 'ready', createWindow );

app.on( 'before-quit', function () {
  if ( tray ) tray.destroy();
} );

app.on( 'window-all-closed', () => {
  app.quit();
} );

app.on( 'activate', () => {
  null === window && createWindow();
} );

const gotTheLock = app.requestSingleInstanceLock();

if ( ! gotTheLock ) {
  app.quit();
} else {
  app.on( 'second-instance', ( _event, _commandLine, _workingDirectory ) => {
    if ( window ) {
      showWindow();
      window.focus();
    }
  } );
}
