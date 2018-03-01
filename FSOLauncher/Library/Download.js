const EventEmitter = require('events')
const DownloadWorker = require('./DownloadWorker')

/**
 * Manages one single download session that can contain multiple file downloads.
 * 
 * @class Download
 * @extends {EventEmitter}
 */
class Download extends EventEmitter {
	constructor()
	{
		super();
		this.downloads = []
	}

	/**
	 * Adds a new download to the queue.
	 * 
	 * @param {any} options 
	 * @memberof Download
	 */
	add(options) 
	{
		options.retries = options.retries || 5;

		options.destination += options.alias ?
			options.alias : options.origin.split('/').pop();

		this.downloads.push(new DownloadWorker(options))
	}

	/**
	 * Returns all the downloads.
	 * 
	 * @returns 
	 * @memberof Download
	 */
	getAll() {
		return this.downloads;
	}

	/**
	 * Returns the downloads in progress.
	 * 
	 * @returns 
	 * @memberof Download
	 */
	getInProgress() {
		let res = [];

		for (let i = 0; i < this.downloads.length; i++) {
			if(this.downloads[i].getStatus() === "IN_PROGRESS")
				res.push(this.downloads[i])
		}

		return res
	}

	/**
	 * Returns the failed downloads.
	 * 
	 * @returns 
	 * @memberof Download
	 */
	getFailed()
	{
		let res = [];

		for (let i = 0; i < this.downloads.length; i++)
		{
			if(this.downloads[i].getStatus() === "FAILED")
				res.push(this.downloads[i])
		}

		return res
	}

	/**
	 * Returns the finished downloads.
	 * 
	 * @returns 
	 * @memberof Download
	 */
	getFinished()
	{
		let res = [];

		for (let i = 0; i < this.downloads.length; i++)
		{
			if(this.downloads[i].getStatus() === "FINISHED")
				res.push(this.downloads[i])
		}

		return res
	}

	/**
	 * Returns size stats in bytes.
	 * 
	 * @returns
	 * @memberof Download
	 */
	getSizeData()
	{
		let counter = 0;
		let counterDownloaded = 0;

		for (let i = 0; i < this.downloads.length; i++)
		{
			let progress = this.downloads[i].getProgress();

			counter+=progress.totalSize;

			if(this.downloads[i].getStatus('IN_PROGRESS')) {
				counterDownloaded+=progress.downloadedSize
			} else {
				counterDownloaded+=progress.totalSize
			}
		}

		return {
			totalSize: counter,
			downloadedSize: counterDownloaded
		}
	}

	/**
	 * Starts one single download by index.
	 * 
	 * @param {any} index The download to initiate.
	 * @memberof Download
	 */
	startSingle(index)
	{
		this.downloads[index].start();
		this.addListeners(this.downloads[index])
	}

	/**
	 * Starts all downloads.
	 * 
	 * @memberof Download
	 */
	start() 
	{
		for (let i = 0; i < this.downloads.length; i++)
		{
			if(this.downloads[i].getStatus() === 'PENDING')
			{
				this.startSingle(i)
			}
		}
	}

	/**
	 * Returns percentage and progress in MegaBytes.
	 * 
	 * @returns 
	 * @memberof Download
	 */
	getProgress()
	{
		let totalPointsNeeded = this.downloads.length * 100
		let totalPoints = 0

		for (let i = 0; i < this.downloads.length; i++)
		{
			switch(this.downloads[i].getStatus())
			{
				case "IN_PROGRESS":
					let progress = this.downloads[i].getProgress()
					totalPoints += parseInt(progress.percentage)
					break

				case "FINISHED":
					totalPoints += 100
					break
			}
		}

		let sizeData = this.getSizeData()

		return {
			percentage: (totalPoints / totalPointsNeeded * 100).toFixed(2),
			mbTotal: (sizeData.totalSize / 1048576).toFixed(2),
			mbDownloaded: (sizeData.downloadedSize / 1048576).toFixed(2)
		}

	}

	/**
	 * Listens to the DownloadWorker's events.
	 * 
	 * @param {any} DownloadWorker 
	 * @memberof Download
	 */
	addListeners(DownloadWorker)
	{
		DownloadWorker.on('start', () => 
		{
			//console.log('Downloading', DownloadWorker.options.origin)
		})

		DownloadWorker.on('end', () => 
		{
			//console.log('Finished', DownloadWorker.options.origin)

			if(DownloadWorker.options.multiPartId) {
				this.emit('multiPartEnd', DownloadWorker.options.multiPartId)
			}

			let finished = this.getFinished()
			let failed = this.getFailed()

			if(failed.length > 0) {
				if((failed.length + finished.length) === this.downloads.length) {
					return this.emit('end', { finished: finished, failed: failed })
				}				
			} else {
				if(finished.length === this.downloads.length) {
					return this.emit('end')
				}
			}
		});

		DownloadWorker.on('error', (message) => 
		{
			//console.log('Error with', DownloadWorker.options.origin, message);

			let failed = this.getFailed()
			let finished = this.getFinished()

			if(DownloadWorker.options.multiPartId) {
				this.emit('multiPartEnd', DownloadWorker.options.multiPartId)
			}

			if((failed.length + finished.length) === this.downloads.length) {
				return this.emit('end', { finished: finished, failed: failed })
			}
		})
	}
}

module.exports = Download