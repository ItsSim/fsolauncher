/**
 * Interacts with a Windows PC Registry to handle all the different
 * keys FreeSO and TSO need to function properly.
 * 
 * @class Registry
 */
class Registry
{
	/**
	 * Returns the status of all the required programs (Installed/not installed).
	 * 
	 * @static
	 * @returns 
	 * @memberof Registry
	 */
	static getInstalled()
	{
		return new Promise((resolve, reject) => 
		{
			let Promises = [];

			Promises.push(
				Registry.get(
					'OpenAL', '\\SOFTWARE\\OpenAL'
				)
			);

			Promises.push(
				Registry.get(
					'FSO', '\\SOFTWARE\\Rhys Simpson\\FreeSO'
				)
			);

			Promises.push(
				Registry.get(
					'TSO', '\\SOFTWARE\\Maxis\\The Sims Online'
				)
			);

			Promises.push(
				Registry.get(
					'NET', '\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP'
				)
			);

			Promise.all(Promises)
				.then((a) => {
					resolve(a)
				})
				.catch((err) => {
					if(err)
						reject(err)
				})
		})
	}

	/**
	 * Checks if a Registry Key exists and returns if it is installed or not.
	 * 
	 * @static
	 * @param {any} e The Component to look for.
	 * @param {any} p The Registry Key to look in.
	 * @returns 
	 * @memberof Registry
	 */
	static get(e, p) {
		return new Promise((resolve, reject) => {
            const Registry = require('winreg');

            let Key = new Registry({
                hive: Registry.HKLM,
                key: p
            });

            if (e === 'FSO' || e === 'TSO') {
            	Key.get('InstallDir', (err, RegistryItem) => {
            		if(err) {
            			return resolve({key: e, isInstalled: false});
					} else {
            			return resolve({key: e, isInstalled: RegistryItem.value})
					}
				});
        	} else if(e === 'NET') {
				Key.keys((err, Registries) => {
					if(err) {
						return resolve({key: e, isInstalled: false})
					} else {
						for(let i=0; i<Registries.length; i++) {
							if(Registries[i].key.indexOf('v4.0') > -1 ||
								Registries[i].key.indexOf('v4') > -1) {
								return resolve({key: e, isInstalled: true})
							}
						}
						return resolve({key: e, isInstalled: false})
					}
				})
    		} else if(e === 'OpenAL') {
				Key.keyExists((err, exists) => {
					if(err) {
						return resolve({key:e, isInstalled: false})
					} else {
						if(exists) {
                            return resolve({key:e, isInstalled: true})
						} else {
                            return resolve({key:e, isInstalled: false})
						}
					}
				})
    		}
		})
	}

	/**
	 * Creates the default Maxis Registry Key.
	 * 
	 * @static
	 * @param {any} InstallDir Where TSO was installed.
	 * @returns 
	 * @memberof Registry
	 */
	static createMaxisEntry(InstallDir)
	{
		return new Promise((resolve, reject) =>
		{
			const Registry = require('winreg');

			let Key = new Registry({
                hive: Registry.HKLM,
                key: "\\SOFTWARE\\Maxis\\The Sims Online"
            });

			Key.keyExists((err, exists) =>
			{
				if(err) {
					return reject(global.locale.TSO_REGISTRY_EDIT_FAIL)
				} else {
					if(exists)
					{
						Key.destroy(err =>
						{
							if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

							Key.create(err =>
							{
								if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                                Key.set('InstallDir', Registry.REG_SZ, InstallDir, (err) =>
                                {
                                    if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                                    return resolve()
                                })
							})
						})
					} else {
						Key.create(err =>
						{
							if(err) return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);

							Key.set('InstallDir', Registry.REG_SZ, InstallDir, (err) =>
							{
								if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

								return resolve()
							})
						})
					}
				}
			});
		})
    }

	/**
	 * Creates the *new* default FreeSO Registry Key.
	 * 
	 * @static
	 * @param {any} InstallDir Where FreeSO was installed.
	 * @returns 
	 * @memberof Registry
	 */
	static createFreeSOEntry(InstallDir)
	{
        return new Promise((resolve, reject) =>
        {
            const Registry = require('winreg');

            let Key = new Registry({
                hive: Registry.HKLM,
                key: "\\SOFTWARE\\Rhys Simpson\\FreeSO"
            });

            Key.keyExists((err, exists) =>
            {
                if(err) {
                    return reject(global.locale.TSO_REGISTRY_EDIT_FAIL)
                } else {
                    if(exists)
                    {
                        Key.destroy(err =>
                        {
                            if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                            Key.create(err =>
                            {
                                if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                                Key.set('InstallDir', Registry.REG_SZ, InstallDir, (err) =>
                                {
                                    if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                                    return resolve();
                                })
                            })
                        })
                    } else {
                        Key.create(err =>
                        {
                            if(err) return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);

                            Key.set('InstallDir', Registry.REG_SZ, InstallDir, (err) =>
                            {
                                if(err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                                return resolve();
                            })
                        })
                    }
                }
            });
        })
	}
}

module.exports = Registry;