require( 'v8-compile-cache' );
const { app, BrowserWindow, shell, Tray, Menu } = require( 'electron' );

const oslocale = require( 'os-locale' );
const fs = require( 'fs-extra' );
const ini = require( 'ini' );
const UIText = require( './FSOLauncher_UI/UIText.json' );
const FSOLauncher = require( './FSOLauncher/FSOLauncher' );
const package = require( './package.json' );

process.title = 'FreeSO Launcher';
/**
 * FreeSO Launcher version.
 * Must be defined in package.json.
 */
global.VERSION = package.version;
/**
 * WS Host.
 * Host of API serving launcher data.
 */
global.WEBSERVICE = '173.212.246.204';
/**
 * WS Port.
 * Port for the launcher WebSocket Server.
 */
global.SOCKET_ENDPOINT = '30001';
/**
 * API Remesh Endpoint.
 * Exposes the current remesh package info.
 */
global.REMESH_ENDPOINT = 'RemeshPackage';
/**
 * API Launcher Endpoint.
 * Exposes the current launcher info.
 */
global.UPDATE_ENDPOINT = 'UpdateCheck';

let Window = null;
let tray = null;
let launcher;
const options = {};

global.willQuit = false;

const code = oslocale.sync().substring( 0, 2 );

global.locale = Object.prototype.hasOwnProperty.call( UIText, code )
  ? UIText[code]
  : UIText['en'];
global.locale.LVERSION = global.VERSION;

require( 'electron-pug' )( { pretty: false }, global.locale );

let conf;

try {
  conf = ini.parse( fs.readFileSync( 'FSOLauncher.ini', 'utf-8' ) );
} catch ( e ) {
  conf = {
    Launcher: {
      Theme: 'open_beta',
      DesktopNotifications: '1',
      Persistence: '1',
      DirectLaunch: '0'
    },
    Game: {
      GraphicsMode: 'ogl',
      Language: 'en',
      TTS: '0'
    }
  };

  fs.writeFileSync( 'FSOLauncher.ini', ini.stringify( conf ), 'utf-8' );
}

function CreateWindow() {
  tray = new Tray( 'beta.ico' );

  const width = 1100;
  const height = 665;

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
  options.title = 'FreeSO Launcher' /* + global.VERSION*/;
  options.icon = 'beta.ico';
  options.webPreferences = {
    nodeIntegration: true
  }; // Since we're not displaying untrusted content
  // (all links are opened in a real browser window), we can enable this.

  Window = new BrowserWindow( options );

  Window.setMenu( null );
  //Window.openDevTools({ mode: 'detach' });
  Window.loadURL( 'file://' + __dirname + '/FSOLauncher_UI/FSOLauncher.pug' );

  launcher = new FSOLauncher( Window, conf );

  const trayTemplate = [
    {
      label: global.locale.TRAY_LABEL_1,
      click: () => {
        launcher.onPlay();
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
  ];

  const ContextMenu = Menu.buildFromTemplate( trayTemplate );

  tray.setToolTip( 'FreeSO Launcher ' + global.VERSION );
  tray.setContextMenu( ContextMenu );

  tray.on( 'click', () => {
    Window.isVisible() ? Window.hide() : Window.show();
  } );

  Window.on( 'closed', () => {
    Window = null;
  } );

  Window.once( 'ready-to-show', () => {
    launcher
      .updateInstalledPrograms()
      .then( () => {
        if ( conf.Launcher.DirectLaunch === '1' && launcher.isInstalled.FSO ) {
          launcher.onPlay();
        } else {
          Window.show();
        }
      } )
      .catch( _err => {
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
