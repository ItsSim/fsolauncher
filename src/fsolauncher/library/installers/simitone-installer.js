const Modal = require( '../modal' ),
  download = require( '../download' )(),
  unzip = require( '../unzip' )();
const DOWNLOAD_URL_GITHUB =
  'https://beta.freeso.org/LauncherResourceCentral/Simitone';
/**
 * Downloads and installs Simitone.
 *
 * @class SimitoneInstaller
 */
class SimitoneInstaller {
  /**
   * Creates an instance of SimitoneInstaller.
   * @param {any} path Path to install FreeSO in.
   * @param {any} FSOLauncher
   * @memberof SimitoneInstaller
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
   * @param {any} Message
   * @param {any} Percentage
   * @memberof SimitoneInstaller
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
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
   * Begins the installation.
   *
   * @returns
   * @memberof SimitoneInstaller
   */
  install() {
    return this.step1()
      .then( () => this.step2() )
      .then( () => this.step3() )
      .then( () => this.step4() )
      .then( () => this.step5() )
      .then( () => this.step6() )
      .then( () => this.step7() )
      .then( () => this.end() )
      .catch( ErrorMessage => this.error( ErrorMessage ) );
  }
  /**
   * Obtains GitHub release data.
   *
   * @memberof SimitoneInstaller
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
   * @returns
   * @memberof SimitoneInstaller
   */
  step2() {
    return this.download();
  }
  /**
   * Create the installation directory.
   *
   * @returns
   * @memberof SimitoneInstaller
   */
  step3() {
    return this.setupDir( this.path );
  }
  /**
   * Extract files into installation directory.
   *
   * @returns
   * @memberof SimitoneInstaller
   */
  step4() {
    return this.extract();
  }
  /**
   * Create the FreeSO Registry Key.
   *
   * @returns
   * @memberof SimitoneInstaller
   */
  step5() {
    return require( '../registry' ).createFreeSOEntry( this.path, 'Simitone' );
  }
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
   *
   * @memberof SimitoneInstaller
   */
  end() {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
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
   * @param {any} ErrorMessage
   * @returns
   * @memberof SimitoneInstaller
   */
  error( ErrorMessage ) {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem( global.locale.FSO_FAILED_INSTALLATION.replace( /freeso/ig, 'Simitone' ), 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'Simitone' );
    Modal.showFailedInstall( 'Simitone', ErrorMessage );
    return Promise.reject( ErrorMessage );
  }
  /**
   * Downloads the distribution file.
   *
   * @returns
   * @memberof SimitoneInstaller
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
   * @returns
   * @memberof SimitoneInstaller
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
   *
   * @memberof SimitoneInstaller
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
   * Creates all the directories in a string.
   *
   * @param {any} dir
   * @returns
   * @memberof SimitoneInstaller
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
   * @param {any} after What to do after (callback).
   * @memberof SimitoneInstaller
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
   *
   * @memberof SimitoneInstaller
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
