const path = require( 'path' );
const fs = require( 'fs-extra' );

module.exports = () => {
  /**
   * @param {string} file
   */
  const fontb64 = file => {
    const data = fs.readFileSync(
      path.join( __dirname, './fsolauncher-ui/fonts', file ), { encoding: 'base64' }
    );
    return `data:font/${file.split( '.' )[ 1 ]};charset=utf-8;base64,${data}`;
  };

  return {
    MATERIAL_SYMBOLS: fontb64( 'MaterialSymbolsRounded.woff2' ),
    FREDOKA: fontb64( 'FredokaOne-Regular.ttf' ),
    BALSAMIQ: fontb64( 'BalsamiqSans-Bold.ttf' ),
    MUNGED_REGULAR: fontb64( 'hinted-Munged-otVXWjH6W8.ttf' ),
    MUNGED_BOLD: fontb64( 'hinted-Munged-embOpitJmj.ttf' )
  };
};