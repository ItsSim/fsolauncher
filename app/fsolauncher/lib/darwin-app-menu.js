const { app, shell } = require( 'electron' );
const { repoUrl, repoDocsUrl, repoNewIssueUrl, repoViewIssuesUrl } = require( '../constants' );
const { locale } = require( '../lib/locale' );

/**
 * Generates the app menu for macOS.
 *
 * @param {string} name The name of the application.
 * @param {import('../fsolauncher')} fsolauncher The FSOLauncher instance.
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
          fsolauncher.window.restore();
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
          fsolauncher.window.restore();
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
        click: () => shell.openExternal( repoUrl )
      },
      {
        label: 'View Documentation',
        click: () => shell.openExternal( repoDocsUrl )
      },
      {
        type: 'separator'
      },
      {
        label: 'Create New Issue',
        click: () => shell.openExternal( repoNewIssueUrl )
      },
      {
        label: 'View All Issues',
        click: () => shell.openExternal( repoViewIssuesUrl )
      },
      {
        type: 'separator'
      },
      {
        label: 'Official FreeSO Website',
        click: () => shell.openExternal( locale.current.WEB_URL )
      }
    ]
  }
];