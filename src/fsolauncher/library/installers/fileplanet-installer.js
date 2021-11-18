const Modal = require( '../modal' ),
  download = require( '../download' )(),
  unzip = require( '../unzip' )(),
  extract = require( '../cabinet' )();

// ORIGINAL: https://archive.org/download/Fileplanet_dd_042006/Fileplanet_dd_042006.tar/042006/TSO_Installer_v1.1239.1.0.zip'
// changed to beta.freeso.org redirect in case it needs to be changed
const DOWNLOAD_URL_FILEPLANET = 'https://beta.freeso.org/LauncherResourceCentral/TheSimsOnline';
//const MAX_RETRIES = 10;
const TEMP_PATH = `${global.appData}temp/FilePlanetInstaller/`;
const TEMP_FILE = 'FilePlanetTSOFiles.zip';
/**
 * Introduced 09/16/2018
 * Alternative TSO Installer pointing to archive.org FilePlanet.
 * Uses https://github.com/riperiperi/TSO-Version-Patcher to
 * patch it back to N&I.
 *
 * @class FilePlanetInstaller
 */
class FilePlanetInstaller {
  constructor( path, FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor( Date.now() / 1000 );
    this.path = path;
    this.haltProgress = false;
    this.tempFilePath = TEMP_PATH + TEMP_FILE;
    this.dl = download( {
      from: DOWNLOAD_URL_FILEPLANET,
      to: this.tempFilePath
    } );
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof FilePlanetInstaller
   */
  createProgressItem( Message, Percentage, Extraction ) {
    this.FSOLauncher.View.addProgressItem(
      'TSOProgressItem' + this.id,
      'The Sims Online (FilePlanet)',
      global.locale.INS_IN + ' ' + this.path,
      Message,
      Percentage,
      Extraction
    );
    this.FSOLauncher.setProgressBar(
      Percentage == 100 ? 2 : Percentage / 100
    );
  }
  /**
   * Executes every installation step in order.
   *
   * @returns
   * @memberof FilePlanetInstaller
   */
  install() {
    return this.step1()
      .then( () => this.step2() )
      .then( () => this.step3() )
      .then( unzipgc => this.step4( unzipgc ) )
      .then( () => this.step5() )
      .then( () => this.step6() )
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
    // extract zip
    return this.extractZip();
  }
  step4( unzipgc ) {
    // extract cabs
    return this.extractCabs( unzipgc );
  }
  step5() {
    // patch 1239toNI
    this.createProgressItem( 'Patching The Sims Online, please wait...', 100 );
    return new Promise( ( resolve, _reject ) => {
      const child = require( 'child_process' ).exec(
        'TSOVersionPatcherF.exe 1239toNI.tsop "' + this.path + '"',
        {
          cwd: 'bin/TSOVersionPatcherF'
        }
      );

      child.on( 'close', _code => {
        // make it not care if it fails. FreeSO can patch this on its own.
        // got reports that this was showing up as an error to some, making it impossible to finish
        // installing, when it doesn't even matter.
        //return code == 1
        //  ? reject('Error while patching The Sims Online.')
        //  : resolve();
        resolve();
      } );

      child.stderr.on( 'data', data => {
        console.log( 'stdout: ' + data );
      } );
    } );
  }
  step6() {
    // registry
    return require( '../registry' ).createMaxisEntry( this.path );
  }
  /**
   * Downloads the distribution file.
   *
   * @returns
   * @memberof FilePlanetInstaller
   */
  download() {
    return new Promise( ( resolve, reject ) => {
      this.dl.run();
      this.dl.events.on( 'error', err => {
        console.log( err );
      } );
      this.dl.events.on( 'end', _fileName => {
        this.haltProgress = true;
        if ( this.dl.hasFailed() ) {
          return reject( global.locale.FSO_NETWORK_ERROR );
        }
        resolve();
      } );

      this.updateDownloadProgress();
    } );
  }
  /**
   * Extracts the downloaded zip file that includes the cabinets.
   *
   * @returns
   * @memberof FilePlanetInstaller
   */
  extractZip() {
    this.createProgressItem( 'Extracting client files, please wait...', 100 );
    return unzip(
      {
        from: this.tempFilePath,
        to: `${TEMP_PATH}FilePlanetTSOFiles`
      },
      filename => {
        this.createProgressItem(
          global.locale.EXTRACTING_CLIENT_FILES + ' ' + filename,
          100
        );
      }
    );
  }
  /**
   * Extracts the MSFT cabinets.
   *
   * @returns
   * @memberof FilePlanetInstaller
   */
  extractCabs( unzipgc ) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise( async( resolve, reject ) => {
      let from = `${TEMP_PATH}FilePlanetTSOFiles/TSO_Installer_v1.1239.1.0/Data1.cab`;
      try {
        // support cabs in root
        if( !await require( 'fs-extra' ).exists( from ) ) {
          from = `${TEMP_PATH}FilePlanetTSOFiles/Data1.cab`;
        }
      } catch( err ) {
        console.log( err );
      }
      extract(
        {
          from,
          to: this.path,
          purge: true
        },
        d => this.updateExtractionProgress( d ),
        err => {
          unzipgc();
          this.dl.cleanup();
          if ( err ) return reject( `The Sims Online extraction failed: ${err}` );
          resolve();
        }
      );
    } );
  }
  /**
   * Prepare directories.
   *
   * @param {any} dir
   * @returns
   * @memberof TSOInstaller
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
   * Checks if TSO is already installed.
   *
   * @param {*} _after
   * @returns
   * @memberof FilePlanetInstaller
   */
  isInstalledInPath( _after ) {
    return new Promise( ( resolve, _reject ) => {
      require( 'fs-extra' ).stat( this.path + '/TSOClient/TSOClient.exe', err => {
        resolve( err === null );
      } );
    } );
  }
  /**
   * Installation ending tasks.
   *
   * @memberof FilePlanetInstaller
   */
  end() {
    // Successful installation
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.FSOLauncher.removeActiveTask( 'TSO' );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.View.stopProgressItem( 'TSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    if( !this.isFullInstall ) Modal.showInstalled( 'The Sims Online' );
  }
  /**
   * Installation error tasks.
   *
   * @param {*} ErrorMessage
   * @returns
   * @memberof FilePlanetInstaller
   */
  error( ErrorMessage ) {
    // Failed installation
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, {
      mode: 'error'
    } );
    this.FSOLauncher.removeActiveTask( 'TSO' );
    this.haltProgress = true;
    this.createProgressItem( global.locale.TSO_FAILED_INSTALLATION, 100 );
    this.FSOLauncher.View.stopProgressItem( 'TSOProgressItem' + this.id );
    Modal.showFailedInstall( 'The Sims Online', ErrorMessage );
    return Promise.reject( ErrorMessage );
  }
  /**
   * Cabinet extraction progress.
   *
   * @param {*} d
   * @memberof FilePlanetInstaller
   */
  updateExtractionProgress( d ) {
    this.createProgressItem(
      `Extracting ${d.file} (${require( 'path' ).basename( d.current )})`,
      100
    );
  }
  /**
   * Update the download progress item.
   *
   * @memberof TSOInstaller
   */
  updateDownloadProgress() {
    setTimeout( () => {
      const mb = this.dl.getProgressMB();
      let p = ( ( mb / 1268 ) * 100 ).toFixed( 0 );
      if ( isNaN( p ) ) p = 0;
      if ( this.haltProgress ) return;
      this.createProgressItem(
        // Archive.org does not provide Content-Length so the MBs are hardcoded.
        `${global.locale.DL_CLIENT_FILES} ${mb} MB ${global.locale.X_OUT_OF_X} 1268 MB (${p}%)`,
        p
      );
      return this.updateDownloadProgress();
    }, 1 );
  }
}

module.exports = FilePlanetInstaller;
