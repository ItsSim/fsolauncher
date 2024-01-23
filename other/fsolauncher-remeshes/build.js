const fs = require( 'fs' );
const archiver = require( 'archiver' );
const path = require( 'path' );
const { execSync } = require('child_process');

// Read package.json
const packageJson = require( './package.json' );
const version = packageJson.version;

// Execute the timestamp.sh script and parse its output
const timestampOutput = execSync( 'bash timestamp.sh' ).toString().trim();
const timestamp = timestampOutput.split(' ')[0]; // Timestamp is the first part of the output

// Output file
const outputFilename = `remeshes-${version}-${timestamp}.zip`;
const output = fs.createWriteStream( path.join( __dirname, `../../release/${outputFilename}` ) );
const archive = archiver( 'zip', {
  zlib: { level: 9 } // Compression level
} );

output.on( 'close', function () {
  const bytes = archive.pointer();
  const megabytes = bytes / 1024 / 1024;
  console.log( `${outputFilename} has been created. Total size: ${megabytes.toFixed(2)} MB` );
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