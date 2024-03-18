const strings = require( '../fsolauncher-ui/uitext.json' );
const { deepClone } = require( '../fsolauncher/lib/utils' );
const locale = { current: {} };

function setLocale( code, moreStrings = {} ) {
  locale.current = Object.prototype.hasOwnProperty.call( strings, code )
    ? strings[ code ]
    : strings.en;

  locale.current = Object.assign( deepClone( strings.en ), deepClone( locale.current ), deepClone( moreStrings ) );
}

module.exports = { locale, setLocale };