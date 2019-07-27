const Modal = require('../Modal');
const HttpDownload = require('../http-download');

class RemeshesInstaller {
  constructor(path, FSOLauncher) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor(Date.now() / 1000);
    this.path = path;
    this.haltProgress = false;

    const location = FSOLauncher.remeshInfo.location
      ? FSOLauncher.remeshInfo.location
      : 'http://beta.freeso.org/remeshes.docx';

    this.dl = new HttpDownload(
      location,
      'temp/remeshes.zip'
    );
  }

  createProgressItem(Message, Percentage) {
    this.FSOLauncher.View.addProgressItem(
      'FSOProgressItem' + this.id,
      'Remesh Pack Download',
      'Downloading from ' + this.FSOLauncher.remeshInfo.location,
      Message,
      Percentage
    );
  }

  install() {
    return this.step1()
      .then(() => this.step2())
      .then(() => this.step3())
      .then(() => this.end())
      .catch(ErrorMessage => this.error(ErrorMessage));
  }

  step1() {
    return this.download();
  }

  step2() {
    return this.setupDir(this.path);
  }

  step3() {
    return this.extract();
  }

  error(ErrorMessage) {
    this.haltProgress = true;
    this.createProgressItem(global.locale.FSO_FAILED_INSTALLATION, 100);
    this.FSOLauncher.View.stopProgressItem('FSOProgressItem' + this.id);
    this.FSOLauncher.removeActiveTask('RMS');
    Modal.showFailedInstall('Remesh Package', ErrorMessage);
    return Promise.reject(ErrorMessage);
  }

  end() {
    this.createProgressItem(global.locale.INSTALLATION_FINISHED, 100);
    this.FSOLauncher.View.stopProgressItem('FSOProgressItem' + this.id);
    this.FSOLauncher.updateInstalledPrograms();
    this.FSOLauncher.removeActiveTask('RMS');
    Modal.showInstalled('Remesh Package');
  }

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

  setupDir(dir) {
    return new Promise((resolve, reject) => {
      require('mkdirp')(dir, resolve);
    });
  }

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

  extract() {
    const unzipStream = require('node-unzip-2').Extract({
      path: this.path
    });

    this.createProgressItem(global.locale.EXTRACTING_CLIENT_FILES, 100);

    return new Promise((resolve, reject) => {
      require('fs')
        .createReadStream('temp/remeshes.zip')
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

  cleanup() {
    const fs = require('fs');
    fs.stat('temp/remeshes.zip', function(err, stats) {
      if (err) {
        return;
      }

      fs.unlink('temp/remeshes.zip', function(err) {
        if (err) return console.log(err);
      });
    });
  }
}

module.exports = RemeshesInstaller;
