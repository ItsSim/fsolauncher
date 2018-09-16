const EventEmitter = require("events");
const fs = require("fs");

/**
 * A single download worker.
 *
 * @class DownloadWorker
 * @extends {EventEmitter}
 */
class DownloadWorker extends EventEmitter {
  /**
   * Creates an instance of DownloadWorker.
   * @param {any} options
   * @memberof DownloadWorker
   */
  constructor(options) {
    super();
    this.options = options;
    this.retries = 0;
    this.status = "PENDING";
    this.totalSize = 0;
    this.downloadedSize = 0;
  }

  setStatus(status) {
    this.status = status;
  }
  getStatus() {
    return this.status;
  }

  /**
   * Returns the current worker progress.
   *
   * @returns
   * @memberof DownloadWorker
   */
  getProgress() {
    let progress = { filename: this.options.origin };
    progress.totalSize = this.totalSize;
    progress.downloadedSize = this.downloadedSize;
    progress.percentage = (
      (100 * this.downloadedSize) /
      this.totalSize
    ).toFixed(0);
    progress.mbDownloaded = (this.downloadedSize / 1048576).toFixed(2);
    progress.mbTotal = (this.totalSize / 1048576).toFixed(2);

    return progress;
  }

  /**
   * Initiates this worker.
   *
   * @memberof DownloadWorker
   */
  run() {
    let file = fs.createWriteStream(this.options.destination + ".tmp");

    let request = require("http")
      .get(this.options.origin, response => {
        this.setStatus("IN_PROGRESS");

        this.totalSize =
          this.totalSize === 0
            ? parseInt(response.headers["content-length"])
            : this.totalSize;

        console.log(response.headers);
        console.log(response.rawHeaders);

        response.pipe(file);

        response.on("data", chunk => {
          this.downloadedSize += chunk.length;
        });

        file.on("finish", () => {
          file.close(() => {
            if (response.headers["content-md5"]) {
              return require("md5-file")(
                this.options.destination + ".tmp",
                (err, hash) => {
                  let b = new Buffer(hash),
                    s = b.toString("base64");

                  if (err) {
                    return this.fail("File missing?");
                  }

                  if (s !== response.headers["content-md5"]) {
                    return this.fail("File was corrupted. Try again later.");
                  }

                  fs.rename(
                    this.options.destination + ".tmp",
                    this.options.destination,
                    () => {
                      this.setStatus("FINISHED");
                      this.emit("end");
                    }
                  );
                }
              );
            }

            fs.rename(
              this.options.destination + ".tmp",
              this.options.destination,
              () => {
                this.setStatus("FINISHED");
                this.emit("end");
              }
            );
          });
        });
      })
      .on("error", err => {
        file.close(() => {
          this.fail(err.message);
        });
      });

    request.setTimeout(30000, () => {
      file.close(() => {
        fs.unlink(this.options.destination + ".tmp", () => {
          this.setStatus("FAILED");

          return this.emit("error", "Timeout!");
        });
      });
    });
  }

  /**
   * Starts the worker. Checks if the file is already downloaded.
   * @deprecated Needs to actually check the MD5 hash.
   *
   * @memberof DownloadWorker
   */
  start() {
    fs.stat(this.options.destination, err => {
      if (err === null && !this.options.replace) {
        this.setStatus("FINISHED");
        this.emit("end");
      } else {
        this.run();
      }
    });
  }

  /**
   * Set this worker status to failed.
   *
   * @param {any} message The error message to display.
   * @memberof DownloadWorker
   */
  fail(message) {
    fs.unlink(this.options.destination + ".tmp", () => {
      if (this.retries < this.options.retries) {
        setTimeout(() => {
          this.retries++;
          this.start();
        }, 1750);
      } else {
        this.setStatus("FAILED");
        return this.emit("error", message);
      }
    });
  }
}

module.exports = DownloadWorker;
