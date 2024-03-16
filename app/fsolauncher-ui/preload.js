// preload.js
const { contextBridge, ipcRenderer, shell } = require( 'electron' );

contextBridge.exposeInMainWorld( 'shared', {
  on: ( event, callback ) => {
    ipcRenderer.on( event, callback );
  },
  send: ( event, ...data ) => {
    ipcRenderer.send( event, ...data );
  },
  openExternal: url => {
    shell.openExternal( url );
  }
} );