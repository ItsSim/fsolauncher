const Modal = require( '../Modal' ),
  download = require( '../download' )(),
  unzip = require( '../unzip' )();
const DOWNLOAD_URL_SERVO =
  'http://servo.freeso.org' +
  '/guestAuth' +
  '/repository' +
  '/download' +
  '/FreeSO_TsoClient' +
  '/.lastSuccessful' +
  '/client-<>.zip';
/**
 * Installs FreeSO from servo.freeso.org.
 *
 * @class ServoInstaller
 */
class ServoInstaller {
  /**
   * Creates an instance of ServoInstaller.
   * @param {any} path Path to install FreeSO in.
   * @param {any} FSOLauncher
   * @memberof ServoInstaller
   */
  constructor( path, FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempPath = `temp/artifacts-freeso-${this.id}.zip`;
    this.dl = download( { from: DOWNLOAD_URL_SERVO, to: this.tempPath } );
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof ServoInstaller
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
      `FSOProgressItem${this.id}`,
      'FreeSO Client (from Servo)',
      `Installing in ${this.path}`,
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
   * @memberof ServoInstaller
   */
  install() {
    return (
      this.step1()
        .then( () => this.step2() )
        .then( () => this.step3() )
        .then( () => this.step4() )
        .then( () => this.step5() )
        .then( () => this.step6() )
        .then( () => this.end() )
        .catch( ErrorMessage => this.error( ErrorMessage ) )
    );
  }
  /**
   * Download all the files.
   *
   * @returns
   * @memberof ServoInstaller
   */
  step1() {
    return this.download();
  }
  /**
   * Create the installation directory.
   *
   * @returns
   * @memberof ServoInstaller
   */
  step2() {
    return this.setupDir( this.path );
  }
  /**
   * Extract files into installation directory.
   *
   * @returns
   * @memberof ServoInstaller
   */
  step3() {
    return this.extract();
  }
  /**
   * Create the FreeSO Registry Key.
   *
   * @returns
   * @memberof ServoInstaller
   */
  step4() {
    if( process.platform === "darwin" ) return Promise.resolve(); 
    return require( '../Registry' ).createFreeSOEntry( this.path );
  }
  step5() {
    if( process.platform === "darwin" ) {
      console.log('Darwin:', 'Downloading MacExtras');
      this.dl = download( { 
        from: 'http://freeso.org/stuff/macextras.zip', 
        to: `temp/macextras-${this.id}.zip` 
      } );
      return this.download();
    }
    return Promise.resolve();
  }
  async step6() {
    if( process.platform === "darwin" ) {
      console.log('Darwin:', 'Extracting MacExtras');
      await unzip( { from: `temp/macextras-${this.id}.zip`, to: this.path }, filename => {
        this.createProgressItem(
          'Extracting MacExtras... ' + filename, 100
        );
      } );
      return 1;
    }
    return 1;
  }
  /**
   * When the installation ends.
   *
   * @memberof ServoInstaller
   */
  end() {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask( 'FSO' );
    if(!this.isFullInstall) Modal.showInstalled( 'FreeSO' );
  }
  /**
   * When the installation errors out.
   *
   * @param {any} ErrorMessage
   * @returns
   * @memberof ServoInstaller
   */
  async error( ErrorMessage ) {
    if( this.dl ) this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem( global.locale.FSO_FAILED_INSTALLATION, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    
    if( this.isGitHub ) {
      // TODO move circular dependency to a factory, temporary solution
      const ServoInstaller = require( './ServoInstaller' );
      const altInstaller = new ServoInstaller( this.path, this.FSOLauncher );
      try {
        await altInstaller.install();
      } catch( e ) {
        console.log( 'A network error ocurred when downloading from alternative source after the primary download failed.', e );
      }
    } else {
      this.FSOLauncher.removeActiveTask( 'FSO' );
      Modal.showFailedInstall( 'FreeSO', ErrorMessage );
      console.log( ErrorMessage );
    } 
  }
  /**
   * Downloads the distribution file.
   *
   * @returns
   * @memberof ServoInstaller
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
   * @memberof ServoInstaller
   */
  async extract() {
    await unzip( { from: this.tempPath, to: this.path }, filename => {
      this.createProgressItem(
        global.locale.EXTRACTING_CLIENT_FILES + ' ' + filename,
        100
      );
    } );
  }
  /**
   * Deletes the downloaded artifacts file.
   *
   * @memberof ServoInstaller
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
   * @memberof ServoInstaller
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
   * @param {any} after What to do after (callback).
   * @memberof ServoInstaller
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
   *
   * @memberof ServoInstaller
   */
  updateDownloadProgress() {
    //console.log('updateDownloadProgress');
    setTimeout( () => {
      let p = this.dl.getProgress();
      const mb = this.dl.getProgressMB(),
        size = this.dl.getSizeMB();
      //console.log('Progress:', p);
      if ( isNaN( p ) ) p = 0;
      if ( p < 100 ) {
        if ( !this.haltProgress ) {
          //console.log(mb, size, p);
          this.createProgressItem(
            `${global.locale.DL_CLIENT_FILES} ${mb} MB ${global.locale.X_OUT_OF_X} ${size} MB (${p}%)`,
            p
          );
        }

        return this.updateDownloadProgress();
      }
    }, 1000 );
  }
}

module.exports = ServoInstaller;
