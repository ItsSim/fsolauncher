const ServoInstaller = require( './ServoInstaller' ),
  download = require( '../download' )();
/**
 * Installs FreeSO from GitHub Releases.
 *
 * @class GitHubInstaller
 */
class GitHubInstaller extends ServoInstaller {
  /**
   * Creates an instance of ServoInstaller.
   * @param {any} path Path to install FreeSO in.
   * @param {any} FSOLauncher
   * @memberof ServoInstaller
   */
  constructor( path, FSOLauncher ) {
    super( path, FSOLauncher );
    this.isGitHub = true;
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof GitHubInstaller
   */
  createProgressItem( Message, Percentage ) {
    this.FSOLauncher.View.addProgressItem(
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
   * Override step1 to include the GitHub release download.
   *
   * @returns
   * @memberof GitHubInstaller
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
   * @returns
   * @memberof GitHubInstaller
   */
  getFreeSOGitHubReleaseInfo() {
    return new Promise( ( resolve, reject ) => {
      const https = require( 'https' );
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
   * Obtain FreeSO release information from the API.
   *
   * @returns
   * @memberof GitHubInstaller
   */
  getFreeSOApiReleaseInfo() {
    return new Promise( ( resolve, reject ) => {
      const https = require( 'https' );
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
   * Use api.freeso.org first, fallback to GitHub.
   *
   * @returns
   * @memberof GitHubInstaller
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
}

module.exports = GitHubInstaller;
