// preload.js
const Electron = require( 'electron' );

Electron.contextBridge.exposeInMainWorld( 'shared', {
  on: ( event, callback ) => {
   Electron.ipcRenderer.on( event, callback )
  },
  send: ( event, ...data ) => {
    Electron.ipcRenderer.send( event, ...data );
  },
  openExternal: url => {
    Electron.shell.openExternal( url )
  },
  electronVersion: process.versions.electron
} );