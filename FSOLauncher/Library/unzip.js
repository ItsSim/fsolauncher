const yauzl = require('yauzl'),
  path = require('path'),
  fs = require('fs-extra');
/**
 * makeUnzip factory
 *
 * @summary Makes a generic unzip using yauzl.
 *
 * @since 1.6.5
 */
module.exports = function makeUnzip() {
  /**
   * Extracts a zip file, recursively creates directories, once resolved
   * returns a cleanup function.
   *
   * @since 1.6.5
   */
  return ({ from, to }, onEntry = () => {}) =>
    new Promise((resolve, reject) => {
      /**
       * Empties the folder it extracted to.
       *
       * @since 1.6.5
       */
      const cleanup = () =>
        !['.', './'].includes(to)
          ? fs.remove(to)
          : Promise.reject('Cannot delete current directory.');
      /**
       * Handles a yauzl.Entry extraction.
       *
       * @param {yauzl.ZipFile} zipfile
       * @param {yauzl.Entry} entry
       *
       * @since 1.6.5
       */
      function handleEntry(zipfile, entry) {
        if (entry.fileName.endsWith('/')) return zipfile.readEntry();
        // Send an onEntry event with current filename.
        onEntry(entry.fileName);
        // Write the file.
        zipfile.openReadStream(entry, async function(err, readStream) {
          if (err) return reject(err);
          const destination =
            (to.endsWith('/') ? to : to + '/') + entry.fileName;
          try {
            await fs.ensureDir(path.dirname(destination));
            readStream.pipe(fs.createWriteStream(destination));
            readStream.on('end', () => zipfile.readEntry());
          } catch (e) {
            reject(e);
          }
        });
      }
      // Open zip file with yauzl.
      yauzl.open(from, { lazyEntries: true }, function(err, zipfile) {
        if (err) return reject(err);
        zipfile
          .on('entry', entry => handleEntry(zipfile, entry))
          .once('error', reject)
          .once('close', () => resolve(cleanup))
          .readEntry();
      });
    });
};
