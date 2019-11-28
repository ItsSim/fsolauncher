const EventEmitter = require('events'),
  http = require('follow-redirects').http,
  https = require('follow-redirects').https,
  fs = require('fs');

class HttpDownload extends EventEmitter {
  constructor(source, target) {
    super();
    this.target = target;
    this.source = source;
    this.retries = 0;
  }

  run() {
    this.failed = false;
    this.hasStarted = true;
    this.progress = 0;
    this.bytesRead = 0;
    this.length = 0;
    this.paused = false;
    this.error = null;
    this.fileStream = fs.createWriteStream(this.target);
    const httpmodule = this.source.startsWith('https') ? https : http;
    this.request = httpmodule.get(this.source, this.onDownload.bind(this));
    this.request.on('error', this.onError.bind(this));
  }

  onDownload(response) {
    if (!response) {
      return this.onError(new Error('Server did not return a response.'));
    }

    if (response.statusCode < 200 || response.statusCode > 299) {
      return this.onError(
        new Error('Received status code ' + response.statusCode)
      );
    }

    this.response = response;
    this.length = parseInt(response.headers['content-length'], 10);

    response.on('data', this.onData.bind(this));
    response.on('error', this.onError.bind(this));
    response.on('end', this.onEnd.bind(this));

    response.setTimeout(30000, () => {
      this.onError(new Error('Download timed out.'));
    });
  }

  onData(chunk) {
    this.fileStream.write(chunk);
    this.bytesRead += chunk.length;
    this.progress = this.getProgress();
    this.emit('progress', this.progress);
  }

  onError(error) {
    this.error = error;
    this.failed = true;
    this.request.abort();
    this.emit('error', error.message);
    this.onEnd();
  }

  onEnd() {
    if (!this.failed) {
      // Archive.org downloads fail silently when x-page-cache is MISS or EXPIRED.
      if (this.response.headers['x-page-cache']) {
        if (
          ['MISS', 'EXPIRED'].includes(
            this.response.headers['x-page-cache'].trim()
          )
        ) {
          this.emit(
            'internal-retry',
            'X-Page-Cache header present with value "MISS" or "EXPIRED". Retrying download in 5 seconds.'
          );
          return setTimeout(() => {
            this.retry();
          }, 5000);
        }
      }
      // Nonetheless, check if the filesize is 0 and retry.
      if (this.bytesRead == 0) {
        this.emit(
          'internal-retry',
          'Download size was zero. Retrying download in 5 seconds.'
        );
        return setTimeout(() => {
          this.retry();
        }, 5000);
      }
    }

    this.progress = 100;
    this.request.abort();
    this.fileStream.end();

    // if ( !this.failed ) {
    // 	this.saveToManifest( this.source, require( 'md5-file/promise' )( this.target ) )
    // }
    this.emit('end', this.target);
  }

  retry() {
    this.request.abort();
    this.fileStream.end();
    this.retries++;
    this.run();
  }

  abort() {
    if (this.request) {
      this.request.abort();
    }
  }

  pause() {
    if (this.response) {
      this.response.pause();
      this.paused = true;
    }
  }

  resume() {
    if (this.paused) {
      this.response.resume();
    }
  }

  getProgress() {
    return parseInt(((100.0 * this.bytesRead) / this.length).toFixed(0));
  }

  getProgressMB() {
    return (this.bytesRead / 1048576).toFixed(0);
  }

  getSizeMB() {
    return (this.length / 1048576).toFixed(0);
  }

  // saveToManifest( source, promise ) {
  // 	promise.then( hash => {
  // 		global.manifest.push( [source, hash] )
  // 	} )
  // }
}

module.exports = HttpDownload;
