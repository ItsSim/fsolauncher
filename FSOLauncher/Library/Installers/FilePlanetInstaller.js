const Modal = require("../Modal");
const HttpDownload = require("../http-download");

const DOWNLOAD_URL_FILEPLANET =
  'http://ia801903.us.archive.org' +
  '/tarview.php?tar=/33/items/Fileplanet_dd_042006' +
  '/Fileplanet_dd_042006.tar&file=042006/' +
  'TSO_Installer_v1.1239.1.0.zip'

const MAX_RETRIES = 10

const FILENAME = 'FilePlanetTSOFiles.zip'

/**
 * Introduced 09/16/2018
 * Alternative TSO Installer pointing to archive.org FilePlanet.
 * Uses https://github.com/riperiperi/TSO-Version-Patcher to
 * patch it back to N&I.
 *
 * @class AltTSOInstaller
 */
class FilePlanetInstaller {
  constructor(path, FSOLauncher) {
    this.FSOLauncher = FSOLauncher;
    this.id = Math.floor(Date.now() / 1000);
    this.path = path;
    this.haltProgress = false;

    this.dl = new HttpDownload( DOWNLOAD_URL_FILEPLANET, 'temp/' + FILENAME )
  }

  /**
   * Create/Update the download progress item.
   *
   * @param {any} Message
   * @param {any} Percentage
   * @memberof FSOInstaller
   */
  createProgressItem(Message, Percentage, Extraction) {
    this.FSOLauncher.View.addProgressItem(
      "TSOProgressItem" + this.id,
      "The Sims Online (FilePlanet)",
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
   * @memberof FSOInstaller
   */
  install() {
    return this.step1()
      .then(() => this.step2())
      .then(() => this.step3())
      .then(() => this.step4())
      .then(() => this.step5())
      .then(() => this.step6())
      .then(() => this.end())
      .catch(ErrorMessage => this.error(ErrorMessage));
  }

  /**
   * Download all the files.
   *
   * @returns
   * @memberof FSOInstaller
   */
  step1() {
    //console.log("step1");
    return this.download();
  }

  step2() {
    //console.log("step2");
    return this.setupDir(this.path);
  }

  step3() {
    // extract zip
    //console.log("step3");
    return this.extractZip();
  }

  step4() {
    // extract cabs
    return this.extractCabs();
  }

  step5() {
    // patch
    //console.log("step5");
    this.createProgressItem("Patching The Sims Online, please wait...", 100);
    return new Promise((resolve, reject) => {
      let child = require("child_process").exec(
        'TSOVersionPatcherF.exe 1239toNI.tsop "' + this.path + '"',
        {
          cwd: "bin/TSOVersionPatcherF",
        }
      );

      child.on("close", code => {
        return code == 1
          ? reject("Error while patching The Sims Online.")
          : resolve();
      });

      child.stderr.on("data", data => {
        console.log("stdout: " + data);
      });
    });
  }

  step6() {
    // registry
    //console.log("step6");
    return require("../Registry").createMaxisEntry(this.path);
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
      this.dl.on("error", () => {});
      this.dl.on("end", (fileName) => {
        this.haltProgress = true;

        if( this.dl.failed ) {
          if ( this.dl.retries <= MAX_RETRIES ) {
            return setTimeout( () => {
              this.dl.retry()
              this.haltProgress = false;
              this.updateDownloadProgress();
						}, 5000 )
          }
          this.cleanup();
          return reject(global.locale.FSO_NETWORK_ERROR);
        }

        resolve();
      });

      this.updateDownloadProgress();
    });
  }

  extractZip() {
    const unzipStream = require("node-unzip-2").Extract({
      path: "temp",
    });

    this.createProgressItem("Extracting client files, please wait...", 100);

    return new Promise((resolve, reject) => {
      require("fs")
        .createReadStream("temp/" + FILENAME)
        .pipe(unzipStream)
        .on("entry", entry => {
          this.createProgressItem(
            "Extracting client files, please wait... " + entry.path,
            100
          );
          entry.autodrain();
        });

      unzipStream.on("error", err => {
        //this.cleanup();
        return reject(err);
      });

      unzipStream.on("close", err => {
        this.cleanup();
        return resolve();
      });
    });
  }

  extractCabs() {
    return new Promise((resolve, reject) => {
      new (require("../CabinetReader"))(
        "temp/TSO_Installer_v1.1239.1.0/Data1.cab",
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

  cleanup() {
    const fs = require("fs");
    fs.stat("temp/" + FILENAME, function(err, stats) {
      if (err) {
        return;
      }

      fs.unlink("temp/" + FILENAME, function(err) {
        if (err) return console.log(err);
      });
    });

    fs.stat("temp/TSO_Installer_v1.1239.1.0", function(
      err,
      stats
    ) {
      if (err) {
        return;
      }
      fs.rmdir("temp/TSO_Installer_v1.1239.1.0", function(err) {
        if (err) return console.log(err);
      });
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

  isInstalledInPath(after) {
    return new Promise((resolve, reject) => {
      require("fs").stat(this.path + "\\TSOClient\\TSOClient.exe", err => {
        resolve(err === null);
      });
    });
  }

  end() {
    // Successful installation
    this.FSOLauncher.removeActiveTask("TSO");
    this.createProgressItem(global.locale.INSTALLATION_FINISHED, 100);
    this.FSOLauncher.View.stopProgressItem("TSOProgressItem" + this.id);
    this.FSOLauncher.updateInstalledPrograms();
    Modal.showInstalled("The Sims Online");
  }

  error(ErrorMessage) {
    // Failed installation
    this.FSOLauncher.removeActiveTask("TSO");
    this.haltProgress = true;
    this.createProgressItem(global.locale.TSO_FAILED_INSTALLATION, 100);
    this.FSOLauncher.View.stopProgressItem("TSOProgressItem" + this.id);
    Modal.showFailedInstall("The Sims Online", ErrorMessage);
    return Promise.reject(ErrorMessage);
  }

  updateExtractionProgress(d) {
    this.createProgressItem(
      "Extracting " + d.curFile + " " + "(Data" + d.read + ".cab)",
      100//(d.read / 1115) * 100
    );
  }

  /**
   * Update the download progress item.
   *
   * @memberof TSOInstaller
   */
  updateDownloadProgress() {
    //console.log("updateDownloadProgress");
    // Archive.org does not provide Content-Length
    setTimeout(() => {
      let mb = this.dl.getProgressMB();

      let p = ((mb/1268)*100).toFixed(0);

      if (!this.haltProgress) {
        this.createProgressItem(
          global.locale.DL_CLIENT_FILES +
            " " + mb + " MB out of 1268 MB (" + p + "%)", p
        );
      } else {
        return;
      }

      return this.updateDownloadProgress();
    }, 1000);
  }
}

module.exports = FilePlanetInstaller;
