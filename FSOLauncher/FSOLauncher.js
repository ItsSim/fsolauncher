const Modal = require('./Library/Modal');
const EventHandlers = require('./EventHandlers');
const View = require('./Library/View');
const ToastComponent = require('./Library/Toast');

/**
 * Main launcher class.
 *
 * @class FSOLauncher
 * @extends {Events}
 */
class FSOLauncher extends EventHandlers {
  /**
   * Creates an instance of FSOLauncher.
   * @param {any} Window
   * @param {any} conf
   * @memberof FSOLauncher
   */
  constructor(Window, conf) {
    super();

    this.Window = Window;
    this.conf = conf;
    this.minimizeReminder = false;
    this.lastUpdateNotification = false;
    this.isSearchingForUpdates = false;
    this.isUpdating = false;
    this.hasInternet = false;
    this.updateLocation = false;
    this.remeshInfo = {};
    this.remeshInfo.location = false;
    this.remeshInfo.version = false;
    this.remoteSimitoneVersion = null;

    this.Window.on('minimize', () => {
      if (!this.minimizeReminder) {
        Modal.sendNotification(
          'FreeSO Launcher',
          global.locale.MINIMIZE_REMINDER
        );

        this.minimizeReminder = true;
      }
      this.Window.hide();
    });

    Modal.View = this.View = new View(this.Window);

    this.ActiveTasks = [];
    this.isInstalled = {};

    this.checkUpdatesRecursive();
    this.updateTipRecursive();
    this.updateNetRequiredUIRecursive(true);
    this.defineEvents();
  }

