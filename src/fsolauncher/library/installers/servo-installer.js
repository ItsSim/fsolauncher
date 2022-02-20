const Modal = require( '../modal' );
const download = require( '../download' );
const unzip = require( '../unzip' );
const { strFormat } = require( '../utils' );

//servo is no more, so ServoInstaller serves as a backup.
const DOWNLOAD_URL_SERVO =
  'https://beta.freeso.org/LauncherResourceCentral/FreeSO';

/**
 * Installs FreeSO from servo.freeso.org.
 */
class ServoInstaller {
  /**
   * @param {string} path The path to the installation directory.
   * @param {import('../../fsolauncher')} FSOLauncher The launcher instance.
   */
  constructor( path, FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempPath = `${global.appData}temp/artifacts-freeso-${this.id}.zip`;
    this.dl = download( { from: DOWNLOAD_URL_SERVO, to: this.tempPath } );
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {string} message    The message to display.
   * @param {number} percentage The percentage to display.
   */
  createProgressItem( message, percentage ) {
    this.FSOLauncher.IPC.addProgressItem(
      `FSOProgressItem${this.id}`,
      'FreeSO Client (Alternative Source)',
      `Installing in ${this.path}`,
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
      await this.step4();
      await this.step5();
      await this.step6();
      return this.end();
    } catch ( errorMessage ) {
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
   * Create the FreeSO Registry Key.
   *
   * @returns {Promise<void>} A promise that resolves when the key is created.
   */
  step4() {
    if( process.platform === "darwin" ) return Promise.resolve(); 
    return require( '../registry' ).createFreeSOEntry( this.path );
  }
  /**
   * Downloads Mac-extras for Darwin.
   * 
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step5() {
    if( process.platform === "darwin" ) {
      console.log( 'Darwin:', 'Downloading MacExtras' );
      this.dl = download( { 
        from: 'https://beta.freeso.org/LauncherResourceCentral/MacExtras', 
        to: `${global.appData}temp/macextras-${this.id}.zip` 
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
    if( process.platform === "darwin" ) {
      console.log( 'Darwin:', 'Extracting MacExtras' );
      return unzip( { 
        from: `${global.appData}temp/macextras-${this.id}.zip`, 
        to: this.path, 
        cpperm: true 
      }, filename => {
        this.createProgressItem(
          global.locale.INS_EXTRACTING_ME + ' ' + filename, 100
        );
      } );
    }
    return Promise.resolve();
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
    this.FSOLauncher.removeActiveTask( 'FSO' );
    if( !this.isFullInstall ) Modal.showInstalled( 'FreeSO' );
  }
  /**
   * When the installation errors out.
   *
   * @param {string} errorMessage The error message.
   * @returns {Promise<void>} A promise that resolves when the installation ends.
   */
  error( errorMessage ) {
    if( this.dl ) this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem( strFormat( global.locale.FSO_FAILED_INSTALLATION, 'FreeSO' ), 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'FSO' );
    Modal.showFailedInstall( 'FreeSO', errorMessage );
    console.log( errorMessage );
    return Promise.reject( errorMessage );
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
   * Extracts the zipped artifacts.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    return unzip( { from: this.tempPath, to: this.path }, filename => {
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
      if ( err ) return console.log( err );
      fs.unlink( this.tempPath, err => {
        if ( err ) return console.log( err );
      } );
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
}

module.exports = ServoInstaller;
