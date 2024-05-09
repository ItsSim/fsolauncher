const download = require( '../download' );
const { strFormat, loadDependency } = require( '../utils' );
/** @type {import('sudo-prompt')} */
const sudo = loadDependency( 'sudo-prompt' );
const { resourceCentral, temp, isArch } = require( '../../constants' );
const { locale } = require( '../locale' );

/**
 * Installs SDL on macOS systems.
 */
class SDLInstaller {
  /**
   * @param {import('../../fsolauncher')} fsolauncher The FSO Launcher instance.
   */
  constructor( fsolauncher ) {
    this.fsolauncher = fsolauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.haltProgress = false;
    this.tempPath = strFormat( temp.SDL, this.id );
    this.dl = download( { from: resourceCentral.SDL, to: this.tempPath } );
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
      'Single DirectMedia Layer 2',
      locale.current.INS_DOWNLOADING_FROM + ' libsdl.org',
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
        await this.linuxInstall();
      }
      this.end();
    } catch ( err ) {
      this.error( err );
      throw err; // Send it back to the caller.
    }
  }

  linuxInstall() {
    this.createProgressItem( locale.current.INS_SDL_DESCR_LONG, 100 );
    return new Promise( ( resolve, reject ) => {
      // SDL2 installation command for Debian-based systems
      const command = isArch ? 'pacman -Syu --noconfirm sdl2' : 'apt-get update && apt-get install -y libsdl2-2.0-0';

      sudo.exec( command, ( error, stdout, stderr ) => {
        if ( error ) {
          console.error( 'error trying to install sdl2 on', isArch ? 'arch' : 'debian', error );
          return reject( error );
        }
        console.log( `stdout: ${stdout}` );
        console.error( `stderr: ${stderr}` );
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
    this.createProgressItem( strFormat( locale.current.FSO_FAILED_INSTALLATION, 'SDL2' ), 100 );
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
   * Extracts the DMG file.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
   */
  extract() {
    this.createProgressItem(
      locale.current.INS_SDL_DESCR_LONG, 100
    );
    return new Promise( ( resolve, reject ) => {
      // headless install
      let cmd = `hdiutil attach ${this.tempPath.replace( / /g, '\\ ' )} && `; // mount SDL dmg
      cmd += 'rm -rf /Library/Frameworks/SDL2.framework && '; // delete in case it exists to avoid errors
      cmd += 'cp -R /Volumes/SDL2/SDL2.framework /Library/Frameworks && '; // move SDL2.framework to /Library/Frameworks
      cmd += 'hdiutil unmount /Volumes/SDL2'; // unmount SDL dmg
      sudo.exec( cmd, {},
        ( err, stdout, stderr ) => {
          if ( err ) return reject( err );
          console.info( 'sdl2 output', { stdout, stderr } );
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

module.exports = SDLInstaller;
