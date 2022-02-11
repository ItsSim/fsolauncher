const Modal = require( '../modal' ),
// eslint-disable-next-line no-unused-vars
FSOLauncher = require( '../../fsolauncher' );

/**
 * Installs OpenAL, .NET, Mono, SDL, TSO and FreeSO.
 */
class CompleteInstaller {
  /**
   * @param {FSOLauncher} FSOLauncher The FSOLauncher instance.
   */
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
  }
  /**
   * Runs steps sequentially.
   */
  async run() {
    try {
      await this.step1();
      await this.step2();
      await this.step3();
      await this.step4();
      this.end();
    } catch( ErrorMessage ) {
      this.error();
    }
  }
  /**
   * Install OpenAL.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step1() {
    this.FSOLauncher.IPC.fullInstallProgressItem(
      process.platform === "win32" ? global.locale.INS_OAL : global.locale.INS_SDL,
      global.locale.INS_WINDOW,
      process.platform === "win32" ? global.locale.INS_OAL_WINDOW : global.locale.INS_SDL_WINDOW,
      10
    );
    if( process.platform === "darwin" ) {
      // Skip SDL if already installed.
      if ( this.FSOLauncher.isInstalled['SDL'] ) {
        return Promise.resolve();
      }
      return this.FSOLauncher.install( 'SDL', { fullInstall: true } );
    }
    if ( this.FSOLauncher.isInstalled['OpenAL'] ) {
      return Promise.resolve();
    }
    return this.FSOLauncher.install( 'OpenAL' );
  }
  /**
   * Install .NET Framework.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step2() {
    this.FSOLauncher.IPC.fullInstallProgressItem(
      process.platform === "win32" ? global.locale.INS_NET : global.locale.INS_MONO,
      global.locale.INS_WINDOW,
      process.platform === "win32" ? global.locale.INS_NET_WINDOW : global.locale.INS_MONO_WINDOW,
      25
    );
    if( process.platform === "darwin" ) {
      // Skip Mono if already installed.
      if ( this.FSOLauncher.isInstalled['Mono'] ) {
        return Promise.resolve();
      }
      return this.FSOLauncher.install( 'Mono', { fullInstall: true } );
    }
    // Skip .NET if already installed.
    if ( this.FSOLauncher.isInstalled['NET'] ) {
      return Promise.resolve();
    }
    return this.FSOLauncher.install( 'NET' );
  }
  /**
   * Installs The Sims Online.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step3() {
    this.FSOLauncher.IPC.fullInstallProgressItem(
      global.locale.INS_TSO,
      global.locale.INS_DLEX,
      global.locale.INS_INFO,
      50
    );
    return this.FSOLauncher.install( 'TSO', { fullInstall: true } );
  }
  /**
   * Installs FreeSO.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step4() {
    this.FSOLauncher.IPC.fullInstallProgressItem(
      global.locale.INS_FSO,
      global.locale.INS_DLEX,
      global.locale.INS_INFO,
      75
    );
    return this.FSOLauncher.install( 'FSO', { fullInstall: true } );
  }
  /**
   * When the installation finished.
   */
  end() {
    this.FSOLauncher.removeActiveTask( 'FULL' );
    this.FSOLauncher.IPC.fullInstallProgressItem(
      global.locale.INS_FINISHED,
      global.locale.INS_PLAY,
      global.locale.INS_PLAY_CLICK,
      100
    );
    Modal.sendNotification(
      'FreeSO Launcher',
      global.locale.INS_FINISHED_LONG,
      null,
      true,
      this.FSOLauncher.isDarkMode()
    );
    setTimeout( () => {
      this.FSOLauncher.IPC.fullInstallProgressItem();
    }, 5000 );
  }
  /**
   * Communicates that an error happened.
   */
  error() {
    this.FSOLauncher.removeActiveTask( 'FULL' );
    this.FSOLauncher.IPC.fullInstallProgressItem(
      global.locale.INS_ERROR,
      global.locale.INS_ERROR_DESCR,
      global.locale.INS_CLOSE,
      100
    );
    setTimeout( () => {
      this.FSOLauncher.IPC.fullInstallProgressItem();
    }, 5000 );
  }
}

module.exports = CompleteInstaller;
