const Modal = require( '../modal' );
const download = require( '../download' );
const sudo = require( 'sudo-prompt' );
const { strFormat, captureWithSentry } = require( '../utils' );

/**
 * Installs Mono on macOS systems.
 */
class MonoInstaller {
  /**
   * @param {import('../../fsolauncher')} FSOLauncher The launcher instance.
   */
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.haltProgress = false;
    this.tempPath = `${global.appData}temp/mono-${this.id}.pkg`;
    this.dl = download( { from: 'https://beta.freeso.org/LauncherResourceCentral/Mono', to: this.tempPath } );
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
      global.locale.INSTALLER_MONO_DESCR,
      global.locale.INS_DOWNLOADING_FROM + ' mono-project.com',
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
      return this.end();
    } catch ( errorMessage ) {
      captureWithSentry( errorMessage, { installer: 'mono' } );
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
   * Extract files PKG to the destination.
   *
   * @returns {Promise<void>} A promise that resolves when the files are extracted.
   */
  step2() {
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
    this.createProgressItem( strFormat( global.locale.FSO_FAILED_INSTALLATION, 'Mono' ), 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'Mono' );
    Modal.showFailedInstall( 'Mono', errorMessage );
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
    this.FSOLauncher.removeActiveTask( 'Mono' );
    if( !this.isFullInstall ) Modal.showInstalled( 'Mono' );
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
        if ( !this.haltProgress ) {
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
   * Extracts the PKG file.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    this.createProgressItem(
      global.locale.INS_MONO_DESCR_LONG, 100
    );
    return new Promise( ( resolve, reject ) => {
      // headless install
      sudo.exec( `installer -pkg ${global.appData.replace( / /g, '\\ ' )}temp/mono-${this.id}.pkg -target /`, {}, 
        ( err, stdout, stderr ) => {
          if( err ) return reject( err );
          console.log( 'Mono Installer:', stdout, stderr );
          resolve();
      } );
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

module.exports = MonoInstaller;
