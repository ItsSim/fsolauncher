const Modal = require( '../modal' );
const download = require( '../download' );
const unzip = require( '../unzip' );
const { strFormat, captureWithSentry } = require( '../utils' );

/**
 * Installs macOS Extras on macOS systems.
 */
class MacExtrasInstaller {
  /**
   * @param {import('../../fsolauncher')} FSOLauncher The FSOLauncher instance.
   * @param {string} path The path to the installation directory.
   * @param {string} parentComponent The name of the parent component.
   */
  constructor( FSOLauncher, path, parentComponent = 'FreeSO' ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.parentComponent = parentComponent;
    this.tempPath = `${global.appData}temp/macextras-${this.id}.zip`;

    this.dl = download( { from: 'https://beta.freeso.org/LauncherResourceCentral/MacExtras', to: this.tempPath } );
  }

  /**
   * Create/Update the download progress item.
   *
   * @param {string} message    The message to display.
   * @param {number} percentage The percentage to display.
   */
  createProgressItem( message, percentage ) {
    this.FSOLauncher.IPC.addProgressItem(
      'FSOProgressItem' + this.id,
      `${this.parentComponent} MacExtras`,
      global.locale.INS_IN + ' ' + this.path,
      message,
      percentage
    );
    this.FSOLauncher.setProgressBar(
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
      return this.end();
    } catch ( errorMessage ) {
      captureWithSentry( errorMessage, { installer: 'macextras' } );
      return await this.error( errorMessage );
    }
  }

  /**
   * Download all the files.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step1() {
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
   * When the installation errors out.
   *
   * @param {string} errorMessage The error message.
   * @returns {Promise<void>} A promise that resolves when the installation ends.
   */
  error( errorMessage ) {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem( strFormat( global.locale.FSO_FAILED_INSTALLATION, 'macOS Extras' ), 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'MacExtras' );
    Modal.showFailedInstall( 'FreeSO MacExtras', errorMessage );
    return Promise.reject( errorMessage );
  }

  /**
   * When the installation ends.
   */
  end() {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask( 'MacExtras' );
    Modal.showInstalled( 'FreeSO MacExtras' );
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
          return reject( global.locale.FSO_NETWORK_ERROR );
        }
        resolve();
      } );
      this.updateDownloadProgress();
    } );
  }

  /**
   * Creates all the directories and subfolders in a path.
   *
   * @param {string} dir The path to create.
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
            `${global.locale.DL_CLIENT_FILES} ${mb} MB ${global.locale.X_OUT_OF_X} ${size} MB (${p}%)`,
            p
          );
        }
        return this.updateDownloadProgress();
      }
    }, 250 );
  }

  /**
   * Extracts the zipped artifacts.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    return unzip( { 
      from: this.tempPath, 
      to: this.path, 
      cpperm: true 
    }, filename => {
      this.createProgressItem(
        global.locale.EXTRACTING_CLIENT_FILES + ' ' + filename,
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
      if ( err ) {
        return;
      }
      fs.unlink( this.tempPath, function( err ) {
        if ( err ) return console.log( err );
      } );
    } );
  }
}

module.exports = MacExtrasInstaller;
