const { app, shell } = require( 'electron' );

module.exports = ( name ) => [
  {
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'GitHub Repository',
        click: () => shell.openExternal( 'https://github.com/ItsSim/fsolauncher' )
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
  }
];