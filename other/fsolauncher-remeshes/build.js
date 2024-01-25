const fs = require( 'fs' );
const archiver = require( 'archiver' );
const path = require( 'path' );
const { execSync } = require( 'child_process' );

console.log( "Starting build script..." );

// Read package.json
console.log( "Reading package.json..." );
const packageJson = require( './package.json' );
const version = packageJson.version;
console.log( `Version: ${version}` );

// Execute the timestamp.sh script and parse its output
console.log( "Executing timestamp.sh script..." );
const timestampOutput = execSync( 'bash timestamp.sh' ).toString().trim();
console.log( `timestamp.sh output: ${timestampOutput}` );
const timestamp = timestampOutput.split(' ')[0]; // Timestamp is the first part of the output
console.log( `Extracted timestamp: ${timestamp}` );

// Output file
const outputFilename = `remeshes-${version}-${timestamp}.zip`;
console.log( `Output filename: ${outputFilename}` );
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
archive.on( 'error', function ( err )  {
  console.error( "Archive error:", err );
  throw err;
} );

// Zip the directory
console.log( "Zipping the directory..." );
archive.directory( 'remeshes/', false );

// Finalize the archive
console.log( "Finalizing the archive..." );
archive.pipe( output );
archive.finalize();
console.log( "Build script completed." );
