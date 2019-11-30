/**
 * Interacts with a Windows PC Registry to handle all the different
 * keys FreeSO and TSO need to function properly.
 *
 * @class Registry
 */
class Registry {
  static getOpenALPath() {
    return "\\SOFTWARE\\OpenAL";
  }
  static getFSOPath() {
    return "\\SOFTWARE\\Rhys Simpson\\FreeSO";
  }
  static getTSOPath() {
    return "\\SOFTWARE\\Maxis\\The Sims Online";
  }
  static getNETPath() {
    return "\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP";
  }
  static getSimitonePath() {
    return "\\SOFTWARE\\Rhys Simpson\\Simitone";
  }
  static getTS1Path() {
    return "\\SOFTWARE\\Maxis\\The Sims";
  }
  /**
   * Returns the status of all the required programs (Installed/not installed).
   *
   * @static
   * @returns
   * @memberof Registry
   */
  static getInstalled() {
    return new Promise((resolve, reject) => {
      let Promises = [];

      Promises.push(Registry.get('OpenAL', Registry.getOpenALPath()));
      Promises.push(Registry.get('FSO', Registry.getFSOPath()));
      Promises.push(Registry.get('TSO', Registry.getTSOPath()));
      Promises.push(Registry.get('NET', Registry.getNETPath()));
      Promises.push(Registry.get('Simitone', Registry.getSimitonePath()));
      Promises.push(Registry.get('TS1', Registry.getTS1Path()));

      Promise.all(Promises)
        .then(a => { resolve(a); })
        .catch(err => { if (err) reject(err); });
    });
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

      if (e === 'FSO' || e === 'TSO' || e === 'Simitone') {
        Key.get('InstallDir', (err, RegistryItem) => {
          if (err) {
            return resolve({ key: e, isInstalled: false, error: err });
          } else {
            return resolve({ key: e, isInstalled: RegistryItem.value });
          }
        });
      } else if (e === 'TS1') {
        Key.get('InstallPath', async (err, _RegistryItem) => {
          if (err) {
            return resolve({
              key: e,
              isInstalled: false,
              error: err
            });
          } else {
            // SIMS_GAME_EDITION = 255 All EPs installed.
            Key.get('SIMS_GAME_EDITION', (err, RegistryItem) => {
              if (err) {
                return reject({
                  key: e,
                  isInstalled: false
                });
              }

              const TS1Edition = RegistryItem.value;
              if (TS1Edition == 255) {
                return resolve({
                  key: e,
                  isInstalled: true
                });
              }
              resolve({
                key: e,
                isInstalled: false
              });
            });
          }
        });
      } else if (e === 'NET') {
        Key.keys((err, Registries) => {
          if (err) {
            return resolve({ key: e, isInstalled: false, error: err });
          } else {
            for (let i = 0; i < Registries.length; i++) {
              if (
                Registries[i].key.indexOf('v4.0') > -1 ||
                Registries[i].key.indexOf('v4') > -1
              ) {
                return resolve({ key: e, isInstalled: true });
              }
            }
            return resolve({ key: e, isInstalled: false });
          }
        });
      } else if (e === 'OpenAL') {
        Key.keyExists((err, exists) => {
          if (err) {
            return resolve({ key: e, isInstalled: false, error: err });
          } else {
            if (exists) {
              return resolve({ key: e, isInstalled: true });
            } else {
              return resolve({ key: e, isInstalled: false });
            }
          }
        });
      }
    });
  }

  /**
   * Creates the default Maxis Registry Key.
   *
   * @static
   * @param {any} InstallDir Where TSO was installed.
   * @returns
   * @memberof Registry
   */
  static createMaxisEntry(InstallDir) {
    return new Promise((resolve, reject) => {
      const Registry = require('winreg');

      let Key = new Registry({
        hive: Registry.HKLM,
        key: '\\SOFTWARE\\Maxis\\The Sims Online'
      });

      Key.keyExists((err, exists) => {
        if (err) {
          return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);
        } else {
          if (exists) {
            Key.destroy(err => {
              if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

              Key.create(err => {
                if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                Key.set('InstallDir', Registry.REG_SZ, InstallDir, err => {
                  if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                  return resolve();
                });
              });
            });
          } else {
            Key.create(err => {
              if (err) return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);

              Key.set('InstallDir', Registry.REG_SZ, InstallDir, err => {
                if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                return resolve();
              });
            });
          }
        }
      });
    });
  }

  /**
   * Creates the *new* default FreeSO Registry Key.
   * Reused for Simitone, second parameter as "Simitone".
   *
   * @static
   * @param {any} InstallDir Where FreeSO was installed.
   * @returns
   * @memberof Registry
   */
  static createFreeSOEntry(InstallDir, KeyName = 'FreeSO') {
    return new Promise((resolve, reject) => {
      const Registry = require('winreg');
      let Key = new Registry({
        hive: Registry.HKLM,
        key: '\\SOFTWARE\\Rhys Simpson\\' + KeyName
      });

      Key.keyExists((err, exists) => {
        if (err) {
          return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);
        } else {
          if (exists) {
            Key.destroy(err => {
              if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

              Key.create(err => {
                if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                Key.set('InstallDir', Registry.REG_SZ, InstallDir, err => {
                  if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                  return resolve();
                });
              });
            });
          } else {
            Key.create(err => {
              if (err) return reject(global.locale.TSO_REGISTRY_EDIT_FAIL);

              Key.set('InstallDir', Registry.REG_SZ, InstallDir, err => {
                if (err) return reject(global.locale.TSO_INSTALLDIR_FAIL);

                return resolve();
              });
            });
          }
        }
      });
    });
  }
}

module.exports = Registry;
