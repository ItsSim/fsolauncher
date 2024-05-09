const download = require( '../download' );
const unzip = require( '../unzip' );
const { strFormat } = require( '../utils' );
const { resourceCentral, temp, appData, linuxLibPath } = require( '../../constants' );
const { locale } = require( '../locale' );
const fs = require ( 'fs-extra' );

/**
 * Installs macOS Extras on macOS systems.
 */
class MacExtrasInstaller {
  /**
   * @param {import('../../fsolauncher')} fsolauncher The FSOLauncher instance.
   * @param {string} path The path to the installation directory.
   * @param {string} parentComponent The name of the parent component.
   */
  constructor( fsolauncher, path, parentComponent = 'FreeSO' ) {
    this.fsolauncher = fsolauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.parentComponent = parentComponent;
    this.tempPath = strFormat( temp.MacExtras, this.id );
    this.dl = download( { from: resourceCentral.MacExtras, to: this.tempPath } );
  }

  /**
   * Create/Update the download progress item.
   *
   * @param {string} message    The message to display.
   * @param {number} percentage The percentage to display.
   */
  createProgressItem( message, percentage ) {
    const textPath = process.platform === 'win32' ? this.path : this.path.replace( appData + '/', '' );
    this.fsolauncher.IPC.addProgressItem(
      'FSOProgressItem' + this.id,
      `${this.parentComponent} MacExtras`,
      `${locale.current.INS_IN} ${textPath}`,
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
      await this.download();
      await this.setupDir();
      await this.extract();
      this.armPatch();
      this.end();
    } catch ( err ) {
      this.error( err );
      throw err; // Send it back to the caller.
    }
  }

  /**
   *  Replace MonoGame.Framework.dll.config on Arm Linux
   */
  armPatch() {
    if ( process.platform == 'linux' && process.arch.startsWith('arm') ) {
      // This file is relatively small so it's not really worth creating a new file just for it
      fs.writeFileSync( `${path}/MonoGame.Framework.dll.config`,
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<configuration>' +
        `  <dllmap dll="SDL2.dll" os="linux" target="${linuxLibPath}/libSDL2-2.0.so.0"/>` +
        `  <dllmap dll="soft_oal.dll" os="linux" target="${linuxLibPath}/libopenal.so.1"/>` +
        '</configuration>'
       );
    }
  }

  /**
   * When the installation errors out.
   *
   * @param {Error} _err The error object.
   */
  error( _err ) {
    this.dl.cleanup();
    this.haltProgress = true;
    this.createProgressItem( strFormat( locale.current.FSO_FAILED_INSTALLATION, 'macOS Extras' ), 100 );
    this.fsolauncher.IPC.stopProgressItem( 'FSOProgressItem' + this.id );
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
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  setupDir() {
    return new Promise( ( resolve, reject ) => {
      require( 'fs-extra' ).ensureDir( his.path, err => {
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
        locale.current.EXTRACTING_CLIENT_FILES + ' ' + filename,
        100
      );
    } );
  }

  /**
   * Deletes the downloaded artifacts file.
   */
  cleanup() {
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

module.exports = MacExtrasInstaller;
