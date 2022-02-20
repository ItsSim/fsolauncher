/**
 * Returns the path with backslashes converted to forward slashes.
 * 
 * @param {string} dir The path to convert.
 * @return {string} The converted path.
 */
function normalizePathSlashes( dir ) {
  return dir ? dir.replace( /\\/g, '/' ) : dir
}

/**
 * Formats a string with unlimited arguments.
 * 
 * @param {string} str The string to format.
 * @param {...any} args Values to replace.
 * @returns {string} The formatted string.
 */
function strFormat( str, ...args ) {
  return args.reduce( ( s, v ) => s.replace( '%s', v ), str );
}

module.exports = {
  normalizePathSlashes, strFormat 
};