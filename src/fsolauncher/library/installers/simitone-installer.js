const Modal = require( '../modal' );
const download = require( '../download' );
const unzip = require( '../unzip' );

const DOWNLOAD_URL_GITHUB =
  'https://beta.freeso.org/LauncherResourceCentral/Simitone';
  
/**
 * Downloads and installs Simitone.
 */
class SimitoneInstaller {
  /**
   * @param {string} path The path to the directory to create.
   * @param {import('../../fsolauncher')} FSOLauncher The FSOLauncher instance.
   */
  constructor( path, FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempPath = `${global.appData}temp/artifacts-simitone-${this.id}.zip`;
    this.dl = download( {
      from: DOWNLOAD_URL_GITHUB,
      to: this.tempPath
    } );
    this.simitoneVersion = '';
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {string} Message    The message to display.
   * @param {number} Percentage The percentage to display.
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.IPC.addProgressItem(
      'FSOProgressItem' + this.id,
      'Simitone Client ' + this.simitoneVersion,
      global.locale.INS_IN + ' ' + this.path,
      Message,
      Percentage
    );
    this.FSOLauncher.setProgressBar(
      Percentage == 100 ? 2 : Percentage / 100
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
      await this.step7();
      return this.end();
    } catch ( errorMessage ) {
      return await this.error( errorMessage );
    }
  }
  /**
   * Obtains GitHub release data.
   */
  async step1() {
    const simitoneReleaseData = await this.FSOLauncher.getSimitoneReleaseInfo();

    if ( simitoneReleaseData.tag_name !== undefined ) {
      this.simitoneVersion = simitoneReleaseData.tag_name;
    }

    return Promise.resolve();
  }
  /**
   * Download all the files.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step2() {
    return this.download();
  }
  /**
   * Create the installation directory.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  step3() {
    return this.setupDir( this.path );
  }
  /**
   * Extract files into installation directory.
   *
   * @returns {Promise<void>} A promise that resolves when the files are extracted.
   */
  step4() {
    return this.extract();
  }
  /**
   * Create the FreeSO Registry Key.
   *
   * @returns {Promise<void>} A promise that resolves when the registry key is created.
   */
  step5() {
    return require( '../registry' ).createFreeSOEntry( this.path, 'Simitone' );
  }
  /**
   * Downloads Mac-extras for Darwin.
   * 
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step6() {
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
  step7() {
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
    this.FSOLauncher.removeActiveTask( 'Simitone' );
    if ( this.simitoneVersion ) {
      this.FSOLauncher.setConfiguration( [
        'Game',
        'SimitoneVersion',
        this.simitoneVersion
      ] );
    }
    if( !this.isFullInstall ) Modal.showInstalled( 'Simitone' );
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
    this.createProgressItem( global.locale.FSO_FAILED_INSTALLATION.replace( /freeso/ig, 'Simitone' ), 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'Simitone' );
    Modal.showFailedInstall( 'Simitone', errorMessage );
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
   * Checks if Simitone is already installed in a given path.
   * 
   * @returns {Promise<boolean>} If Simitone is installed already.
   */
  isInstalledInPath() {
    return new Promise( ( resolve, _reject ) => {
      require( 'fs-extra' ).stat( this.path + '/Simitone.Windows.exe', err => {
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

module.exports = SimitoneInstaller;
