require( 'fix-path' )(); // Fix $PATH on darwin
require( 'v8-compile-cache' );
const { app, BrowserWindow, shell, Tray, Menu, nativeImage, nativeTheme } = require( 'electron' );

const oslocale = require( 'os-locale' ),
   fs = require( 'fs-extra' ),
  ini = require( 'ini' );

const UIText = require( './fsolauncher_ui/uitext.json' ),
 FSOLauncher = require( './fsolauncher/fsolauncher' ),
     package = require( './package.json' );

global.normalizePathSlashes = ( d ) => d ? d.replace( /\\/g, '/' ) : d

process.title = 'FreeSO Launcher';
global.VERSION = package.version;
global.WEBSERVICE = '173.212.246.204';

global.HOMEDIR = require( "os" ).homedir();
global.willQuit = false;

global.SOCKET_ENDPOINT = 30001;
global.REMESH_ENDPOINT = 'RemeshPackage';
global.UPDATE_ENDPOINT = 'UpdateCheck';

/**
 * On Windows, prefs and temps are written straight to the launcher folder.
 * On Mac, they are written in ~/Library/Application Support/FreeSO Launcher
 */
global.APPDATA = process.platform == 'darwin' ? 
  `${global.HOMEDIR}/Library/Application Support/FreeSO Launcher/` : '';
if( process.platform == 'darwin' ) fs.ensureDirSync( global.APPDATA + 'temp' );

let Window, tray, launcher, trayIcon, conf;

try {
  conf = ini.parse( fs.readFileSync( global.APPDATA + 'FSOLauncher.ini', 'utf-8' ) );
} catch ( e ) {
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
      Language: 'en',
      TTS: '0'
    }
  };

  fs.writeFileSync( global.APPDATA + 'FSOLauncher.ini', ini.stringify( conf ), 'utf-8' );
}

const code = ( ! conf.Launcher.Language || conf.Launcher.Language == 'default' ) ? 
  oslocale.sync().substring( 0, 2 ) : conf.Launcher.Language, 
   options = {};

global.locale = Object.prototype.hasOwnProperty.call( UIText, code )
  ? UIText[code]
  : UIText.en;

global.locale = Object.assign( UIText.en, global.locale );
global.locale.LVERSION = global.VERSION;
global.locale.PLATFORM = process.platform;
global.locale.LANGCODE = code;
global.locale.WS_PORT  = global.SOCKET_ENDPOINT;
global.locale.WS_URL   = global.WEBSERVICE;

function CreateWindow() {
  require( 'electron-pug' )( { pretty: false }, global.locale );
  if( process.platform == 'darwin' ) {
    const darwinAppMenu = require( './darwin-app-menu' );
    Menu.setApplicationMenu( Menu.buildFromTemplate( darwinAppMenu( app.getName() ) ) );
  }
  trayIcon = nativeImage.createFromPath(
    require( 'path' ).join( __dirname, process.platform == 'darwin' ? 'beta.png' : 'beta.ico' )
  );
  if( process.platform == 'darwin' ) {
    trayIcon = trayIcon.resize( { width: 16, height: 16 } );
  }
  tray = new Tray( trayIcon );

  const width = 1100, height = process.platform == 'darwin' ? 646 : 665;

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
  options.title = 'FreeSO Launcher ' + global.VERSION;
  //options.icon = process.platform == 'darwin' ? 'beta.icns' : 'beta.ico';
  options.webPreferences = {
    nodeIntegration: true,
    contextIsolation: false,
  }; // Since we're not displaying untrusted content
  // (all links are opened in a real browser window), we can enable this.

  Window = new BrowserWindow( options );

  Window.setMenu( null );
  // Window.openDevTools( { mode: 'detach' } );
  Window.loadURL( `file://${__dirname}/fsolauncher_ui/fsolauncher.pug` );

  Window.on( 'restore', _e => Window.setSize( width, height ) );

  launcher = new FSOLauncher( Window, conf );

  tray.setToolTip( `FreeSO Launcher ${global.VERSION}` );
  tray.setContextMenu( Menu.buildFromTemplate( [
    {
      label: global.locale.TRAY_LABEL_1,
      click: () => {
        launcher.events.onPlay();
      }
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
          launcher.events.onPlay();
          if( process.platform == 'darwin' ) {
            Window.show();
          }
        } else {
          Window.show();
        }
      } )
      .catch( _err => {
        console.log( _err );
        Window.show();
      } );
  } );

  Window.on( 'close', e => {
    if ( !global.willQuit && launcher.conf.Launcher.Persistence === '1' ) {
      e.preventDefault();
      Window.minimize();
    }
  } );

  Window.webContents.on( 'new-window', ( e, url ) => {
    e.preventDefault();
    shell.openExternal( url );
  } );
}

app.on( 'ready', CreateWindow );

app.on( 'before-quit', function() {
  tray.destroy();
} );

app.on( 'window-all-closed', () => {
  app.quit();
} );

app.on( 'activate', () => {
  null === Window && CreateWindow();
} );

const gotTheLock = app.requestSingleInstanceLock();

if ( !gotTheLock ) {
  app.quit();
} else {
  app.on( 'second-instance', ( _event, _commandLine, _workingDirectory ) => {
    if ( Window ) {
      Window.show();
      Window.focus();
    }
  } );
}
