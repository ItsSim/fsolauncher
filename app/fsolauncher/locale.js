const strings = require( '../fsolauncher-ui/uitext.json' );

const locale = { current: {} };

function setLocale( code, moreStrings = {} ) {
  locale.current = Object.prototype.hasOwnProperty.call( strings, code )
    ? strings[ code ]
    : strings.en;

  locale.current = Object.assign( strings.en, locale.current, moreStrings );
}

module.exports = { locale, setLocale };