/* eslint-disable require-atomic-updates */
const inflate = require( "deflate-js" ).inflate,
  fs = require( "fs-extra" ),
  path = require( "path" );
/**
 * Extracts cabinets to a destination.
 *
 * @param {string} from The source cab.
 * @param {string} to   The extraction dir.
 */
return function extract( { from, to, purge = true },
  onProgress = () => {},
  onEnd = () => {}
) {
  const _dir = from.substring( 0, from.lastIndexOf( "/" ) + 1 );
  const _ucp = [];

  let _fileBuffer = [],
    _fileIndex = 0,
    _fileOffset = 0,
    _dataLeftToFill = 0,
    _prevData = null,
    _continued = false,
    _dc = [],
    _uncompressed = null,
    _cabsRead = 0;
  /**
   * Uses Zlib.js to inflate (decompress).
   * 
   * @param {any} data The data to inflate.
   * @param {any} _uncompSize The uncompressed size.
   */
  const _MSZipDecomp = ( data, _uncompSize ) => {
    if ( !( data[0] === 0x43 && data[1] === 0x4b ) ) console.log( "MSZIP fail" );
    const temp = inflate( data.subarray( 2 ) );
    const view = new Uint8Array( new ArrayBuffer( temp.length ) );
    view.set( temp );
    return view;
  };
  /**
   * Extracts files from a cabinet recursively.
   * Once it reaches the end, continues to the next cabinet.
   *
   * @param {object} cab The cab metadata.
   * @param {ArrayBuffer} data The cab data to extract.
   */
  const _extractNextFile = async ( cab, data ) => {
    const file = cab.files[_fileIndex];
    onProgress( { read: _cabsRead, current: cab.name, file: file.name } );
    const ofi = _fileIndex;
    _fileIndex = ( _fileIndex + 1 ) % cab.fileN;
    let folder = file.iFolder;
    if ( folder === 0xfffd || folder === 0xffff ) folder = 0;
    else if ( folder === 0xfffe ) folder = cab.folderN - 1;
    const chunks = cab.folders[folder].chunks;

    if ( !( file.iFolder === 0xfffd || file.iFolder === 0xffff ) || ofi !== 0 ) {
      _fileOffset = 0;
      _fileBuffer = new ArrayBuffer( file.uSize );
      _dataLeftToFill = file.uSize;

      if ( file.uOff < _ucp[folder] ) {
        const pos = _uncompressed.length - ( _ucp[folder] - file.uOff );
        const toCopy = Math.min( _ucp[folder] - file.uOff, _dataLeftToFill );
        new Uint8Array( _fileBuffer, _fileOffset, toCopy ).set(
          _uncompressed.subarray( pos, pos + toCopy )
        );
        _fileOffset += toCopy;

        _dataLeftToFill -= toCopy;
      } else if ( file.uOff > _ucp[folder] ) {
        throw "Not implemented.";
      }
    } else {
      const chunk = chunks[0];
      const view = new Uint8Array( data, chunk.offset, chunk.cBytes );
      const comb = new Uint8Array( view.length + _prevData.length );
      comb.set( _prevData );
      comb.subarray( _prevData.length ).set( view );
      _uncompressed = await _MSZipDecomp( comb, chunk.ucBytes );
      const toCopy = Math.min( _uncompressed.length, _dataLeftToFill );
      new Uint8Array( _fileBuffer, _fileOffset, toCopy ).set(
        _uncompressed.subarray( 0, toCopy )
      );
      _ucp[folder] += _uncompressed.length;
      _fileOffset += toCopy;
      _dataLeftToFill -= toCopy;
      _dc[folder] = 1;
    }

    while ( _dc[folder] < chunks.length && _dataLeftToFill !== 0 ) {
      const chunk = chunks[_dc[folder]++];
      const view = new Uint8Array( data, chunk.offset, chunk.cBytes );
      if ( chunk.ucBytes !== 0 ) {
        _uncompressed = await _MSZipDecomp( view, chunk.ucBytes );
        const toCopy = Math.min( _uncompressed.length, _dataLeftToFill );
        new Uint8Array( _fileBuffer, _fileOffset, toCopy ).set(
          _uncompressed.subarray( 0, toCopy )
        );
        _ucp[folder] += _uncompressed.length;
        _fileOffset += toCopy;
        _dataLeftToFill -= toCopy;
      } else {
        _prevData = view;
        _continued = true;
        _ucp[0] = _ucp[folder];
        purge && await fs.unlink( cab.name );
        return await _readCabinet( _dir + cab.nextCab );
      }
    }

    if ( _dataLeftToFill === 0 ) {
      await fs.ensureDir( path.join( to, path.dirname( file.name ) ) );
      await fs.writeFile( to + "/" + file.name, Buffer.from( _fileBuffer ) );

      if ( _fileIndex !== 0 ) {
        await _extractNextFile( cab, data );
      } else {
        if ( cab.nextCab ) {
          _continued = false;
          await _readCabinet( _dir + cab.nextCab );
        } else {
          purge && await fs.unlink( cab.name );
          onEnd();
        }
      }
    } else {
      _continued = false;
      await _readCabinet( _dir + cab.nextCab );
    }
  };
  /**
   * Reads a cabinet file, requests extraction for files contained in it.
   * 
   * @param {string} file The file name to read.
   */
  const _readCabinet = async file => {
    _cabsRead++;
    _fileIndex = 0;
    _dc = [];

    const cab = { name: file };

    let read = 0;
    let view = null;
    let data = null;

    try {
      data = ( await fs.readFile( file ) ).buffer;
      view = new DataView( data );
      read += 4;
      cab.reserved1   = view.getUint32( read, true ); read += 4;
      cab.size        = view.getUint32( read, true ); read += 4;
      cab.reserved2   = view.getUint32( read, true ); read += 4;
      cab.offsetFiles = view.getUint32( read, true ); read += 4;
      cab.reserved3   = view.getUint32( read, true ); read += 4;
      cab.verMajor    = view.getUint8( read++ );
      cab.verMinor    = view.getUint8( read++ );
      cab.folderN     = view.getUint16( read, true ); read += 2;
      cab.fileN       = view.getUint16( read, true ); read += 2;
      cab.flags       = view.getUint16( read, true ); read += 2;
      cab.setID       = view.getUint16( read, true ); read += 2;
      cab.iCabinet    = view.getUint16( read, true ); read += 2;

      if ( cab.flags & 0x0004 ) {
        cab.cabResBytes  = view.getUint16( read, true ); read += 2;
        cab.folResBytes  = view.getUint8( read++ );
        cab.dataResBytes = view.getUint8( read++ );
        let string = "";
        for ( let i = 0; i < cab.cabResBytes; i++ ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        cab.cabReserve = string;
      }
      if ( cab.flags & 0x0001 ) {
        let string = "";
        while ( view.getUint8( read ) !== 0 ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        cab.prevCab = string; read++;
        string = "";
        while ( view.getUint8( read ) !== 0 ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        cab.prevDisk = string; read++;
      }
      if ( cab.flags & 0x0002 ) {
        let string = "";
        while ( view.getUint8( read ) !== 0 ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        cab.nextCab = string; read++;
        string = "";
        while ( view.getUint8( read ) !== 0 ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        cab.nextDisk = string; read++;
      }
      cab.folders = [];
      for ( let i = 0; i < cab.folderN; i++ ) {
        if ( !_continued || i !== 0 ) _ucp[i] = 0;
        _dc[i] = 0;
        const f = {};
        f.cfOffset = view.getUint32( read, true ); read += 4;
        f.cfBlocks = view.getUint16( read, true ); read += 2;
        f.typeCompress = view.getUint16( read, true ); read += 2;
        if ( cab.flags & 0x0004 ) {
          let string = "";
          for ( let i = 0; i < cab.folResBytes; i++ ) {
            string += String.fromCharCode( view.getUint8( read++ ) );
          }
          cab.folReserve = string;
        }
        cab.folders.push( f );
        const tempread = read;
        read = f.cfOffset;
        f.chunks = [];
        const uncompData = [];
        const totalBytes = 0;
        for ( let j = 0; j < f.cfBlocks; j++ ) {
          const c = {}; 
          read += 4;
          c.cBytes  = view.getUint16( read, true ); read += 2;
          c.ucBytes = view.getUint16( read, true ); read += 2;
          c.offset  = read; read += c.cBytes;
          f.chunks.push( c );
        }
        const buf = new ArrayBuffer( totalBytes );
        const offset = 0;
        for ( let j = 0; j < uncompData.length; j++ ) {
          const temp = new Uint8Array( buf, offset, uncompData[j].length );
          temp.set( uncompData[j] );
        }
        f.uncompData = new Uint8Array( buf );
        read = tempread;
      }
      read = cab.offsetFiles;
      cab.files = [];
      for ( let i = 0; i < cab.fileN; i++ ) {
        const f = {};
        f.uSize   = view.getUint32( read, true ); read += 4;
        f.uOff    = view.getUint32( read, true ); read += 4;
        f.iFolder = view.getUint16( read, true ); read += 2;
        read += 6;
        let string = "";
        while ( view.getUint8( read ) !== 0 ) {
          string += String.fromCharCode( view.getUint8( read++ ) );
        }
        read++;
        f.name = string;
        f.name = f.name.replace( /\\/g, "/" );
        cab.files.push( f );
      }
      await _extractNextFile( cab, data );
    } catch ( err ) {
      onEnd( err );
    }
  }; _readCabinet( from );
};