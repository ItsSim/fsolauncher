const Modal = require( '../modal' ),
  download = require( '../download' ),
  unzip = require( '../unzip' ),
  extract = require( '../cabinet' ),
  // eslint-disable-next-line no-unused-vars
  FSOLauncher = require( '../../fsolauncher' );

/**
 * ORIGINAL: https://archive.org/download/Fileplanet_dd_042006/Fileplanet_dd_042006.tar/042006/TSO_Installer_v1.1239.1.0.zip'
 * changed to beta.freeso.org redirect in case it needs to be changed.
 */
const DOWNLOAD_URL_FILEPLANET = 'https://beta.freeso.org/LauncherResourceCentral/TheSimsOnline';
const TEMP_PATH = `${global.appData}temp/FilePlanetInstaller/`;
const TEMP_FILE = 'FilePlanetTSOFiles.zip';

/**
 * Installs The Sims Online.
 */
class FilePlanetInstaller {
  /**
   * @param {string} path Path to install to.
   * @param {FSOLauncher} FSOLauncher The FSOLauncher instance.
   */
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
   * @param {string} Message    The message to display.
   * @param {number} Percentage The percentage to display.
   */
  createProgressItem( Message, Percentage, Extraction ) {
    this.FSOLauncher.IPC.addProgressItem(
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
   * Executes all installation steps in order and captures any errors.
   *
   * @returns {Promise<void>} A promise that resolves when the installation ends.
   */
  async install() {
    try {
      await this.step1();
      await this.step2();
      const unzipgc = await this.step3();
      await this.step4( unzipgc );
      await this.step5();
      await this.step6();
      return this.end();
    } catch ( ErrorMessage ) {
      return await this.error( ErrorMessage );
    }
  }
  /**
   * Download all the files.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  step1() {
    return this.download();
  }
  /**
   * Create the installation directory.
   *
   * @returns {Promise<void>} A promise that resolves when the directory is created.
   */
  step2() {
    return this.setupDir( this.path );
  }
  /**
   * Extract files into a temp directory.
   *
   * @returns {Promise<void>} A promise that resolves when the files are extracted.
   */
  step3() {
    // extract zip
    return this.extractZip();
  }
  /**
   * Extract cabinet files into the installation directory.
   *
   * @param {Functon} unzipgc The unzip cleaner callback.
   * @returns {Promise<void>} A promise that resolves when the files are extracted.
   */
  step4( unzipgc ) {
    return this.extractCabs( unzipgc );
  }
  /**
   * Patches the game back to New and Improved.
   * 
   * @returns {Promise<void>} A promise that resolves when the game is patched.
   */
  step5() {
    // Uses https://github.com/riperiperi/TSO-Version-Patcher to
    // patch it back to N&I.
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
  /**
   * Create the Simitone Registry Key.
   *
   * @returns {Promise<void>} A promise that resolves when the key is created.
   */
  step6() {
    // registry
    return require( '../registry' ).createMaxisEntry( this.path );
  }
  /**
   * Downloads the distribution file.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
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
   * Extracts the zipped artifacts.
   *
   * @returns {Promise<void>} A promise that resolves when the extraction is complete.
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
   * @returns {Promise<Function>} A promise that resolves when the extraction is complete.
   */
  async extractCabs( cleanUnzip ) {
    let from = `${TEMP_PATH}FilePlanetTSOFiles/TSO_Installer_v1.1239.1.0/Data1.cab`;
    try {
      // Support cabs in root
      if( !await require( 'fs-extra' ).exists( from ) ) {
        from = `${TEMP_PATH}FilePlanetTSOFiles/Data1.cab`;
      }
    } catch( err ) {
      console.log( err );
    }
    return new Promise( ( resolve, reject ) => {
      extract( { from, to: this.path, purge: true },
        cabInfo => this.updateExtractionProgress( cabInfo ),
        err => {
          cleanUnzip();
          this.dl.cleanup();
          if ( err ) return reject( `The Sims Online extraction failed: ${err}` );
          resolve();
        }
      );
    } );
  }
  /**
   * Creates all the directories and subfolders in a path.
   *
   * @param {string} dir The path to create.
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
   * Checks if The Sims Online is already installed in a given path.
   * 
   * @returns {Promise<boolean>} If FreeSO is installed already.
   */
  isInstalledInPath( _after ) {
    return new Promise( ( resolve, _reject ) => {
      require( 'fs-extra' ).stat( this.path + '/TSOClient/TSOClient.exe', err => {
        resolve( err === null );
      } );
    } );
  }
  /**
   * When the installation ends.
   */
  end() {
    // Successful installation
    this.dl.cleanup();
    this.FSOLauncher.setProgressBar( -1 );
    this.FSOLauncher.removeActiveTask( 'TSO' );
    this.createProgressItem( global.locale.INSTALLATION_FINISHED, 100 );
    this.FSOLauncher.IPC.stopProgressItem( 'TSOProgressItem' + this.id );
    this.FSOLauncher.updateInstalledPrograms();
    if( !this.isFullInstall ) Modal.showInstalled( 'The Sims Online' );
  }
  /**
   * When the installation errors out.
   *
   * @param {string} ErrorMessage The error message.
   * @returns {Promise<void>} A promise that resolves when the installation ends.
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
    this.FSOLauncher.IPC.stopProgressItem( 'TSOProgressItem' + this.id );
    Modal.showFailedInstall( 'The Sims Online', ErrorMessage );
    return Promise.reject( ErrorMessage );
  }
  /**
   * Displays the extraction progress for a given cabinet object.
   *
   * @param {object} cab The cabinet object.
   */
  updateExtractionProgress( cab ) {
    this.createProgressItem(
      `Extracting ${cab.file} (${require( 'path' ).basename( cab.current )})`,
      100
    );
  }
  /**
   * Updates the progress item with the download progress.
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
    }, 250 );
  }
}

module.exports = FilePlanetInstaller;
