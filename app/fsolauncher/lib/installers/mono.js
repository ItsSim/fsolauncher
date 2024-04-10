const download = require( '../download' );
const { strFormat, loadDependency } = require( '../utils' );
/** @type {import('sudo-prompt')} */
const sudo = loadDependency( 'sudo-prompt' );
const { resourceCentral, temp, isArch } = require( '../../constants' );
const { locale } = require( '../locale' );

/**
 * Installs Mono on macOS systems.
 */
class MonoInstaller {
  /**
   * @param {import('../../fsolauncher')} fsolauncher The launcher instance.
   */
  constructor( fsolauncher ) {
    this.fsolauncher = fsolauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.haltProgress = false;
    this.tempPath = strFormat( temp.Mono, this.id );
    this.dl = download( { from: resourceCentral.Mono, to: this.tempPath } );
  }

  /**
   * Create/Update the download progress item.
   *
   * @param {string} message    The message to display.
   * @param {number} percentage The percentage to display.
   */
  createProgressItem( message, percentage ) {
    this.fsolauncher.IPC.addProgressItem(
      'FSOProgressItem' + this.id,
      locale.current.INSTALLER_MONO_DESCR,
      locale.current.INS_DOWNLOADING_FROM + ' mono-project.com',
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
      if ( process.platform === 'darwin' ) {
        await this.download();
        await this.extract();
      } else {
        if ( isArch ) {
          await this.pacmanInstall();
        } else {
          await this.aptInstall();
        }
      }
      this.end();
    } catch ( err ) {
      this.error( err );
      throw err; // Send it back to the caller.
    }
  }

  aptInstall() {
    this.createProgressItem( locale.current.INS_MONO_DESCR_LONG, 100 );
    return new Promise( ( resolve, reject ) => {
      const command = 'apt-get update && apt-get install -y mono-complete';
      sudo.exec( command, ( error, stdout, stderr ) => {
        if ( error ) {
          console.error( 'error trying to install mono-complete on debian', error );
          return reject( error );
        }
        console.info( stdout );
        console.error( stderr );
        resolve();
      } );
    } );
  }

  pacmanInstall() {
    this.createProgressItem( locale.current.INS_MONO_DESCR_LONG, 100 );
    return new Promise( ( resolve, reject ) => {
      const command = 'pacman -Syu --noconfirm mono';
      sudo.exec( command, ( error, stdout, stderr ) => {
        if ( error ) {
          console.error( 'error trying to install mono on arch', error );
          return reject( error );
        }
        console.info( stdout );
        console.error( stderr );
        resolve();
      } );
    } );
  }

  /**
   * When the installation errors out.
   *
   * @param {Error} _err The error object.
   */
  error( _err ) {
    this.dl.cleanup();
    this.haltProgress = true;
    this.createProgressItem( strFormat( locale.current.FSO_FAILED_INSTALLATION, 'Mono' ), 100 );
    this.fsolauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
  }

  /**
   * When the installation ends.
   */
  end() {
    this.dl.cleanup();
    this.fsolauncher.setProgressBar( -1 );
    this.createProgressItem( locale.current.INSTALLATION_FINISHED, 100 );
    this.fsolauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
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

  /**
   * Extracts the PKG file.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    this.createProgressItem(
      locale.current.INS_MONO_DESCR_LONG, 100
    );
    return new Promise( ( resolve, reject ) => {
      // headless install
      sudo.exec( `installer -pkg ${this.tempPath.replace( / /g, '\\ ' )} -target /`, {},
        ( err, stdout, stderr ) => {
          if ( err ) return reject( err );
          console.info( 'mono output', { stdout, stderr } );
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
        if ( err ) return console.error( err );
      } );
    } );
  }
}

module.exports = MonoInstaller;
