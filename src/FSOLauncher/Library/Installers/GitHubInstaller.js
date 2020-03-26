const ServoInstaller = require('./ServoInstaller'),
  download = require('../download')();
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
  constructor(path, FSOLauncher) {
    super(path, FSOLauncher);
    this.isGitHub = true;
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof GitHubInstaller
   */
  createProgressItem(Message, Percentage) {
    this.FSOLauncher.View.addProgressItem(
      `FSOProgressItem${this.id}`,
      'FreeSO Client (from GitHub)',
      `Installing in ${this.path}`,
      Message, Percentage
    );
    this.FSOLauncher.Window.setProgressBar(
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

    const releaseInfo = await this.getFreeSOReleaseInfo();
    if(!Array.isArray(releaseInfo.assets)) {
      throw new Error("Invalid response when trying to obtain FreeSO release information from GitHub.");
    }
    for (let i = 0; i < releaseInfo.assets.length; i++) {
      const asset = releaseInfo.assets[i];
      if(asset["name"].indexOf("client") > -1) {
        // This asset contains the full client.
        this.dl = download({ from: asset["browser_download_url"], to: this.tempPath });
      }
    }

    if(!this.dl) {
      throw new Error("No release link found in GitHub release information.");
    }
    return this.download();
  }
  /**
   * Obtain FreeSO release information from GitHub.
   *
   * @returns
   * @memberof GitHubInstaller
   */
  getFreeSOReleaseInfo() {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const options = {
        host: 'api.github.com',
        path: '/repos/riperiperi/FreeSO/releases/latest',
        headers: { 'user-agent': 'node.js' }
      },
      request = https.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) { reject(e); }
        });
      });
      request.setTimeout(30000, () => {
        reject(
          'Timed out while trying to get GitHub release data for FreeSO.'
        );
      });
      request.on('error', e => { reject(e); });
      request.end();
    });
  }
}

module.exports = GitHubInstaller;
