require( 'fix-path' )(); // Fix $PATH on darwin
require( 'v8-compile-cache' );

const { initSentry, enableFileLogger } = require( './fsolauncher/lib/utils' );
// init Sentry error logging as soon as possible
initSentry();

const { app, BrowserWindow, shell, Tray, Menu, nativeImage, nativeTheme } = require( 'electron' );
const compilePugFiles = require( './fsolauncher/lib/pug-compiler' );

const {
  appData,
  version,
  darkThemes,
  resourceCentral,
  isTestMode,
  fileLogEnabled,
  devToolsEnabled,
  defaultRefreshRate,
  defaultGameLanguage,
  homeDir
} = require( './fsolauncher/constants' );

if ( fileLogEnabled ) {
  enableFileLogger();
  console.info( 'file logger enabled' );
}

if ( isTestMode && process.platform !== 'linux' ) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch( 'no-sandbox' );
  app.commandLine.appendSwitch( 'disable-gpu' );
  app.commandLine.appendSwitch( 'disable-software-rasterizer' );
  app.commandLine.appendSwitch( 'disable-gpu-compositing' );
  app.commandLine.appendSwitch( 'disable-gpu-rasterization' );
  app.commandLine.appendSwitch( 'disable-gpu-sandbox' );
  app.commandLine.appendSwitch( '--no-sandbox' );
}

const { locale, setLocale } = require( './fsolauncher/lib/locale' );

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

// Ensure the temp dir is present
fs.ensureDirSync( appData + '/temp' );

/** @type {Electron.BrowserWindow} */
let window;

/** @type {Electron.Tray} */
let tray;

/** @type {FSOLauncher} */
let launcher;

/** @type {string} */
let trayIcon;

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
      Persistence: [ 'darwin', 'linux' ].includes( process.platform ) ? '0' : '1',
      DirectLaunch: '0',
      Language: 'default'
    },
    Game: {
      GraphicsMode: process.platform === 'win32' ? 'dx' : 'ogl',
      Language: defaultGameLanguage
    }
  };
  // Write the new FSOLauncher.ini to disk
  fs.writeFileSync( appData + '/FSOLauncher.ini', ini.stringify( userSettings ), 'utf-8' );
}
console.info( 'loaded userSettings', userSettings );

/**
 * @param {UserSettings} settings
 */
function loadLocale( settings ) {
  let langCode = settings.Launcher.Language;
  // Obtain the user's language code to determine which translation to load
  // The user can override their system's language by selecting one manually
  // in the launcher settings
  if ( ! langCode || langCode === 'default' ) {
    langCode = oslocale.sync().substring( 0, 2 );
  }
  // Initialize the locale with the obtained language code and add some extra
  // values that will be replaced in the HTML
  setLocale( langCode, {
    CSP_STRING: require( './csp.config' ),
    LAUNCHER_VERSION: version,
    ELECTRON_VERSION: process.versions.electron,
    LAUNCHER_THEME: settings.Launcher.Theme,
    PLATFORM: process.platform,
    DARK_THEMES: darkThemes.join( ',' ),
    SENTRY: require( './sentry.config' ).browserLoader,
    LANG_CODE: langCode,
    DEFAULT_REFRESH_RATE: defaultRefreshRate,
    REMESH_PACKAGE_CREDITS: require( './fsolauncher-ui/remesh-package.json' ),
    PRELOADED_FONTS: require( './fonts.config' ),
    WS_URL: resourceCentral.WS,
    TRENDING_LOTS_URL: resourceCentral.TrendingLots,
    SCENARIOS_URL: resourceCentral.Scenarios,
    SIMITONE_PLATFORM_PATH: appData.replace( homeDir, '~' ) + '/GameComponents/The Sims',
    BLOG_URL: resourceCentral.Blog
  } );
}
loadLocale( userSettings );

/** @type {Electron.BrowserWindowConstructorOptions} */
const options = {};

function showWindow() {
  ! isTestMode && window.show();
}

async function createWindow() {
  compilePugFiles( { pretty: false }, () => locale.current );

  // Create the trayIcon for macOS and Windows
  trayIcon = nativeImage.createFromPath(
    require( 'path' ).join( __dirname, [ 'darwin', 'linux' ].includes( process.platform ) ? 'beta.png' : 'beta.ico' )
  );
  if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
    trayIcon = trayIcon.resize( { width: 16, height: 16 } );
  }
  tray = new Tray( trayIcon );

  const width = 1090 + 8;
  const height = 646 + 12 + 30;

  options.transparent = true;
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
  options.frame = false;
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

  if ( devToolsEnabled && ! isTestMode ) {
    console.info( 'devtools enabled' );
    window.openDevTools( { mode: 'detach' } );
  }

  window.loadURL( `file://${__dirname}/fsolauncher-ui/fsolauncher.pug` );

  window.on( 'hide', () => process.platform === 'win32' && window.setSize( width, height ) );
  window.on( 'restore', () => process.platform === 'win32' && window.setSkipTaskbar( false ) );

  launcher = new FSOLauncher( {
    window,
    userSettings,
    onReload: async settings => {
      loadLocale( settings );
      window.reload();
    }
  } );

  if ( process.platform === 'darwin' ) {
    // Create the app menu for macOS
    const darwinAppMenu = require( './fsolauncher/lib/darwin-app-menu' );
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
    if ( ! window ) return;

    if ( window.isVisible() ) {
      if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
        window.minimize();
      } else {
        window.hide();
      }
    } else {
      showWindow();
    }
  } );

  window.on( 'closed', () => window = null );

  window.once( 'ready-to-show', () => {
    launcher
      .updateInstalledPrograms()
      .then( () => {
        if ( userSettings.Launcher.DirectLaunch === '1' && launcher.isInstalled.FSO ) {
          launcher.launchGame();
          if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
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

if ( process.platform === 'linux' ) {
  app.commandLine.appendSwitch( 'use-gl','desktop' );
  app.on( 'ready', () => setTimeout( createWindow, 500 ) );
} else {
  app.on( 'ready', createWindow );
}

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
