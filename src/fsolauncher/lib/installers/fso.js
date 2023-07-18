const { strFormat, captureWithSentry, getJSON } = require( '../utils' );
const download = require( '../download' ),
  unzip = require( '../unzip' );
const { temp, downloads } = require( '../../constants' );
const { locale } = require( '../../locale' );

/**
 * Installs FreeSO from GitHub Releases.
 */
class FSOInstaller {
  /**
   * @param {import('../../fsolauncher')} fsolauncher The FSOLauncher instance.
   * @param {string} path The path to install to.
   */
  constructor( fsolauncher, path ) {
    this.fsolauncher = fsolauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempPath = strFormat( temp.FSO, this.id );
    this.dl = download( { from: downloads.FSO, to: this.tempPath } );
  }

  /**
   * Create/Update the download progress item.
   *
   * @param {string} message    The message to display.
   * @param {number} percentage The percentage to display.
   */
  createProgressItem( message, percentage ) {
    this.fsolauncher.IPC.addProgressItem(
      `FSOProgressItem${this.id}`,
      'FreeSO Client (from GitHub)',
      `${locale.current.INS_IN} ${this.path}`,
      message,
      percentage
    );
    this.fsolauncher.setProgressBar(
      percentage == 100 ? 2 : percentage / 100
    );
  }

  /**
   * Executes all installation steps in order and captures any errors.
   *
   * @returns {Promise<void>} A promise that resolves when the installation ends.
   */
  async install() {
    try {
      await this.step1();
      await this.step2();
      await this.step3();
      await this.step4();
      await this.step5();
      await this.step6();
      this.end();
    } catch ( error ) {
      this.error( error );
      throw error; // Send it back to the caller.
    }
  }

  /**
   * Download all the files.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  async step1() {
    this.dl = null;
    this.createProgressItem( locale.current.INS_SOURCES, 0 );
    const from = await this.getZipUrl();
    if ( ! from ) {
      throw new Error( 'Could not obtain FreeSO release information...' );
    }
    this.dl = download( { from, to: this.tempPath } );

    return this.download();
  }

  /**
   * Create the installation directory.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  step2() {
    return this.setupDir( this.path );
  }

  /**
   * Extract files into installation directory.
   *
   * @returns {Promise<void>} A promise that resolves when the files are extracted.
   */
  step3() {
    return this.extract();
  }

  /**
   * Create the FreeSO Registry Key.
   *
   * @returns {Promise<void>} A promise that resolves when the key is created.
   */
  step4() {
    return require( '../registry' )
      .createGameEntry(
        this.fsolauncher.setConfiguration.bind( this.fsolauncher ),
        this.path
      );
  }

  /**
   * Downloads Mac-extras for Darwin.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step5() {
    if ( process.platform === 'darwin' ) {
      this.dl = download( {
        from: downloads.MacExtras,
        to: strFormat( temp.MacExtras, this.id )
      } );
      return this.download();
    }
    return Promise.resolve();
  }

  /**
   * Installs Mac-extras for Darwin.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is complete.
   */
  step6() {
    if ( process.platform === 'darwin' ) {
      return unzip( {
        from: strFormat( temp.MacExtras, this.id ),
        to: this.path,
        cpperm: true
      }, filename => {
        this.createProgressItem(
          locale.current.INS_EXTRACTING_ME + ' ' + filename, 100
        );
      } );
    }
    return Promise.resolve();
  }

  /**
   * Obtain FreeSO release information from GitHub.
   *
   * Used as a backup if the FreeSO API is down.
   *
   * @returns {Promise<object>} A promise that resolves with the release information.
   */
  getFreeSOGitHubReleaseInfo() {
    return getJSON( {
      url: 'https://api.github.com/repos/riperiperi/FreeSO/releases/latest',
      headers: { 'user-agent': 'node.js' }
    } );
  }

  /**
   * Obtain FreeSO release information from the FreeSO API.
   *
   * @returns {Promise<object>} A promise that resolves with the release information.
   */
  getFreeSOApiReleaseInfo() {
    return getJSON( {
      url: 'https://api.freeso.org/userapi/update/beta',
      headers: { 'user-agent': 'node.js' }
    } );
  }

