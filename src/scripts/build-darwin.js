const packager = require( 'electron-packager' ),
  { execSync } = require( 'child_process' );

( async () => {
  try {
    await packager( {
      dir: '.',
      name: 'FreeSO Launcher',
      out: '../release',
      platform: 'darwin',
      arch: 'universal',
      icon: './beta.icns',
      asar: {
        unpackDir: '{export,fsolauncher_ui/images,fsolauncher_ui/sounds,fsolauncher_ui/fonts}',
      },
      overwrite: true,
      appCopyright: 'Copyright (C) FreeSO. All rights reserved.',
      derefSymlinks: true
    } );
    execSync( 'electron-installer-dmg \
      ../release/FreeSO\\ Launcher-darwin-universal/FreeSO\\ Launcher.app \
      FreeSO\\ Launcher \
      --out=../release \
      --icon=./beta.icns \
      --background=./osx_dmg.png \
      --title=FreeSO\\ Launcher \
      --overwrite', { stdio: 'inherit' } );
  } catch ( err ) {
    console.error( err );
    process.exitCode = 1;
  }
} )();