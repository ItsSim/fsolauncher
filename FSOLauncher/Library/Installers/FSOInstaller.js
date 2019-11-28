const Modal = require('../Modal');
const HttpDownload = require('../http-download');

const DOWNLOAD_URL_SERVO =
  'http://servo.freeso.org' +
  '/guestAuth' +
  '/repository' +
  '/download' +
  '/FreeSO_TsoClient' +
  '/.lastSuccessful' +
  '/client-<>.zip';

/**
 * Installs FreeSO.
 *
 * @class FSOInstaller
 */
class FSOInstaller {
  /**
   * Creates an instance of FSOInstaller.
   * @param {any} path Path to install FreeSO in.
   * @param {any} FSOLauncher
   * @memberof FSOInstaller
   */
  constructor(path, FSOLauncher) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor(Date.now() / 1000);
    this.path = path;
    this.haltProgress = false;
    this.tempPath = `temp/artifacts-freeso-${this.id}.zip`;
    this.dl = new HttpDownload(DOWNLOAD_URL_SERVO, this.tempPath);
  }
  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof FSOInstaller
   */
  createProgressItem(Message, Percentage) {
    this.FSOLauncher.View.addProgressItem(
      'FSOProgressItem' + this.id,
      'FreeSO Client',
      'Installing in ' + this.path,
      Message,
      Percentage
    );
  }

  /**
   * Begins the installation.
   *
   * @returns
   * @memberof FSOInstaller
   */
  install() {
    return (
      this.step1()
        .then(() => this.step2())
        .then(() => this.step3())
        .then(() => this.step4())
        //.then(() => this.step5())
        .then(() => this.end())
        .catch(ErrorMessage => this.error(ErrorMessage))
    );
  }

  /**
   * Download all the files.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step1() {
    return this.download();
  }

  /**
   * Create the installation directory.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step2() {
    return this.setupDir(this.path);
  }

  /**
   * Extract files into installation directory.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step3() {
    return this.extract();
  }

  /**
   * Create the FreeSO Registry Key.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step4() {
    return require('../Registry').createFreeSOEntry(this.path);
  }

  /**
   * Creates a FreeSO shortcut.
   * @deprecated Yeah, so people can nuke their game when they launch NOT as administrator. No, thanks.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step5() {
    return this.FSOLauncher.createShortcut(this.path);
  }

  /**
   * When the installation ends.
   *
   * @memberof FSOInstaller
   */
  end() {
    this.createProgressItem(global.locale.INSTALLATION_FINISHED, 100);
    this.FSOLauncher.View.stopProgressItem('FSOProgressItem' + this.id);
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask('FSO');
    Modal.showInstalled('FreeSO');
  }

  /**
   * When the installation errors out.
   *
   * @param {any} ErrorMessage
   * @returns
   * @memberof FSOInstaller
   */
  error(ErrorMessage) {
    this.haltProgress = true;
    this.createProgressItem(global.locale.FSO_FAILED_INSTALLATION, 100);
    this.FSOLauncher.View.stopProgressItem('FSOProgressItem' + this.id);
    this.FSOLauncher.removeActiveTask('FSO');
    Modal.showFailedInstall('FreeSO', ErrorMessage);
    return Promise.reject(ErrorMessage);
  }

  /**
   * Downloads the distribution file.
   *
   * @returns
   * @memberof FSOInstaller
   */
  download() {
    return new Promise((resolve, reject) => {
      this.dl.run();
      this.dl.on('error', () => {});
      this.dl.on('end', fileName => {
        if (this.dl.failed) {
          this.cleanup();
          return reject(global.locale.FSO_NETWORK_ERROR);
        }
        resolve();
      });
      this.updateDownloadProgress();
    });
  }

  /**
   * Extracts the zipped artifacts.
   * Always use unzip2 - unzip has some weird issues.
   *
   * @returns
   * @memberof FSOInstaller
   */
  extract() {
    const unzipStream = require('node-unzip-2').Extract({
      path: this.path
    });

    this.createProgressItem(global.locale.EXTRACTING_CLIENT_FILES, 100);

    return new Promise((resolve, reject) => {
      require('fs')
        .createReadStream(this.tempPath)
        .pipe(unzipStream)
        .on('entry', entry => {
          this.createProgressItem(
            global.locale.EXTRACTING_CLIENT_FILES + ' ' + entry.path,
            100
          );
        });

      unzipStream.on('error', err => {
        //this.cleanup();
        return reject(err);
      });

      unzipStream.on('close', err => {
        this.cleanup();
        return resolve();
      });
    });
  }
  /**
   * Deletes the downloaded artifacts file.
   *
   * @memberof FSOInstaller
   */
  cleanup() {
    const fs = require('fs');
    fs.stat(this.tempPath, (err, stats) => {
      if (err) return console.log(err);
      fs.unlink(this.tempPath, err => {
        if (err) return console.log(err);
      });
    });
  }
  /**
   * Creates all the directories in a string.
   *
   * @param {any} dir
   * @returns
   * @memberof FSOInstaller
   */
  setupDir(dir) {
    return new Promise((resolve, reject) => {
      require('mkdirp')(dir, function(err) {
        if(err) return reject(err);
        resolve();
      });
    });
  }
  /**
   * Creates a direct FreeSO shortcut.
   *
   * @returns
   * @memberof FSOInstaller
   */
  createShortcut() {
    return new Promise((resolve, reject) => {
      const ws = require('windows-shortcuts');

      ws.create(
        '%UserProfile%\\Desktop\\FreeSO.lnk',
        {
          target: this.path + '\\FreeSO.exe',
          workingDir: this.path,
          desc: 'Play FreeSO online',
          runStyle: ws.MAX
        },
        err => {
          return err ? reject(err) : resolve();
        }
      );
    });
  }
  /**
   * Checks if FreeSO is already installed in a given path.
   *
   * @param {any} after What to do after (callback).
   * @memberof FSOInstaller
   */
  isInstalledInPath() {
    return new Promise((resolve, reject) => {
      require('fs').stat(this.path + '\\FreeSO.exe', err => {
        resolve(err == null);
      });
    });
  }
  /**
   * Updates the progress item with the download progress.
   *
   * @memberof FSOInstaller
   */
  updateDownloadProgress() {
    setTimeout(() => {
      let p = this.dl.getProgress();
      let mb = this.dl.getProgressMB();
      let size = this.dl.getSizeMB();

      if (p < 100) {
        if (!this.haltProgress) {
          this.createProgressItem(
            global.locale.DL_CLIENT_FILES +
              ' ' +
              mb +
              ' MB ' +
              global.locale.X_OUT_OF_X +
              ' ' +
              size +
              ' MB (' +
              p +
              '%)',
            p
          );
        }

        return this.updateDownloadProgress();
      }
    }, 1000);
  }
}

module.exports = FSOInstaller;
