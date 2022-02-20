const { net } = require( 'electron' );
const { https } = require( 'follow-redirects' ).wrap( {
  http: net,
  https: net,
} );
const ServoInstaller = require( './servo-installer' ),
  download = require( '../download' ),
  { strFormat } = require( '../utils' );

/**
 * Installs FreeSO from GitHub Releases.
 */
class GitHubInstaller extends ServoInstaller {
  /**
   * @param {string} path The path to install to.
   * @param {import('../../fsolauncher')} FSOLauncher The FSOLauncher instance.
   */
  constructor( path, FSOLauncher ) {
    super( path, FSOLauncher );
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {string} Message    The message to display.
   * @param {number} Percentage The percentage to display.
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.IPC.addProgressItem(
      `FSOProgressItem${this.id}`,
      'FreeSO Client (from GitHub)',
      `${global.locale.INS_IN} ${this.path}`,
      Message, Percentage
    );
    this.FSOLauncher.setProgressBar(
      Percentage == 100 ? 2 : Percentage / 100
    );
  }
  /**
   * Download all the files.
   * 
   * Overrides step1() from ServoInstaller.
   *
   * @returns {Promise<void>} A promise that resolves when the download is complete.
   */
  async step1() {
    this.dl = null;

    this.createProgressItem( global.locale.INS_SOURCES, 0 );

    const from = await this.getZipUrl();
    if( !from ) {
      throw new Error( "Could not obtain FreeSO release information..." );
    }

    this.dl = download( { from, to: this.tempPath } );

    return this.download();
  }
  /**
   * Obtain FreeSO release information from GitHub.
   * 
   * Used as a backup if the FreeSO API is down.
   *
   * @returns {Promise<object>} A promise that resolves with the release information.
   */
  getFreeSOGitHubReleaseInfo() {
    return new Promise( ( resolve, reject ) => {

      const options = {
        host: 'api.github.com',
        path: '/repos/riperiperi/FreeSO/releases/latest',
        headers: { 'user-agent': 'node.js' }
      },
      request = https.request( options, res => {
        let data = '';
        res.on( 'data', chunk => { data += chunk; } );
        res.on( 'end', () => {
          try {
            resolve( JSON.parse( data ) );
          } catch ( e ) { reject( e ); }
        } );
      } );
      request.setTimeout( 30000, () => {
        reject(
          'Timed out while trying to get GitHub release data for FreeSO.'
        );
      } );
      request.on( 'error', e => { reject( e ); } );
      request.end();
    } );
  }
  /**
   * Obtain FreeSO release information from the FreeSO API.
   *
   * @returns {Promise<object>} A promise that resolves with the release information.
   */
  getFreeSOApiReleaseInfo() {
    return new Promise( ( resolve, reject ) => {
      const options = {
        host: 'api.freeso.org',
        path: '/userapi/update/beta',
        headers: { 'user-agent': 'node.js' }
      },
      request = https.request( options, res => {
        let data = '';
        res.on( 'data', chunk => { data += chunk; } );
        res.on( 'end', () => {
          try {
            resolve( JSON.parse( data ) );
          } catch ( e ) { reject( e ); }
        } );
      } );
      request.setTimeout( 30000, () => {
        reject(
          'Timed out while trying to get GitHub release data for FreeSO.'
        );
      } );
      request.on( 'error', e => { reject( e ); } );
      request.end();
    } );
  }
  /**
   * Obtains the latest release zip either from api.freeso.org or GitHub directly.
   * 
   * Use api.freeso.org first, fallback to GitHub.
   *
   * @returns {Promise<string>} A promise that resolves with the URL of the zip.
   */
  async getZipUrl() {
    let url;
    try {
      const apiReleaseInfo = await this.getFreeSOApiReleaseInfo();
      if( !Array.isArray( apiReleaseInfo ) || apiReleaseInfo.length == 0 ) throw new Error( "Wrong response" );
      url = apiReleaseInfo[0].full_zip; // Latest version
    } catch( err ) {
      console.log( 'Failed getting apiReleaseInfo', err );
    }
    
    if( !url ) {
      try {
        const githubReleaseInfo = await this.getFreeSOGitHubReleaseInfo();
        if( !Array.isArray( githubReleaseInfo.assets ) ) {
          throw new Error( "Invalid response when trying to obtain FreeSO release information from GitHub." );
        }
        for ( let i = 0; i < githubReleaseInfo.assets.length; i++ ) {
          const asset = githubReleaseInfo.assets[i];
          if( asset["name"].indexOf( "client" ) > -1 ) {
            // This asset contains the full client.
            url = asset["browser_download_url"];
          }
        }
      } catch( err ) {
        console.log( 'Failed getting githubReleaseInfo', err );
      }
    }

    return url;
  }
  /**
   * When the installation errors out.
   * 
   * Overrides error() from ServoInstaller.
   *
   * @param {string} errorMessage The error message.
   * @returns {Promise<void>} A promise that resolves when the backup
   *                          installer (ServoInstaller) finishes.
   */
  async error( errorMessage ) {
    if( this.dl ) this.dl.cleanup();
    this.FSOLauncher.setProgressBar( 1, { mode: 'error' } );
    this.haltProgress = true;
    this.createProgressItem( 
      strFormat( global.locale.FSO_FAILED_INSTALLATION, 'FreeSO' ), 100 
    );
    this.FSOLauncher.IPC.stopProgressItem( 
      'FSOProgressItem' + this.id 
    );
    require( '../modal' ).showFailedInstall( 'FreeSO', errorMessage );
    const secondaryInstaller = new ServoInstaller( this.path, this.FSOLauncher );
    await secondaryInstaller.install();
  }
}

module.exports = GitHubInstaller;
