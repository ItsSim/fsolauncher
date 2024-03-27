const path = require( 'path' );
const fs = require( 'fs-extra' );

/**
 * @param {string} file
 */
function fontb64( file ) {
  const data = fs.readFileSync(
    path.join( __dirname, './fsolauncher-ui/fonts', file ), { encoding: 'base64' }
  );
  return `data:font/${file.split( '.' )[ 1 ]};charset=utf-8;base64,${data}`;
}

module.exports = {
  MATERIAL_SYMBOLS: fontb64( 'material_symbols.woff2' ),
  FREDOKA: fontb64( 'fredoka.ttf' ),
  BALSAMIQ: fontb64( 'balsamiq.ttf' ),
  MUNGED_REGULAR: fontb64( 'munged_regular.ttf' ),
  MUNGED_BOLD: fontb64( 'munged_bold.ttf' )
};