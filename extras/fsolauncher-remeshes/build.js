const fs = require( 'fs' );
const archiver = require( 'archiver' );
const path = require( 'path' );

console.log( "Starting build script..." );

// Read package.json
console.log( "Reading package.json..." );
const packageJson = require( './package.json' );
const version = packageJson.version;
console.log( `Version: ${version}` );

// Execute the timestamp.sh script and parse its output
console.log( "Executing timestamp.sh script..." );
const timestamp = fs.readFileSync( './timestamp.txt', 'utf8' ).trim();
console.log( `Remeshes were last updated: ${timestamp}` );

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
