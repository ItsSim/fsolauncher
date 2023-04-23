const yauzl = require( 'yauzl' ), fs = require( 'fs-extra' );

/**
 * Extracts a zip file, recursively creates directories, and once resolved,
 * returns a cleanup function.
 *
 * @param {Object}   options        The options object.
 * @param {string}   options.from   The path of the zip file to be extracted.
 * @param {string}   options.to     The destination path where the zip file will 
 *                                  be extracted.
 * @param {boolean}  options.cpperm If true, preserves the permissions of 
 *                                  extracted files.
 * @param {Function} onEntry        Optional callback function called for each 
 *                                  entry being extracted.
 *
 * @returns {Promise<Function>} A Promise that resolves to a cleanup function that
 *                              empties the extracted folder.
 */
module.exports = ( { from, to, cpperm }, onEntry = () => {} ) =>
  new Promise( ( resolve, reject ) => {
    /**
     * Empties the folder it extracted to.
     */
    const cleanup = () =>
      ! [ '.', './' ].includes( to )
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
        if ( cpperm ) options = { mode: entry.externalFileAttributes >>> 16 };
        const destination =
          ( to.endsWith( '/' ) ? to : to + '/' ) + entry.fileName;
        try {
          await fs.ensureDir( require( 'path' ).dirname( destination ) );
          const file = fs.createWriteStream( destination, options );
          file.on( 'error', reject );
          readStream.pipe( file );
          readStream.on( 'end', () => zipfile.readEntry() );
        } catch ( err ) {
          reject( err );
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