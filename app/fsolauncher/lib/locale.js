const strings = require( '../../fsolauncher-ui/uitext.json' );
const locale = { current: {} };
const defaultLocaleCode = 'en';

function setLocale( code, moreStrings = {} ) {
  // Check if the selected locale exists, default to 'en' if not
  const baseLocale = Object.prototype.hasOwnProperty.call( strings, code ) ? strings[ code ] : strings[ defaultLocaleCode ];

  // This prioritizes moreStrings > selected locale > default English locale
  locale.current = Object.assign( {}, strings[ defaultLocaleCode ], baseLocale, moreStrings );
}

module.exports = { locale, setLocale };
