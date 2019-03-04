const Download = require('./Download');

/**
 * Download a sequence of files, usually divided in parts.
 * For example: zip parts or cabinet files.
 * 
 * @class MultiDownload
 * @extends {Download}
 */
class MultiDownload extends Download
{
	/**
	 * Creates an instance of MultiDownload.
	 * @param {any} options 
	 * @memberof MultiDownload
	 */
	constructor(options)
	{
		super();

		this.queue = options.queue;
		this.offset = options.offset;
		this.max = options.max;
		this.origin = options.origin;
		this.destination = options.destination;

		this.batches = options.max / options.queue;

		this.on('multiPartEnd', multiPartId =>
		{
			if(this.batchIsDone())
			{
				if(this.offset <= this.max && this.getFailed().length < this.queue)
					this.downloadNextBatch();
				else {
					this.onEnd(this.getFailed().length)
				}
			}
		})
	}

	/**
	 * Determines if a batch has finished downloading.
	 * 
	 * @returns 
	 * @memberof MultiDownload
	 */
	batchIsDone()
	{
		let difference = this.max-this.offset;

		let batchLength = (
			difference < this.queue ? difference + 1 : this.queue
		);

		let downloadCount = 0;

		for (let i = this.offset; i < (this.offset + batchLength); i++)
		{
			if(["FINISHED", "FAILED"].indexOf(this.downloads[i-1].getStatus()) > -1)
				downloadCount++
		}

		if(downloadCount===batchLength)
		{
			this.offset += batchLength;
			return true
		}
		return false
	}

	/**
	 * Registers all the downloads that need to be run.
	 * 
	 * @memberof MultiDownload
	 */
	registerDownloads()
	{
		for (let i = 1; i <= this.max; i++)
		{
			this.add({
				origin: this.origin.replace('%', i),
				destination: this.destination,
				multiPartId: i
			})
		}
	}

	/**
	 * Starts all the registered downloads. Reads from temp/TSOCabArchives.
	 * It also deletes the file after extraction to save space.
	 * 
	 * @param {any} onEnd Callback after finishing.
	 * @returns 
	 * @memberof MultiDownload
	 */
	start(onEnd)
	{
		if(!this.onEnd) this.onEnd = onEnd;

		return new Promise((resolve, reject) =>
		{
            const fs = require('fs');

            fs.readdir('temp/TSOCabArchives', (err, files) =>
            {
                files.forEach(file =>
                {
                    if(file.indexOf('.tmp') > -1) {
                        fs.unlinkSync('temp/TSOCabArchives/' + file)
                    }
                });

                this.registerDownloads();
                this.downloadNextBatch();

                return resolve()
            });
		})
	}

	/**
	 * Initiates the next batch download.
	 * 
	 * @memberof MultiDownload
	 */
	downloadNextBatch()
	{
		let difference = this.max - this.offset;

		let batchLength = (
			difference < this.queue ? difference + 1 : this.queue
		);

		for (let i = this.offset; i < (this.offset + batchLength); i++) {
			this.startSingle(i-1)
		}
	}
}

module.exports = MultiDownload;