const Modal = require( '../Modal' ),
  download = require( '../download' )(),
  unzip = require( '../unzip' )(),
  sudo = require( 'sudo-prompt' );

class SDLInstaller {
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    //this.path = path;
    this.haltProgress = false;
    this.tempPath = `temp/sdl2-${this.id}.dmg`;
    // todo- change download URL to beta.freeso.org proxy
    this.dl = download( { from: 'https://www.libsdl.org/release/SDL2-2.0.12.dmg', to: this.tempPath } );
  }

  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
      'FSOProgressItem' + this.id,
      'Single DirectMedia Layer 2',
      'Downloading from libsdl.org',
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
    if(!this.isFullInstall) Modal.showInstalled( 'SDL2' );
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
      'Installing the SDL2 runtime on your system, please wait...', 100
    );
    return new Promise( ( resolve, reject ) => {
      // headless install
      let cmd = `hdiutil attach ./temp/sdl2-${this.id}.dmg && `; // mount SDL dmg
      cmd += `cp -R /Volumes/SDL2/SDL2.framework /Library/Frameworks && `; // move SDL2.framework to /Library/Frameworks
      cmd += `hdiutil unmount /Volumes/SDL2`; // unmount SDL dmg
      sudo.exec( cmd, {}, 
        (err, stdout, stderr) => {
          if( err ) return reject(err);
          console.log('SDL2 Installer:', stdout, stderr);
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
