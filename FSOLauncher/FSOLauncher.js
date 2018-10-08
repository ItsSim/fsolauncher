const Modal = require("./Library/Modal");
const Events = require("./Events");
const View = require("./Library/View");
const ToastComponent = require("./Library/Toast");

/**
 * Main launcher class.
 *
 * @class FSOLauncher
 * @extends {Events}
 */
class FSOLauncher extends Events {
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

    this.Window.on("minimize", () => {
      if (!this.minimizeReminder) {
        Modal.sendNotification(
          "FreeSO Launcher",
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
    this.updateInstalledPrograms();
    this.defineEvents();
  }

  /**
   * Reads the registry and updates the programs list.
   *
   * @returns
   * @memberof FSOLauncher
   */
  updateInstalledPrograms() {
    return new Promise(async (resolve, reject) => {
      let Toast = new ToastComponent(global.locale.TOAST_REGISTRY, this.View);
      try {
        const Registry = require("./Library/Registry");

        let programs = await Registry.getInstalled();

        Toast.destroy();

        for (let i = 0; i < programs.length; i++) {
          this.isInstalled[programs[i].key] = programs[i].isInstalled;
        }
        resolve();
      } catch (e) {
        Toast.destroy();
        console.log("Error grabbing the registry", err);
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
      global.locale.TIP13,
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
    return new Promise((resolve, reject) => {
      require("dns").lookup("google.com", err => {
        this.hasInternet = !(err && err.code === "ENOTFOUND");

        return resolve(this.hasInternet);
      });
    });
  }

  /**
   * Hides all view elements that need internet connection.
   *
   * @param {any} init
   * @memberof FSOLauncher
   */
  async updateNetRequiredUI(init) {
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
    new (require("./Library/Installers/CompleteInstaller"))(this).run();
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
      case "TSO":
        return "The Sims Online";
        break;
      case "FSO":
        return "FreeSO";
        break;
      case "OpenAL":
        return "OpenAL";
        break;
      case "NET":
        return ".NET Framework";
        break;
      case "RMS":
        return "Remesh Package";
        break;
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
    const fs = require("fs");
    const ini = require("ini");

    let Toast = new ToastComponent(global.locale.TOAST_TTS_MODE, this.View);

    this.addActiveTask("CHTTS");

    if (!this.isInstalled.FSO) {
      this.removeActiveTask("CHTTS");
      Toast.destroy();
      return Modal.showNeedFSOTSO();
    }

    try {
      let data = await this.getFSOConfig();
      data.EnableTTS = value === "0" ? "False" : "True";

      fs.writeFile(
        this.isInstalled.FSO + "\\Content\\config.ini",
        ini.stringify(data),
        err => {
          this.removeActiveTask("CHTTS");
          Toast.destroy();

          if (err) {
            return Modal.showErrorIni();
          }

          this.conf.Game.TTS = value;
          this.persist(true);
        }
      );
    } catch (e) {
      this.removeActiveTask("CHTTS");
      Toast.destroy();
      Modal.showFirstRun();
    }
  }

  getRemeshData() {
    return new Promise(async (resolve, reject) => {
      const http = require("http");

      let options = {};

      options.host = "5.189.177.216";
      options.path = "/RemeshInfo.php";

      const request = http.request(options, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            let j = JSON.parse(data);
            this.remeshInfo.location = j.Location;
            this.remeshInfo.version = j.Version;
            resolve(j);
          } catch (e) {
            reject(e);
          }
        });
      });

      request.setTimeout(30000, () => {
        reject("Timed out");
      });

      request.on("error", e => {
        reject(e);
      });

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
    return new Promise(async (resolve, reject) => {
      const http = require("http");
      const os = require("os");

      let options = {};

      options.host = "5.189.177.216";
      options.path =
        "/FSOLauncher.php?os=" + os.release() + "&version=" + global.version;

      const request = http.request(options, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            let j = JSON.parse(data);
            this.updateLocation = j.Location;
            resolve(j);
          } catch (e) {
            reject(e);
          }
        });
      });

      request.setTimeout(30000, () => {
        reject("Timed out");
      });

      request.on("error", e => {
        reject(e);
      });

      request.end();
    });
  }

