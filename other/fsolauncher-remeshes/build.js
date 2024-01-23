const fs = require( 'fs' );
const archiver = require( 'archiver' );
const path = require( 'path' );

// Read package.json
const packageJson = require( './package.json' );
const version = packageJson.version;

// Output file
const output = fs.createWriteStream( path.join( __dirname, `../../release/remeshes-${version}.zip` ) );
const archive = archiver( 'zip', {
  zlib: { level: 9 } // Compression level
} );

output.on( 'close', function () {
  const bytes = archive.pointer();
  const megabytes = bytes / 1024 / 1024;
  console.log(`remeshes-${version}.zip has been created. Total size: ${megabytes.toFixed(2)} MB`);
} );

// Catch errors
archive.on( 'error', function ( err ) {
  throw err;
} );

// Zip the directory
archive.directory( 'remeshes/', false );

// Finalize the archive
archive.pipe( output );
archive.finalize();