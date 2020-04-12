const Modal = require( '../Modal' );

/**
 * Installs OpenAL, .NET, TSO and FreeSO.
 *
 * @class CompleteInstaller
 */
class CompleteInstaller {
  /**
   * Creates an instance of CompleteInstaller.
   * @param {any} FSOLauncher
   * @memberof CompleteInstaller
   */
  constructor( FSOLauncher ) {
    this.FSOLauncher = FSOLauncher;
  }
  /**
   * Runs steps sequentially.
   *
   * @memberof CompleteInstaller
   */
  run() {
    this.step1()
      .then( () => this.step2() )
      .then( () => this.step3() )
      .then( () => this.step4() )
      .then( () => this.end() )
      .catch( () => this.error() );
  }
  /**
   * Install OpenAL.
   *
   * @returns
   * @memberof CompleteInstaller
   */
  step1() {
    this.FSOLauncher.View.fullInstallProgressItem(
      process.platform === "win32" ? global.locale.INS_OAL : "Installing SDL2...",
      global.locale.INS_WINDOW,
      process.platform === "win32" ? global.locale.INS_OAL_WINDOW : "The SDL2 Installer has been launched.",
      10
    );
    if( process.platform === "darwin" ) {
      // Skip Mono if already installed.
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
   * @returns
   * @memberof CompleteInstaller
   */
  step2() {
    this.FSOLauncher.View.fullInstallProgressItem(
      process.platform === "win32" ? global.locale.INS_NET : "Installing the Mono Framework...",
      global.locale.INS_WINDOW,
      process.platform === "win32" ? global.locale.INS_NET_WINDOW : "The Mono Runtime Installer has been launched.",
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
   * @returns
   * @memberof CompleteInstaller
   */
  step3() {
    this.FSOLauncher.View.fullInstallProgressItem(
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
   * @returns
   * @memberof CompleteInstaller
   */
  step4() {
    this.FSOLauncher.View.fullInstallProgressItem(
      global.locale.INS_FSO,
      global.locale.INS_DLEX,
      global.locale.INS_INFO,
      75
    );
    return this.FSOLauncher.install( 'FSO', { fullInstall: true } );
  }
  /**
   * When the installation finished.
   *
   * @memberof CompleteInstaller
   */
  end() {
    this.FSOLauncher.removeActiveTask( 'FULL' );
    this.FSOLauncher.View.fullInstallProgressItem(
      global.locale.INS_FINISHED,
      global.locale.INS_PLAY,
      global.locale.INS_PLAY_CLICK,
      100
    );
    Modal.sendNotification(
      'FreeSO Launcher',
      'FreeSO has finished installing and is ready to go!',
      null,
      true
    );
    setTimeout( () => {
      this.FSOLauncher.View.fullInstallProgressItem();
    }, 5000 );
  }
  /**
   * Communicates that an error happened.
   *
   * @memberof CompleteInstaller
   */
  error() {
    this.FSOLauncher.removeActiveTask( 'FULL' );
    this.FSOLauncher.View.fullInstallProgressItem(
      global.locale.INS_ERROR,
      global.locale.INS_ERROR_DESCR,
      global.locale.INS_CLOSE,
      100
    );
    setTimeout( () => {
      this.FSOLauncher.View.fullInstallProgressItem();
    }, 5000 );
  }
}

module.exports = CompleteInstaller;
