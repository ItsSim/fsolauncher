const { app, shell } = require( 'electron' );

/**
 * Generates a menu configuration.
 * @param {string} name The name of the application.
 * @param {import('./fsolauncher/fsolauncher')} fsolauncher The FSOLauncher instance.
 */
module.exports = ( name, fsolauncher ) => [
  {
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Check for Updates',
        click: () => {
          fsolauncher.IPC.changePage( 'about' );
          if ( fsolauncher.window.isMinimized() ) fsolauncher.window.restore();
          fsolauncher.checkLauncherUpdates();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          fsolauncher.IPC.changePage( 'settings' );
          if ( fsolauncher.window.isMinimized() ) fsolauncher.window.restore();
          fsolauncher.window.focus();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide ' + name,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: 'Hide Others',
        accelerator: 'Command+Shift+H',
        role: 'hideothers'
      },
      {
        label: 'Show All',
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit ' + name,
        accelerator: 'Command+Q',
        click: () => {
          global.willQuit = true;
          app.quit();
        }
      },
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Source Code on GitHub',
        click: () => shell.openExternal( 'https://github.com/ItsSim/fsolauncher' )
      },
      {
        label: 'View Documentation',
        click: () => shell.openExternal( 'https://github.com/ItsSim/fsolauncher/wiki' )
      },
      {
        type: 'separator'
      },
      {
        label: 'Create New Issue',
        click: () => shell.openExternal( 'https://github.com/ItsSim/fsolauncher/issues/new/choose' )
      },
      {
        label: 'View All Issues',
        click: () => shell.openExternal( 'https://github.com/ItsSim/fsolauncher/issues' )
      },
      {
        type: 'separator'
      },
      {
        label: 'Official FreeSO Website',
        click: () => shell.openExternal( 'https://freeso.org' )
      }
    ]
  }
];