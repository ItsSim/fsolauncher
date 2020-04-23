const Modal = require( '../Modal' ),
  download = require( '../download' )();
/**
 * Installs a launcher update. This class was introduced after having problems
 * with just downloading the .asar file and replacing it.
 * This way we can update binaries as well.
 *
 * @class UpdateInstaller
 */
class UpdateInstaller {
  /**
   * Creates an instance of UpdateInstaller.
   * @param {any} FSOLauncher
   * @memberof UpdateInstaller
   */
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;

    this.id = Math.floor( Date.now() / 1000 );
    this.haltProgress = false;
    this.dl = download( {
      from: 'http://beta.freeso.org/FreeSO Launcher Setup.exe',
      to: `${global.APPDATA}temp/installer.exe`
    } );
  }
  /**
   * Creates the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof UpdateInstaller
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
      'FSOUpdateProgressItem' + this.id,
      'FreeSO Launcher',
      'Downloading from ' + this.FSOLauncher.updateLocation,
      Message,
      Percentage
    );
    this.FSOLauncher.setProgressBar(
      Percentage == 100 ? 2 : Percentage / 100
    );
  }
  /**
   * Starts all the steps.
   *
   * @returns
   * @memberof UpdateInstaller
   */
  install() {
    return this.step1()
      .then( () => this.end() )
      .catch( ErrorMessage => this.error( ErrorMessage ) );
  }
  /**
   * Download the launcher installer.
   *
   * @returns
   * @memberof UpdateInstaller
   */
  step1() {
    return this.download();
  }
  /**
   * At the end of the installation.
   *
   * @memberof UpdateInstaller
   */
  end() {
    // run and close
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( 'Download finished. Setup will start...', 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOUpdateProgressItem' + this.id );

    setTimeout( () => {
      global.willQuit = true;
      // const notify = require("electron-notify");
      // notify.closeAll();
      this.FSOLauncher.Window.close();
    }, 3000 );

    this.execute();
  }
  /**
   * Error the installation out.
   *
   * @param {any} ErrorMessage
   * @returns
   * @memberof UpdateInstaller
   */
  error( ErrorMessage ) {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem(
      `Failed to download FreeSO Launcher. Try again later, or download from <a target="_blank" href="${this.FSOLauncher.updateLocation}">here</a>.`,
      100
    );
    this.FSOLauncher.View.stopProgressItem( 'FSOUpdateProgressItem' + this.id );
    Modal.showFailedUpdateDownload();
    return Promise.reject( ErrorMessage );
  }
  /**
   * Execute the installer.
   *
   * @memberof UpdateInstaller
   */
  execute() {
    require( 'child_process' ).exec( 'installer.exe', { cwd: 'temp' } );
  }
  /**
   * Download the installer.
   *
   * @returns
   * @memberof UpdateInstaller
   */
  download() {
    return new Promise( ( resolve, reject ) => {
      this.dl.run();
      this.dl.events.on( 'error', () => {} );
      this.dl.events.on( 'end', _fileName => {
        if ( this.dl.hasFailed() ) {
          return reject(
            'FreeSO Launcher installation files have failed to download. You can try again later or download it yourself at https://beta.freeso.org'
          );
        }
        resolve();
      } );
      this.updateDownloadProgress();
    } );
  }
  /**
   * Updates the download progress.
   *
   * @memberof UpdateInstaller
   */
  updateDownloadProgress() {
    setTimeout( () => {
      const p = this.dl.getProgress(),
        mb = this.dl.getProgressMB(),
        size = this.dl.getSizeMB();

      if ( p < 100 ) {
        if ( !this.haltProgress ) {
          this.createProgressItem(
            `Downloading installation files... ${mb} MB ${global.locale.X_OUT_OF_X} ${size} MB (${p}%)`,
            p
          );
        }

        this.updateDownloadProgress();
      }
    }, 1000 );
  }
  /**
   * Deletes the installer after updating.
   *
   * @memberof UpdateInstaller
   */
  cleanup() {
    const fs = require( 'fs-extra' );
    fs.stat( `${global.APPDATA}temp/installer.exe`, function( err, _stats ) {
      if ( err ) {
        return;
      }

      fs.unlink( `${global.APPDATA}temp/installer.exe`, function( err ) {
        if ( err ) return console.log( err );
      } );
    } );
  }
}

module.exports = UpdateInstaller;
