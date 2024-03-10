const packager = require( '@electron/packager' ),
  { execSync } = require( 'child_process' );

( async () => {
  try {
    await packager( {
      dir: '.',
      name: 'fsolauncher',
      out: '../release',
      platform: 'win32',
      arch: 'ia32',
      icon: './beta.ico',
      asar: {
        unpackDir: '{export,fsolauncher-ui/images,fsolauncher-ui/sounds,fsolauncher-ui/fonts}',
      },
      overwrite: true,
      appCopyright: 'Copyright (C) FreeSO. All rights reserved.',
      win32metadata: {
        CompanyName: 'FreeSO.org',
        'requested-execution-level': 'requireAdministrator',
        FileDescription: 'FreeSO Launcher',
      },
      derefSymlinks: true
    } );
    execSync( 'npm run copywin', { stdio: 'inherit' } );
    execSync( 'npm run compileiss', { stdio: 'inherit' } );
  } catch ( err ) {
    console.error( err );
    process.exitCode = 1;
  }
} )();