  /**
   * Reads the registry and updates the programs list.
   *
   * @returns
   * @memberof FSOLauncher
   */
  updateInstalledPrograms() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const Toast = new ToastComponent(global.locale.TOAST_REGISTRY, this.View);
      try {
        const Registry = require('./Library/Registry'),
          programs = await Registry.getInstalled();

        Toast.destroy();

        for (let i = 0; i < programs.length; i++) {
          this.isInstalled[programs[i].key] = programs[i].isInstalled;
        }
        this.View.sendInstalledPrograms(this.isInstalled);
        resolve();
      } catch (err) {
        Toast.destroy();
        reject(err);
      }
    });
  }
  /**
   * Update tips recursively.
   *
   * @memberof FSOLauncher
   */
  updateTipRecursive() {
    const tips = [
      global.locale.TIP1,
      global.locale.TIP2,
      global.locale.TIP3,
      global.locale.TIP4,
      global.locale.TIP5,
      global.locale.TIP6,
      global.locale.TIP7,
      global.locale.TIP8,
      global.locale.TIP9,
      global.locale.TIP10,
      global.locale.TIP11,
      global.locale.TIP12,
      global.locale.TIP13
    ];

    this.View.setTip(tips[Math.floor(Math.random() * tips.length)]);

    setTimeout(() => {
      this.updateTipRecursive();
    }, 30000);
  }

  /**
   * Gets the current internet status.
   *
   * @returns
   * @memberof FSOLauncher
   */
  getInternetStatus() {
    return new Promise((resolve, _reject) => {
      require('dns').lookup('google.com', err => {
        this.hasInternet = !(err && err.code === 'ENOTFOUND');
        return resolve(this.hasInternet);
      });
    });
  }

  getSimitoneReleaseInfo() {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const options = {
        host: 'api.github.com',
        path: '/repos/riperiperi/Simitone/releases/latest',
        headers: { 'user-agent': 'node.js' }
      };

      const request = https.request(options, res => {
        let data = '';

        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) { reject(e); }
        });
      });

      request.setTimeout(30000, () => {
        reject(
          'Timed out while trying to get GitHub release data for Simitone.'
        );
      });
      request.on('error', e => { reject(e); });
      request.end();
    });
  }

  /**
   * Hides all view elements that need internet connection.
   *
   * @param {any} init
   * @memberof FSOLauncher
   */
  async updateNetRequiredUI(_init) {
    let hasInternet = await this.getInternetStatus();

    if (!hasInternet) {
      return this.View.hasNoInternet();
    }
    return this.View.hasInternet();
  }

  /**
   * Recursively updates the UI that needs internet.
   *
   * @memberof FSOLauncher
   */
  updateNetRequiredUIRecursive() {
    setTimeout(() => {
      this.updateNetRequiredUI();
      this.updateNetRequiredUIRecursive();
    }, 5000);
  }

  /**
   * Installs the game using the complete installer
   * which installs OpenAL, .NET, TSO and FreeSO.
   *
   * @memberof FSOLauncher
   */
  runFullInstaller() {
    new (require('./Library/Installers/CompleteInstaller'))(this).run();
  }

  /**
   * Adds a task in progress.
   *
   * @param {any} Name
   * @memberof FSOLauncher
   */
  addActiveTask(Name) {
    if (!this.isActiveTask(Name)) {
      this.ActiveTasks.push(Name);
    }
  }

  /**
   * Removes a task.
   *
   * @param {*} Name
   */
  removeActiveTask(Name) {
    if (Name) {
      return this.ActiveTasks.splice(this.ActiveTasks.indexOf(Name), 1);
    }

    this.ActiveTasks = [];
  }

  /**
   * Checks if task is active.
   *
   * @param {*} Name
   */
  isActiveTask(Name) {
    return this.ActiveTasks.indexOf(Name) > -1;
  }

  /**
   * Returns a component's hard-coded pretty name.
   *
   * @param {*} Component
   */
  getPrettyName(Component) {
    switch (Component) {
      case 'TSO':
        return 'The Sims Online';
      case 'FSO':
        return 'FreeSO';
      case 'OpenAL':
        return 'OpenAL';
      case 'NET':
        return '.NET Framework';
      case 'RMS':
        return 'Remesh Package';
      case 'Simitone':
        return 'Simitone for Windows';
    }
  }

  /**
   * Modifies TTS Mode.
   * To do this it has to edit FreeSO's config.ini.
   *
   * @param {any} value New TTS value.
   * @returns
   * @memberof FSOLauncher
   */
  async editTTSMode(value) {
    const fs = require('fs');
    const ini = require('ini');
    const Toast = new ToastComponent(global.locale.TOAST_TTS_MODE, this.View);

    this.addActiveTask('CHTTS');

    if (!this.isInstalled.FSO) {
      this.removeActiveTask('CHTTS');
      Toast.destroy();
      return Modal.showNeedFSOTSO();
    }

    try {
      let data = await this.getFSOConfig();
      data.EnableTTS = value === '0' ? 'False' : 'True';

      fs.writeFile(
        this.isInstalled.FSO + '\\Content\\config.ini',
        ini.stringify(data),
        err => {
          this.removeActiveTask('CHTTS');
          Toast.destroy();

          if (err) {
            return Modal.showErrorIni();
          }

          this.conf.Game.TTS = value;
          this.persist(true);
        }
      );
    } catch (e) {
      this.removeActiveTask('CHTTS');
      Toast.destroy();
      Modal.showFirstRun();
    }
  }

  getRemeshData() {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const options = {
        host: global.WEBSERVICE,
        path: '/' + global.REMESH_ENDPOINT
      };

      const request = http.request(options, res => {
        let data = '';

        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            this.remeshInfo.location = j.Location;
            this.remeshInfo.version = j.Version;
            resolve(j);
          } catch (e) {
            reject(e);
          }
        });
      });

      request.setTimeout(30000, () => { reject('Timed out'); });
      request.on('error', e => { reject(e); });
      request.end();
    });
  }

  /**
   * Returns the launcher's update endpoint response.
   *
   * @returns
   * @memberof FSOLauncher
   */
  getLauncherData() {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const os = require('os');
      const options = {
        host: global.WEBSERVICE,
        path: '/' + global.UPDATE_ENDPOINT +
          '?os=' + os.release() +
          '&version=' + global.VERSION
      };

      const request = http.request(options, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const j = JSON.parse(data);
            this.updateLocation = j.Location;
            resolve(j);
          } catch (e) {
            reject(e);
          }
        });
      });
      request.setTimeout(30000, () => { reject('Timed out'); });
      request.on('error', e => { reject(e); });
      request.end();
    });
  }

  async checkRemeshInfo() {
    await this.getRemeshData();
    if (this.remeshInfo.version != null) {
      this.View.setRemeshInfo(this.remeshInfo.version);
    }
  }

  async checkSimitoneRequirements() {
    new ToastComponent(
      'Checking requirements', this.View, 1500
    );
    const Registry = require('./Library/Registry');
    const simitoneStatus = await Registry.get('Simitone', Registry.getSimitonePath());
    const ts1ccStatus = await Registry.get('TS1', Registry.getTS1Path());
    let simitoneUpdateStatus = null;
    if(simitoneStatus.isInstalled) {
      simitoneUpdateStatus = await this.getSimitoneReleaseInfo();
      if(this.conf.Game.SimitoneVersion != simitoneUpdateStatus.tag_name) {
        this.View.sendSimitoneShouldUpdate(simitoneUpdateStatus.tag_name);
      } else {
        this.View.sendSimitoneShouldUpdate(false);
      }
    } else {
      this.View.sendSimitoneShouldUpdate(false);
    }
    this.isInstalled['Simitone'] = simitoneStatus.isInstalled;
    this.isInstalled['TS1'] = ts1ccStatus.isInstalled;
    this.View.sendInstalledPrograms(this.isInstalled);
    //Toast.destroy();
  }

  /**
   * Checks if any updates are available.
   *
   * @param {any} wasAutomatic Indicates if it has been requested by the recursive loop
   * to not spam the user with possible request error modals.
   * @memberof FSOLauncher
   */
  async checkLauncherUpdates(wasAutomatic) {
    if (
      !this.isSearchingForUpdates &&
      !this.isUpdating &&
      this.hasInternet &&
      this.ActiveTasks.length === 0
    ) {
      this.isSearchingForUpdates = true;

      let Toast = new ToastComponent(
        global.locale.TOAST_CHECKING_UPDATES,
        this.View
      );

      try {
        let data = await this.getLauncherData();

        this.isSearchingForUpdates = false;

        Toast.destroy();

        if (data.Version !== global.VERSION) {
          if (
            this.lastUpdateNotification !== data.Version &&
            !this.Window.isVisible()
          ) {
            Modal.sendNotification(
              global.locale.MODAL_UPDATE_X +
                ' ' +
                data.Version +
                ' ' +
                global.locale.X_AVAILABLE,
              global.locale.MODAL_UPDATE_DESCR
            );
          }

          if (this.lastUpdateNotification !== data.Version) {
            this.lastUpdateNotification = data.Version;
            Modal.showInstallUpdate(data.Version);
          } else {
            if (!wasAutomatic) {
              Modal.showInstallUpdate(data.Version);
            }
          }
        }
      } catch (e) {
        this.isSearchingForUpdates = false;
        Toast.destroy();
        if (!wasAutomatic) Modal.showFailedUpdateCheck();
      }
    }
  }

  /**
   * Installs a launcher update which is simply a static executable
   * located in a remote server, whose URL is received when contacting
   * the update server endpoint.
   *
   * @memberof FSOLauncher
   */
  async installLauncherUpdate() {
    this.View.changePage('downloads');
    this.isUpdating = true;

    const UpdateInstaller = require('./Library/Installers/UpdateInstaller');

    let Installer = new UpdateInstaller(this);

    try {
      await Installer.install();
      this.isUpdating = false;
    } catch (e) {
      this.isUpdating = false;
    }
  }

  /**
   * Changes the game path in the registry.
   *
   * @param {any} options
   * @memberof FSOLauncher
   */
  async changeGamePath(options) {
    let Toast = new ToastComponent(global.locale.TOAST_CHPATH, this.View);

    try {
      await this.install(options.component, {
        fullInstall: false,
        override: options.override
      });

      Modal.showChangedGamePath();

      this.updateInstalledPrograms();
      this.removeActiveTask(options.component);

      Toast.destroy();
    } catch (e) {
      Modal.showFailedInstall(this.getPrettyName(options.component), e);
      this.removeActiveTask(options.component);
      Toast.destroy();
    }
  }

  /**
   * Shows the confirmation Modal right before installing.
   *
   * @param {any} Component The Component that is going to be installed.
   * @returns
   * @memberof FSOLauncher
   */
  async fireInstallModal(Component) {
    let missing = [];

    let prettyName = this.getPrettyName(Component);

    switch (Component) {
      case 'FSO':
        if (!this.isInstalled['TSO']) missing.push(this.getPrettyName('TSO'));

        if (!this.isInstalled['OpenAL'])
          missing.push(this.getPrettyName('OpenAL'));
        break;

      case 'TSO':
        if (!this.isInstalled['NET']) missing.push(this.getPrettyName('NET'));
        break;

      case 'RMS':
        if (!this.isInstalled['FSO']) missing.push(this.getPrettyName('FSO'));
        break;
    }

    if (
      (Component === 'TSO' ||
        Component === 'FSO' ||
        Component === 'RMS' ||
        Component === 'Simitone') &&
      !this.hasInternet
    ) {
      return Modal.showNoInternet();
    }

    if (this.isActiveTask(Component)) {
      return Modal.showAlreadyInstalling();
    }

    if (missing.length > 0) {
      Modal.showRequirementsNotMet(missing);
    } else {
      if (Component == 'RMS') {
        if (this.remeshInfo.version == null) {
          await this.getRemeshData();
          if (this.remeshInfo.version == null) {
            return Modal.showNoRemesh();
          } else {
            return Modal.showFirstInstall(prettyName, Component);
          }
        }
        return Modal.showFirstInstall(prettyName, Component);
      }

      if (this.isInstalled[Component] === false) {
        Modal.showFirstInstall(prettyName, Component);
      } else {
        Modal.showReInstall(prettyName, Component);
      }
    }
  }

  /**
   * Installs a single Component.
   *
   * @param {any} Component The Component to install.
   * @param {any} options Extra options like fullInstall or override.
   * @returns
   * @memberof FSOLauncher
   */
  install(
    Component,
    options = {
      fullInstall: false,
      override: false,
      tsoInstaller: 'FilePlanetInstaller',
      dir: false
    }
  ) {
    let InstallerInstance;
    let Installer;
    let Executable;

    this.addActiveTask(Component);

    switch (Component) {
      case 'RMS':
        Installer = require('./Library/Installers/RemeshesInstaller');

        InstallerInstance = new Installer(
          this.isInstalled.FSO + '\\Content\\MeshReplace', this
        );

        this.View.changePage('downloads');

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          try {
            await InstallerInstance.install();
            if(this.isInstalled.Simitone) {
              const SimitoneInstallerInstance = new Installer(
                this.isInstalled.Simitone + '\\Content\\MeshReplace', this,
                "Simitone"
              );
              await SimitoneInstallerInstance.install();
            }
            resolve();
          } catch (e) {
            reject(e);
          }
        });

      case 'TSO':
      case 'FSO':
      case 'Simitone':
        if (Component == 'TSO') {
          Installer = require('./Library/Installers/FilePlanetInstaller');
        }
        if (Component == 'FSO') {
          Installer = require('./Library/Installers/FSOInstaller');
        }
        if (Component == 'Simitone') {
          Installer = require('./Library/Installers/SimitoneInstaller');
        }

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          if (!options.override) {
            let InstallDir;
            if(!options.dir) {
              const Toast = new ToastComponent(
                global.locale.TOAST_WAITING,
                this.View
              );
  
              let folder = await Modal.showChooseDirectory(
                this.getPrettyName(Component),
                this.Window
              );
              if(folder) {
                InstallDir = folder[0] + '\\' + this.getPrettyName(Component);
              }
              Toast.destroy();
            } else {
              InstallDir = options.dir;
            }

            if (InstallDir) {
              InstallerInstance = new Installer(
                InstallDir,
                this
              );

              let isInstalled = await InstallerInstance.isInstalledInPath();

              if (isInstalled && !options.fullInstall && !options.dir) {
                return Modal.showAlreadyInstalled(
                  this.getPrettyName(Component),
                  Component,
                  InstallDir
                );
              }

              if (!options.fullInstall) {
                this.View.changePage('downloads');
              }

              try {
                await InstallerInstance.install();
                resolve();
              } catch (e) {
                reject(e);
              }
            } else {
              if (!options.fullInstall) {
                this.removeActiveTask(Component);
              } else {
                this.removeActiveTask();
                this.View.fullInstallProgressItem();
              }
            }
          } else {
            const Registry = require('./Library/Registry');

            try {
              if (Component === 'TSO') {
                await Registry.createMaxisEntry(options.override);
              }
              if (Component === 'FSO') {
                await Registry.createFreeSOEntry(options.override);
              }
              if (Component === 'Simitone') {
                await Registry.createFreeSOEntry(options.override, 'Simitone');
              }

              resolve();
            } catch (e) {
              reject(e);
            }
          }
        });
      case 'OpenAL':
      case 'NET':
        Executable = require('./Library/Installers/ExecutableInstaller');

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
          let file =
            Component === 'NET' ? 'NDP46-KB3045560-Web.exe' : 'oalinst.exe';

          InstallerInstance = new Executable();

          try {
            await InstallerInstance.run(file);
            this.removeActiveTask(Component);
            this.updateInstalledPrograms();
            return resolve();
          } catch (e) {
            this.removeActiveTask(Component);
            return reject(e);
          }
        });
    }
  }

  /**
   * Checks the updates recursively.
   *
   * @memberof FSOLauncher
   */
  checkUpdatesRecursive() {
    setTimeout(() => {
      this.checkLauncherUpdates(true);
      this.checkRemeshInfo();
      this.checkUpdatesRecursive();
    }, 60000);
  }

  /**
   * Switches the game language. Copies the translation files and
   * changes the current language in FreeSO's config.ini
   *
   * @param {any} language
   * @returns
   * @memberof FSOLauncher
   */
  async switchLanguage(language) {
    if (!this.isInstalled.TSO || !this.isInstalled.FSO) {
      return Modal.showNeedFSOTSO();
    }

    const fs = require('fs-extra');
    const ini = require('ini');
    const path = require('path');

    let Toast = new ToastComponent(global.locale.TOAST_LANGUAGE, this.View);

    this.addActiveTask('CHLANG');

    fs.remove(
      this.isInstalled.FSO + '\\Content\\Patch\\User\\translations',
      async _error => {
        fs.copy(
          path.join(
            __dirname,
            '../export/LanguagePacks/' + language.toUpperCase() + '/TSO'
          ),
          this.isInstalled.TSO + '\\TSOClient',
          async error => {
            if (error) {
              this.removeActiveTask('CHLANG');
              Toast.destroy();
              return Modal.showTSOLangFail();
            }

            fs.copy(
              path.join(
                __dirname,
                '../export/LanguagePacks/' + language.toUpperCase() + '/FSO'
              ),
              this.isInstalled.FSO,
              async error => {
                if (error) {
                  this.removeActiveTask('CHLANG');
                  Toast.destroy();
                  return Modal.showFSOLangFail();
                }

                try {
                  let data = await this.getFSOConfig();

                  data.CurrentLang = this.getLangString(
                    this.getLangCode(language)
                  )[0];

                  fs.writeFile(
                    this.isInstalled.FSO + '\\Content\\config.ini',
                    ini.stringify(data),
                    error => {
                      this.removeActiveTask('CHLANG');
                      Toast.destroy();

                      if (error) return Modal.showIniFail();

                      this.conf.Game.Language = this.getLangString(
                        this.getLangCode(language)
                      )[1];

                      this.persist(true);
                    }
                  );
                } catch (e) {
                  Modal.showFirstRun();
                  this.removeActiveTask('CHLANG');
                  Toast.destroy();
                }
              }
            );
          }
        );
      }
    );
  }

  /**
   * Updates a configuration variable. Used after
   * a users changes a setting.
   *
   * @param {any} v
   * @memberof FSOLauncher
   */
  async setConfiguration(v) {
    switch (true) {
      case v[1] == 'Language':
        this.switchLanguage(v[2]);
        break;

      case v[1] == 'TTS':
        this.editTTSMode(v[2]);
        break;

      case v[1] == 'GraphicsMode' &&
        v[2] == 'sw' &&
        this.conf.Game.GraphicsMode != 'sw':
        if (!this.isInstalled.FSO) Modal.showNeedFSOTSO();
        else {
          try {
            await this.enableSoftwareMode();
            Modal.showSoftwareModeEnabled();
            this.conf[v[0]][v[1]] = v[2];
            this.persist(true);
          } catch (e) {
            //Modal.showFailedUpdateMove()
            Modal.showGenericError(e.message);
          }
        }
        break;

      case v[1] == 'GraphicsMode' &&
        v[2] != 'sw' &&
        this.conf.Game.GraphicsMode == 'sw':
        try {
          await this.disableSoftwareMode();
          this.conf[v[0]][v[1]] = v[2];
          this.persist(true);
        } catch (e) {
          Modal.showGenericError(e.message);
        }
        break;

      default:
        this.conf[v[0]][v[1]] = v[2];
        this.persist(v[1] !== 'Language');
    }
  }

  /**
   * Disables Software Mode and removes dxtn.dll and opengl32.dll.
   */
  disableSoftwareMode() {
    const fs = require('fs-extra');
    this.addActiveTask('CHSWM');

    let Toast = new ToastComponent('Disabling Software Mode...', this.View);

    return new Promise((resolve, reject) => {
      fs.remove(this.isInstalled.FSO + '\\dxtn.dll', async error => {
        if (error) {
          Toast.destroy();
          reject(error);
          return this.removeActiveTask('CHSWM');
        }

        fs.remove(this.isInstalled.FSO + '\\opengl32.dll', async error => {
          if (error) {
            Toast.destroy();
            reject(error);
            return this.removeActiveTask('CHSWM');
          }

          Toast.destroy();
          this.removeActiveTask('CHSWM');
          return resolve();
        });
      });
    });
  }

  /**
   * Enables Software Mode and adds the needed files.
   */
  enableSoftwareMode() {
    const fs = require('fs-extra');
    this.addActiveTask('CHSWM');

    let Toast = new ToastComponent('Enabling Software Mode...', this.View);

    return new Promise((resolve, reject) => {
      fs.copy('bin/dxtn.dll', this.isInstalled.FSO + '\\dxtn.dll',
        async error => {
          if (error) {
            Toast.destroy();
            reject(error);
            return this.removeActiveTask('CHSWM');
          }

          fs.copy('bin/opengl32.dll', this.isInstalled.FSO + '\\opengl32.dll',
            async error => {
              if (error) {
                Toast.destroy();
                reject(error);
                return this.removeActiveTask('CHSWM');
              }

              Toast.destroy();
              this.removeActiveTask('CHSWM');
              return resolve();
            }
          );
        }
      );
    });
  }

  /**
   * Runs the game's executable.
   *
   * @param {any} useVolcanic If Volcanic.exe should be launched.
   * @returns
   * @memberof FSOLauncher
   */
  play(useVolcanic, isSimitone = false) {
    if (!this.isInstalled.FSO && !isSimitone) {
      return Modal.showNeedToPlay();
    }

    if (this.isActiveTask('CHLANG')) {
      return Modal.showFailPlay();
    }

    if (useVolcanic) {
      if (isSimitone) {
        return Modal.showVolcanicPromptSimitone();
      }
      return Modal.showVolcanicPrompt();
    }

    const fs = require('fs');

    let exeLocation = isSimitone
      ? this.isInstalled.Simitone + '\\Simitone.Windows.exe'
      : this.isInstalled.FSO + '\\FreeSO.exe';

    fs.stat(exeLocation, (err, _stat) => {
      if (err) return Modal.showCouldNotRecover();

      this.launchGame(false, isSimitone);
    });
  }

  /**
   * Launches the game with the user's configuration.
   *
   * @param {any} useVolcanic If Volcanic.exe should be launched.
   * @memberof FSOLauncher
   */
  launchGame(useVolcanic, isSimitone = false) {
    const gameFilename = isSimitone ? 'Simitone.Windows.exe' : 'FreeSO.exe';
    let file = useVolcanic ? 'Volcanic.exe' : gameFilename;
    const cwd = isSimitone
      ? this.isInstalled.Simitone
      : this.isInstalled.FSO;

    const ToastText = isSimitone
      ? global.locale.TOAST_LAUNCHING.replace('FreeSO', 'Simitone')
      : global.locale.TOAST_LAUNCHING;
    const Toast = new ToastComponent(ToastText, this.View);
    const args = [];

    // windowed by default
    args.push('w');
    // game language, by default english
    if(!isSimitone) {
      // for now disable this for Simitone
      args.push(`-lang${this.getLangCode(this.conf.Game.Language)}`);
    }
    // SW only allows ogl
    const graphicsMode = this.conf.Game.GraphicsMode != 'sw'
      ? this.conf.Game.GraphicsMode : 'ogl';
    args.push(`-${graphicsMode}`);
    // 3d is forced off when in SW
    if(this.conf.Game['3DMode'] === '1' && (this.conf.Game.GraphicsMode != 'sw' || isSimitone)) {
      args.push('-3d');
    }
    if(isSimitone && useVolcanic) {
      // w Simitone you need to launch Simitone.Windows.exe with the -ide flag
      args.push('-ide');
      file = 'Simitone.Windows.exe';
    }
    if(isSimitone && this.conf.Game.SimitoneAA === '1') {
      args.push('-aa');
    }

    require('child_process').exec(file + ' ' + args.join(' '), { cwd });
    setTimeout(() => { Toast.destroy(); }, 4000);
  }

  /**
   * Creates a shortcut for FreeSO.exe.
   *
   * @deprecated
   * @param {any} path Path to create the shortcut in.
   * @returns
   * @memberof FSOLauncher
   */
  createShortcut(path) {
    return new Promise((resolve, reject) => {
      const ws = require('windows-shortcuts');

      ws.create(
        '%UserProfile%\\Desktop\\FreeSO.lnk',
        {
          target: path + '\\FreeSO.exe',
          workingDir: path,
          desc: 'Play FreeSO Online',
          runStyle: ws.MAX
        },
        err => {
          return err ? reject(err) : resolve();
        }
      );
    });
  }

  /**
   * Promise that returns FreeSO's configuration
   * variables.
   *
   * @returns
   * @memberof FSOLauncher
   */
  getFSOConfig() {
    return new Promise((resolve, reject) => {
      const ini = require('ini');
      const fs = require('fs');

      fs.readFile(
        this.isInstalled.FSO + '\\Content\\config.ini',
        'utf8',
        (err, data) => {
          if (err) return reject(err);
          return resolve(ini.parse(data));
        }
      );
    });
  }

  /**
   * Returns hardcoded language integers from the language string.
   * Example: 'en', 'es'...
   *
   * @param {any} lang
   * @returns
   * @memberof FSOLauncher
   */
  getLangCode(lang) {
    const codes = {
      en: 0,
      es: 6,
      it: 5,
      pt: 14
    };

    return codes[lang];
  }

  /**
   * Returns the full language strings from the code.
   *
   * @param {any} code Language code (gettable from getLangCode).
   * @returns
   * @memberof FSOLauncher
   */
  getLangString(code) {
    const languageStrings = {
      0: ['English', 'en'], // default
      6: ['Spanish', 'es'],
      5: ['Italian', 'it'],
      14: ['Portuguese', 'pt']
    };

    return languageStrings[code];
  }

  /**
   * Save the current state of the configuration.
   *
   * @param {any} showToast Display a toast while it is saving.
   * @memberof FSOLauncher
   */
  persist(_showToast) {
    const Toast = new ToastComponent(global.locale.TOAST_SETTINGS, this.View);

    require('fs').writeFile(
      'FSOLauncher.ini',
      require('ini').stringify(this.conf),
      _err => { setTimeout(() => { Toast.destroy(); }, 1500); }
    );
  }
}

module.exports = FSOLauncher;
