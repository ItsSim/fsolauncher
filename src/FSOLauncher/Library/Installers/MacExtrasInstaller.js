const Modal = require( '../Modal' ),
  download = require( '../download' )(),
  unzip = require( '../unzip' )();

class MacExtrasInstaller {
  constructor( FSOLauncher, path ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempPath = `temp/macextras-${this.id}.zip`;

    this.dl = download( { from: 'http://freeso.org/stuff/macextras.zip', to: this.tempPath } );
  }

  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
      'FSOProgressItem' + this.id,
      'FreeSO MacExtras',
      'Installing in ' + this.path,
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
      .then( () => this.step3() )
      .then( () => this.end() )
      .catch( ErrorMessage => this.error( ErrorMessage ) );
  }

  step1() {
    return this.download();
  }

  step2() {
    return this.setupDir( this.path );
  }

  step3() {
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
    this.FSOLauncher.removeActiveTask( 'MacExtras' );
    Modal.showFailedInstall( 'FreeSO MacExtras', ErrorMessage );
    return Promise.reject( ErrorMessage );
  }

  end() {
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.View.stopProgressItem( 'FSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask( 'MacExtras' );
    Modal.showInstalled( 'FreeSO MacExtras' );
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

  async extract() {
    await unzip( { from: this.tempPath, to: this.path }, filename => {
      this.createProgressItem(
        global.locale.EXTRACTING_CLIENT_FILES + ' ' + filename,
        100
      );
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

module.exports = MacExtrasInstaller;