  /**
   * Obtains the latest release zip either from api.freeso.org or GitHub directly.
   *
   * Use api.freeso.org first, fallback to GitHub.
   *
   * @returns {Promise<string>} A promise that resolves with the URL of the zip.
   */
  async getZipUrl() {
    let url;
    try {
      const apiReleaseInfo = await this.getFreeSOApiReleaseInfo();
      if ( ! Array.isArray( apiReleaseInfo ) || apiReleaseInfo.length == 0 ) throw new Error( 'Wrong response' );
      url = apiReleaseInfo[ 0 ].full_zip; // Latest version
    } catch ( err ) {
      captureWithSentry( err );
      console.error( 'failed getting api info', err );
    }

    if ( ! url ) {
      try {
        const githubReleaseInfo = await this.getFreeSOGitHubReleaseInfo();
        if ( ! Array.isArray( githubReleaseInfo.assets ) ) {
          throw new Error( 'Invalid response when trying to obtain FreeSO release information from GitHub.' );
        }
        for ( let i = 0; i < githubReleaseInfo.assets.length; i++ ) {
          const asset = githubReleaseInfo.assets[ i ];
          if ( asset[ 'name' ].indexOf( 'client' ) > -1 ) {
            // This asset contains the full client.
            url = asset[ 'browser_download_url' ];
          }
        }
      } catch ( err ) {
        captureWithSentry( err );
        console.error( 'failed getting github info', err );
      }
    }

    return url;
  }

  /**
   * When the installation ends.
   */
  end() {
    this.dl.cleanup();
    this.createProgressItem( locale.current.INSTALLATION_FINISHED, 100 );
    this.fsolauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
  }

  /**
   * When the installation errors out.
   *
   * @param {Error} _err The error object.
   */
  error( _err ) {
    if ( this.dl ) this.dl.cleanup();
    this.haltProgress = true;
    this.fsolauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.createProgressItem(
      strFormat( locale.current.FSO_FAILED_INSTALLATION, 'FreeSO' ), 100
    );
  }

  /**
   * Downloads the distribution file.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  download() {
    return new Promise( ( resolve, reject ) => {
      this.dl.run();
      this.dl.events.on( 'error', () => {} );
      this.dl.events.on( 'end', _fileName => {
        if ( this.dl.hasFailed() ) {
          return reject( locale.current.FSO_NETWORK_ERROR );
        }
        resolve();
      } );
      this.updateDownloadProgress();
    } );
  }

  /**
   * Extracts the zipped artifacts.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    return unzip( { from: this.tempPath, to: this.path }, filename => {
      this.createProgressItem(
        locale.current.EXTRACTING_CLIENT_FILES + ' ' + filename,
        100
      );
    } );
  }

  /**
   * Deletes the downloaded artifacts file.
   */
  cleanup() {
    const fs = require( 'fs-extra' );
    fs.stat( this.tempPath, ( err, _stats ) => {
      if ( err ) return console.error( err );
      fs.unlink( this.tempPath, err => {
        if ( err ) return console.error( err );
      } );
    } );
  }

  /**
   * Creates all the directories and subfolders in a path.
   *
   * @param {string} dir The path to create.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  setupDir( dir ) {
    return new Promise( ( resolve, reject ) => {
      require( 'fs-extra' ).ensureDir( dir, err => {
        if ( err ) return reject( err );
        resolve();
      } );
    } );
  }

  /**
   * Checks if FreeSO is already installed in a given path.
   *
   * @returns {Promise<boolean>} If FreeSO is installed already.
   */
  isInstalledInPath() {
    return new Promise( ( resolve, _reject ) => {
      require( 'fs-extra' ).stat( this.path + '/FreeSO.exe', err => {
        resolve( err == null );
      } );
    } );
  }

  /**
   * Updates the progress item with the download progress.
   */
  updateDownloadProgress() {
    setTimeout( () => {
      let p = this.dl.getProgress();
      const mb = this.dl.getProgressMB(),
        size = this.dl.getSizeMB();
      if ( isNaN( p ) ) p = 0;
      if ( p < 100 ) {
        if ( ! this.haltProgress ) {
          this.createProgressItem(
            `${locale.current.DL_CLIENT_FILES} ${mb} MB ${locale.current.X_OUT_OF_X} ${size} MB (${p}%)`,
            p
          );
        }
        return this.updateDownloadProgress();
      }
    }, 250 );
  }
}

module.exports = FSOInstaller;
