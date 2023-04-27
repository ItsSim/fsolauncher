const fs = require( 'fs-extra' );
const version = require( '../package.json' ).version;

try {
  const iss = fs.readFileSync( '../release/win32-ia32.iss', { encoding: 'utf8' } );
  const newString = `#define MyAppVersion "${version}"`;
  const matches = iss.match( /#define MyAppVersion "\d+.\d+.\d+"/gm );
  if ( matches && matches[ 0 ] ) {
    if ( matches[ 0 ] == newString ) {
      console.info( '(build notice)', '.iss version already up-to-date, continuing...' );
    } else {
      const updatediss = iss.replace( matches[ 0 ], newString );
      fs.writeFileSync( '../release/win32-ia32.iss', updatediss );
      console.info( '(build notice)', '.iss version was updated to', version );
    }
  } else {
    throw new Error( 'Could not find MyAppVersion string' );
  }
} catch ( err ) {
  console.error( '(build error)', 'Could not replace launcher version in .iss file.' );
  console.error( err );
  process.exit();
}

