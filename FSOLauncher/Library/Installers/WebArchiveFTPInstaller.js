const Modal = require("../Modal");

/**
 * Installs The Sims Online.
 * Using the FTP archive.org solution.
 *
 * @class TSOInstaller
 */
class WebArchiveFTPInstaller {
  constructor(path, FSOLauncher) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor(Date.now() / 1000);
    this.path = path;
    this.haltProgress = false;

    this.dl = new (require("../MultiDownload"))({
      // Only 10 cabs at a time.
      queue: 10,
      // Cabinet index to start at.
      offset: 1,
      // Total number of cabinets.
      max: 1114,
      // Cabinet parts format.
      origin:
        "http://web.archive.org/web/20151201095253if_/ftp://largedownloads.ea.com/pub/misc/tso/Data%.cab",
      // Where to temporarily save the cabs.
      destination: "temp/TSOCabArchives/",
    });
  }
  /**
   * Creates/modifies the installation's progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @param {any} Extraction
   * @memberof TSOInstaller
   */
  createProgressItem(Message, Percentage, Extraction) {
    this.FSOLauncher.View.addProgressItem(
      "TSOProgressItem" + this.id,
      "The Sims Online (Archive.org FTP)",
      "Installing in " + this.path,
      Message,
      Percentage,
      Extraction
    );
  }
  /**
   * Begins the installation.
   *
   * @returns
   * @memberof TSOInstaller
   */
  install() {
    return this.step1()
      .then(() => this.step2())
      .then(() => this.step3())
      .then(() => this.step4())
      .then(() => this.end())
      .catch(ErrorMessage => this.error(ErrorMessage));
  }

  /**
   * Download all the cabinet files.
   *
   * @returns
   * @memberof TSOInstaller
   */
  step1() {
    return this.download();
  }

  /**
   * Prepare the directory to extract to.
   *
   * @returns
   * @memberof TSOInstaller
   */
  step2() {
    return this.setupDir(this.path);
  }
  /**
   * Extract all the cabinets.
   *
   * @returns
   * @memberof TSOInstaller
   */
  step3() {
    return this.extract();
  }
  /**
   * Create the Maxis TSO Registry Key.
   *
   * @returns
   * @memberof TSOInstaller
   */
  step4() {
    return require("../Registry").createMaxisEntry(this.path);
  }

  isInstalledInPath(after) {
    return new Promise((resolve, reject) => {
      require("fs").stat(this.path + "\\TSOClient\\TSOClient.exe", err => {
        resolve(err === null);
      });
    });
  }
  /**
   * When installation ends.
   *
   * @memberof TSOInstaller
   */
  end() {
    // Successful installation
    this.FSOLauncher.removeActiveTask("TSO");
    this.createProgressItem(global.locale.INSTALLATION_FINISHED, 100);
    this.FSOLauncher.View.stopProgressItem("TSOProgressItem" + this.id);
    this.FSOLauncher.updateInstalledPrograms();
    Modal.showInstalled("The Sims Online");
  }
  /**
   * Error installation out.
   *
   * @param {any} ErrorMessage
   * @returns
   * @memberof TSOInstaller
   */
  error(ErrorMessage) {
    // Failed installation
    this.FSOLauncher.removeActiveTask("TSO");
    this.haltProgress = true;
    this.createProgressItem(global.locale.TSO_FAILED_INSTALLATION, 100);
    this.FSOLauncher.View.stopProgressItem("TSOProgressItem" + this.id);
    Modal.showFailedInstall("The Sims Online", ErrorMessage);
    return Promise.reject(ErrorMessage);
  }
  /**
   * Download all the cabs.
   *
   * @returns
   * @memberof TSOInstaller
   */
  download() {
    return new Promise((resolve, reject) => {
      this.dl
        .start(failedCabs => {
          return failedCabs === 0
            ? resolve()
            : reject(
                global.locale.NETWORK_ERR_DL_X +
                  " " +
                  failedCabs +
                  " " +
                  global.locale.X_FILES_OCURRED
              );
        })
        .then(() => {
          if (this.dl.getProgress().percentage < 100) {
            this.updateDownloadProgress();
          }
        });
    });
  }
  /**
   * Update the download progress item.
   *
   * @memberof TSOInstaller
   */
  updateDownloadProgress() {
    setTimeout(() => {
      let d = this.dl.getFinished().length;

      //if (p.percentage < 100) {
      if (!this.haltProgress) {
        this.createProgressItem(
          global.locale.DL_CLIENT_FILES +
            " " +
            d +
            " " +
            global.locale.X_FILES_OUT_OF_X +
            " 1114 (" +
            ((d / 1114) * 100).toFixed(0) +
            "%)",
          (d / 1114) * 100
        );

        this.updateDownloadProgress();
      }
      //}
    }, 1000);
  }
  /**
   * Extracts all the cabinet files.
   *
   * @requires CabinetReader by Rhys.
   * @returns
   * @memberof TSOInstaller
   */
  extract() {
    return new Promise((resolve, reject) => {
      new (require("../CabinetReader"))(
        "temp/TSOCabArchives/Data1.cab",
        this.path,
        d => this.updateExtractionProgress(d),
        errFile => {
          if (errFile) {
            return require("fs").unlink(errFile, () => {
              reject(
                "Extraction failed. " +
                  errFile +
                  " was corrupted and has been deleted. Try running the installer again."
              );
            });
          }
          resolve();
        }
      );
    });
  }
  /**
   * Prepare directories.
   *
   * @param {any} dir
   * @returns
   * @memberof TSOInstaller
   */
  setupDir(dir) {
    return new Promise((resolve, reject) => {
      require("mkdirp")(dir, resolve);
    });
  }

  updateExtractionProgress(d) {
    this.createProgressItem(
      "Extracting " + d.curFile + " " + "(Data" + d.read + ".cab)",
      (d.read / 1114) * 100
    );
  }
}

module.exports = WebArchiveFTPInstaller;