  async checkRemeshInfo() {
    let data = await this.getRemeshData();

    if (this.remeshInfo.version != null) {
      this.View.setRemeshInfo(this.remeshInfo.version);
    }
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

        if (data.Version !== global.version) {
          if (
            this.lastUpdateNotification !== data.Version &&
            !this.Window.isVisible()
          ) {
            Modal.sendNotification(
              global.locale.MODAL_UPDATE_X +
                " " +
                data.Version +
                " " +
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
    this.View.changePage("downloads");
    this.isUpdating = true;

    const UpdateInstaller = require("./Library/Installers/UpdateInstaller");

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
        override: options.override,
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
      case "FSO":
        if (!this.isInstalled["TSO"]) missing.push(this.getPrettyName("TSO"));

        if (!this.isInstalled["OpenAL"])
          missing.push(this.getPrettyName("OpenAL"));
        break;

      case "TSO":
        if (!this.isInstalled["NET"]) missing.push(this.getPrettyName("NET"));
        break;

      case "RMS":
        if (!this.isInstalled["FSO"]) missing.push(this.getPrettyName("FSO"));
        break;
    }

    if (
      (Component === "TSO" || Component === "FSO" || Component === "RMS") &&
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
      if (Component == "RMS") {
        if (this.remeshInfo.version == null) {
          let data = await this.getRemeshData();
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
      tsoInstaller: "FilePlanetInstaller",
    }
  ) {
    let InstallerInstance;
    let Installer;

    this.addActiveTask(Component);

    switch (Component) {
      case "RMS":
        Installer = require("./Library/Installers/RemeshesInstaller");

        InstallerInstance = new Installer(
          this.isInstalled.FSO + "\\Content\\MeshReplace",
          this
        );

        this.View.changePage("downloads");

        return new Promise(async (resolve, reject) => {
          try {
            await InstallerInstance.install();
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        break;
      case "TSO":
      case "FSO":
        if (Component == "TSO") {
          if (!options.tsoInstaller) {
            options.tsoInstaller = "FilePlanetInstaller";
          }
          Installer = require("./Library/Installers/" + options.tsoInstaller);
        } else {
          Installer = require("./Library/Installers/FSOInstaller");
        }

        return new Promise(async (resolve, reject) => {
          if (!options.override) {
            const Toast = new ToastComponent(
              global.locale.TOAST_WAITING,
              this.View
            );

            let folder = await Modal.showChooseDirectory(
              this.getPrettyName(Component),
              this.Window
            );

            Toast.destroy();

            if (folder) {
              InstallerInstance = new Installer(
                folder[0] + "\\" + this.getPrettyName(Component),
                this
              );

              let isInstalled = await InstallerInstance.isInstalledInPath();

              if (isInstalled && !options.fullInstall) {
                return Modal.showAlreadyInstalled(
                  this.getPrettyName(Component),
                  Component,
                  folder[0] + "\\" + this.getPrettyName(Component)
                );
              }

              if (!options.fullInstall) {
                this.View.changePage("downloads");
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
            const Registry = require("./Library/Registry");

            try {
              Component === "TSO"
                ? await Registry.createMaxisEntry(options.override)
                : await Registry.createFreeSOEntry(options.override);

              resolve();
            } catch (e) {
              reject(e);
            }

            /*
                        For now users won't be able to create a direct shortcut
                        to FreeSO.exe, because they will surely nuke their game if
                        they run it NOT as administrator.
                        if(Component === 'FSO') {
                            this.createShortcut(options.override);
                        }*/
          }
        });
        break;
      case "OpenAL":
      case "NET":
        const Executable = require("./Library/Installers/ExecutableInstaller");

        return new Promise(async (resolve, reject) => {
          let file =
            Component === "NET" ? "NDP46-KB3045560-Web.exe" : "oalinst.exe";

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
        break;
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

    const fs = require("fs-extra");
    const ini = require("ini");
    const path = require("path");

    let Toast = new ToastComponent(global.locale.TOAST_LANGUAGE, this.View);

    this.addActiveTask("CHLANG");

    fs.remove(
      this.isInstalled.FSO + "\\Content\\Patch\\User\\translations",
      async error => {
        fs.copy(
          path.join(
            __dirname,
            "../export/LanguagePacks/" + language.toUpperCase() + "/TSO"
          ),
          this.isInstalled.TSO + "\\TSOClient",
          async error => {
            if (error) {
              this.removeActiveTask("CHLANG");
              Toast.destroy();
              return Modal.showTSOLangFail();
            }

            fs.copy(
              path.join(
                __dirname,
                "../export/LanguagePacks/" + language.toUpperCase() + "/FSO"
              ),
              this.isInstalled.FSO,
              async error => {
                if (error) {
                  this.removeActiveTask("CHLANG");
                  Toast.destroy();
                  return Modal.showFSOLangFail();
                }

                try {
                  let data = await this.getFSOConfig();

                  data.CurrentLang = this.getLangString(
                    this.getLangCode(language)
                  )[0];

                  fs.writeFile(
                    this.isInstalled.FSO + "\\Content\\config.ini",
                    ini.stringify(data),
                    error => {
                      this.removeActiveTask("CHLANG");
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
                  this.removeActiveTask("CHLANG");
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
      case v[1] == "Language":
        this.switchLanguage(v[2]);
        break;

      case v[1] == "TTS":
        this.editTTSMode(v[2]);
        break;

      case v[1] == "GraphicsMode" &&
        v[2] == "sw" &&
        this.conf.Game.GraphicsMode != "sw":
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

      case v[1] == "GraphicsMode" &&
        v[2] != "sw" &&
        this.conf.Game.GraphicsMode == "sw":
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
        this.persist(v[1] !== "Language");
    }
  }

  /**
   * Disables Software Mode and removes dxtn.dll and opengl32.dll.
   */
  disableSoftwareMode() {
    const fs = require("fs-extra");
    const path = require("path");

    this.addActiveTask("CHSWM");

    let Toast = new ToastComponent("Disabling Software Mode...", this.View);

    return new Promise((resolve, reject) => {
      fs.remove(this.isInstalled.FSO + "\\dxtn.dll", async error => {
        if (error) {
          Toast.destroy();
          reject(error);
          return this.removeActiveTask("CHSWM");
        }

        fs.remove(this.isInstalled.FSO + "\\opengl32.dll", async error => {
          if (error) {
            Toast.destroy();
            reject(error);
            return this.removeActiveTask("CHSWM");
          }

          Toast.destroy();
          this.removeActiveTask("CHSWM");
          return resolve();
        });
      });
    });
  }

  /**
   * Enables Software Mode and adds the needed files.
   */
  enableSoftwareMode() {
    const fs = require("fs-extra");
    const path = require("path");

    this.addActiveTask("CHSWM");

    let Toast = new ToastComponent("Enabling Software Mode...", this.View);

    return new Promise((resolve, reject) => {
      fs.copy(
        "bin/dxtn.dll",
        this.isInstalled.FSO + "\\dxtn.dll",
        async error => {
          if (error) {
            Toast.destroy();
            reject(error);
            return this.removeActiveTask("CHSWM");
          }

          fs.copy(
            "bin/opengl32.dll",
            this.isInstalled.FSO + "\\opengl32.dll",
            async error => {
              if (error) {
                Toast.destroy();
                reject(error);
                return this.removeActiveTask("CHSWM");
              }

              Toast.destroy();
              this.removeActiveTask("CHSWM");
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
  play(useVolcanic) {
    if (!this.isInstalled.FSO) {
      return Modal.showNeedToPlay();
    }

    if (this.isActiveTask("CHLANG")) {
      return Modal.showFailPlay();
    }

    if (useVolcanic) {
      return Modal.showVolcanicPrompt();
    }

    const fs = require("fs");

    fs.stat(this.isInstalled.FSO + "\\FreeSO.exe", (err, stat) => {
      if (err === null) {
        this.launchGame();
      } else if (err.code === "ENOENT") {
        fs.stat(this.isInstalled.FSO + "\\FreeSO.exe.old", (err, stat) => {
          if (err === null) {
            fs.rename(
              this.isInstalled.FSO + "\\FreeSO.exe.old",
              this.isInstalled.FSO + "\\FreeSO.exe",
              err => {
                if (err) return Modal.showCouldNotRecover();

                this.launchGame();
                Modal.showRecovered();
              }
            );
          } else if (err.code === "ENOENT") {
            Modal.showCouldNotRecover();
          }
        });
      }
    });
  }

  /**
   * Launches the game with the user's configuration.
   *
   * @param {any} useVolcanic If Volcanic.exe should be launched.
   * @memberof FSOLauncher
   */
  launchGame(useVolcanic) {
    let file = useVolcanic ? "Volcanic.exe" : "FreeSO.exe";

    let Toast = new ToastComponent(global.locale.TOAST_LAUNCHING, this.View);

    require("child_process").exec(
      file +
        " w -lang" +
        this.getLangCode(this.conf.Game.Language) +
        " -" +
        (this.conf.Game.GraphicsMode != "sw"
          ? this.conf.Game.GraphicsMode
          : "ogl") +
        (this.conf.Game["3DMode"] === "1" &&
        this.conf.Game["GraphicsMode"] != "sw"
          ? " -3d"
          : ""),
      {
        cwd: this.isInstalled.FSO,
      }
    );

    setTimeout(() => {
      Toast.destroy();
    }, 4000);
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
      const ws = require("windows-shortcuts");

      ws.create(
        "%UserProfile%\\Desktop\\FreeSO.lnk",
        {
          target: path + "\\FreeSO.exe",
          workingDir: path,
          desc: "Play FreeSO Online",
          runStyle: ws.MAX,
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
      const ini = require("ini");
      const fs = require("fs");

      fs.readFile(
        this.isInstalled.FSO + "\\Content\\config.ini",
        "utf8",
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
      pt: 14,
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
      0: ["English", "en"], // default
      6: ["Spanish", "es"],
      5: ["Italian", "it"],
      14: ["Portuguese", "pt"],
    };

    return languageStrings[code];
  }

  /**
   * Save the current state of the configuration.
   *
   * @param {any} showToast Display a toast while it is saving.
   * @memberof FSOLauncher
   */
  persist(showToast) {
    const Toast = new ToastComponent(global.locale.TOAST_SETTINGS, this.View);

    require("fs").writeFile(
      "FSOLauncher.ini",
      require("ini").stringify(this.conf),
      err => {
        setTimeout(() => {
          Toast.destroy();
        }, 1500);
      }
    );
  }
}

module.exports = FSOLauncher;
