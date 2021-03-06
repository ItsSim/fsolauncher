const Modal = require( '../modal' ),
  download = require( '../download' )(),
  sudo = require( 'sudo-prompt' );

class SDLInstaller {
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    //this.path = path;
    this.haltProgress = false;
    this.tempPath = `${global.APPDATA}temp/sdl2-${this.id}.dmg`;
    this.dl = download( { from: 'https://beta.freeso.org/LauncherResourceCentral/SDL', to: this.tempPath } );
  }

  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
      'FSOProgressItem' + this.id,
      'Single DirectMedia Layer 2',
      global.locale.INS_DOWNLOADING_FROM + ' libsdl.org',
      Message,
      Percentage
    );
    this.FSOLauncher.setProgressBar(
      Percentage == 100 ? 2 : Percentage / 100
    );
  }

  install() {
    return this.step1()
      .then( () => this.step2() )
      .then( () => this.end() )
      .catch( ErrorMessage => this.error( ErrorMessage ) );
  }

  step1() {
    return this.download();
  }

  step2() {
    return this.extract();
  }

  error( ErrorMessage ) {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.haltProgress = true;
    this.createProgressItem( global.locale.FSO_FAILED_INSTALLATION, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.removeActiveTask( 'SDL' );
    Modal.showFailedInstall( 'SDL2', ErrorMessage );
    return Promise.reject( ErrorMessage );
  }

  end() {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask( 'SDL' );
    if( !this.isFullInstall ) Modal.showInstalled( 'SDL2' );
  }

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

  setupDir( dir ) {
    return new Promise( ( resolve, reject ) => {
      require( 'fs-extra' ).ensureDir( dir, err => {
        if ( err ) return reject( err );
        resolve();
      } );
    } );
  }

  updateDownloadProgress() {
    setTimeout( () => {
      const p = this.dl.getProgress(),
        mb = this.dl.getProgressMB(),
        size = this.dl.getSizeMB();

      if ( p < 100 ) {
        if ( !this.haltProgress ) {
          this.createProgressItem(
            `${global.locale.DL_CLIENT_FILES} ${mb} MB ${global.locale.X_OUT_OF_X} ${size} MB (${p}%)`,
            p
          );
        }
        return this.updateDownloadProgress();
      }
    }, 1000 );
  }

  extract() {
    this.createProgressItem(
      global.locale.INS_SDL_DESCR_LONG, 100
    );
    return new Promise( ( resolve, reject ) => {
      // headless install
      let cmd = `hdiutil attach ${global.APPDATA.replace( / /g, '\\ ' )}temp/sdl2-${this.id}.dmg && `; // mount SDL dmg
      cmd += `sudo rm -rf /Library/Frameworks/SDL2.framework && `; // delete in case it exists to avoid errors
      cmd += `sudo cp -R /Volumes/SDL2/SDL2.framework /Library/Frameworks && `; // move SDL2.framework to /Library/Frameworks
      cmd += `hdiutil unmount /Volumes/SDL2`; // unmount SDL dmg
      sudo.exec( cmd, {}, 
        ( err, stdout, stderr ) => {
          if( err ) return reject( err );
          console.log( 'SDL2 Installer:', stdout, stderr );
          resolve();
      } );
    } );
  }

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

module.exports = SDLInstaller;
