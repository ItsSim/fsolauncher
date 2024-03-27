/**
 * Locale object with dynamic string properties.
 * @type {{ current: LocaleStrings }}
 */
const locale = { current: {} };
const strings = require( '../../fsolauncher-ui/uitext.json' );
const defaultLocaleCode = 'en';

/**
 * Sets the application's current locale and updates the `locale.current` with appropriate strings.
 *
 * @param {string} code - The locale code to set, e.g., 'en', 'es'.
 * @param {Object.<string, string>} [moreStrings={}] - Additional strings to merge into the locale.
 */
function setLocale( code, moreStrings = {} ) {
  // Check if the selected locale exists, default to 'en' if not
  const baseLocale = Object.prototype.hasOwnProperty.call( strings, code ) ? strings[ code ] : strings[ defaultLocaleCode ];

  // This prioritizes moreStrings > selected locale > default English locale
  locale.current = Object.assign( {}, strings[ defaultLocaleCode ], baseLocale, moreStrings );
}

module.exports = { locale, setLocale };
