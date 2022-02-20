const yauzl = require( 'yauzl' ), fs = require( 'fs-extra' );

/**
 * Extracts a zip file, recursively creates directories, once resolved
 * returns a cleanup function.
 */
module.exports = ( { from, to, cpperm }, onEntry = () => {} ) =>
  new Promise( ( resolve, reject ) => {
    /**
     * Empties the folder it extracted to.
     */
    const cleanup = () =>
      !['.', './'].includes( to )
        ? fs.remove( to )
        : Promise.reject( 'Cannot delete current directory.' );
    /**
     * Handles a yauzl.Entry extraction.
     *
     * @param {yauzl.ZipFile} zipfile The zip file to extract.
     * @param {yauzl.Entry} entry The entry to extract.
     */
    function handleEntry( zipfile, entry ) {
      if ( entry.fileName.endsWith( '/' ) ) return zipfile.readEntry();
      // Send an onEntry event with current filename.
      onEntry( entry.fileName );
      // Write the file.
      zipfile.openReadStream( entry, async function( err, readStream ) {
        if ( err ) return reject( err );
        let options = null;
        if( cpperm ) options = { mode: entry.externalFileAttributes >>> 16 };
        const destination =
          ( to.endsWith( '/' ) ? to : to + '/' ) + entry.fileName;
        try {
          await fs.ensureDir( require( 'path' ).dirname( destination ) );
          const file = fs.createWriteStream( destination, options );
          file.on( 'error', reject );
          readStream.pipe( file );
          readStream.on( 'end', () => zipfile.readEntry() );
        } catch ( e ) {
          reject( e );
        }
      } );
    }
    // Open zip file with yauzl.
    yauzl.open( from, { lazyEntries: true }, function( err, zipfile ) {
      if ( err ) return reject( err );
      zipfile
        .on( 'entry', entry => handleEntry( zipfile, entry ) )
        .once( 'error', reject )
        .once( 'close', () => resolve( cleanup ) )
        .readEntry();
    } );
  } );