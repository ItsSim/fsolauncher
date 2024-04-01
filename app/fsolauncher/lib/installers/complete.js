const { locale } = require( '../locale' );

/**
 * Installs OpenAL, .NET, Mono, SDL, TSO and FreeSO.
 */
class CompleteInstaller {
  /**
   * @param {import('../../fsolauncher')} fsolauncher The FSOLauncher instance.
   */
  constructor( fsolauncher ) {
    this.fsolauncher = fsolauncher;
  }

  /**
   * Runs steps sequentially.
   *
   * @param {string} folder The folder to install everything to.
   */
  async install( folder ) {
    try {
      await this.step1();
      await this.step2();
      await this.step3( folder );
      await this.step4( folder );
      this.end();
    } catch ( err ) {
      this.error( err );
      throw err; // Send it back to the caller.
    }
  }

  /**
   * Install OpenAL.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step1() {
    this.fsolauncher.IPC.fullInstallProgressItem(
      process.platform === 'win32' ? locale.current.INS_OAL : locale.current.INS_SDL,
      locale.current.INS_WINDOW,
      process.platform === 'win32' ? locale.current.INS_OAL_WINDOW : locale.current.INS_SDL_WINDOW,
      10
    );
    if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
      // Skip SDL if already installed.
      if ( this.fsolauncher.isInstalled[ 'SDL' ] ) {
        return Promise.resolve();
      }
      return this.fsolauncher.install( 'SDL', { fullInstall: true } );
    }
    if ( this.fsolauncher.isInstalled[ 'OpenAL' ] ) {
      return Promise.resolve();
    }
    return this.fsolauncher.install( 'OpenAL', { fullInstall: true } );
  }

  /**
   * Install .NET Framework.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step2() {
    this.fsolauncher.IPC.fullInstallProgressItem(
      process.platform === 'win32' ? locale.current.INS_NET : locale.current.INS_MONO,
      locale.current.INS_WINDOW,
      process.platform === 'win32' ? locale.current.INS_NET_WINDOW : locale.current.INS_MONO_WINDOW,
      25
    );
    if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
      // Skip Mono if already installed.
      if ( this.fsolauncher.isInstalled[ 'Mono' ] ) {
        return Promise.resolve();
      }
      return this.fsolauncher.install( 'Mono', { fullInstall: true } );
    }
    // Skip .NET if already installed.
    if ( this.fsolauncher.isInstalled[ 'NET' ] ) {
      return Promise.resolve();
    }
    return this.fsolauncher.install( 'NET', { fullInstall: true } );
  }

  /**
   * Installs The Sims Online.
   *
   * @param {string} folder The folder to install TSO to.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step3( folder ) {
    this.fsolauncher.IPC.fullInstallProgressItem(
      locale.current.INS_TSO,
      locale.current.INS_DLEX,
      locale.current.INS_INFO,
      50
    );
    if ( folder ) {
      folder = folder + '/' + this.fsolauncher.getPrettyName( 'TSO' );
    }
    return this.fsolauncher.install( 'TSO', { fullInstall: true, dir: folder } );
  }

  /**
   * Installs FreeSO.
   *
   * @param {string} folder The folder to install FreeSO to.
   *
   * @returns {Promise<void>} A promise that resolves when the installation is finished.
   */
  step4( folder ) {
    this.fsolauncher.IPC.fullInstallProgressItem(
      locale.current.INS_FSO,
      locale.current.INS_DLEX,
      locale.current.INS_INFO,
      75
    );
    if ( folder ) {
      folder = folder + '/' + this.fsolauncher.getPrettyName( 'FSO' );
    }
    return this.fsolauncher.install( 'FSO', { fullInstall: true, dir: folder } );
  }

  /**
   * When the installation finished.
   */
  end() {
    this.fsolauncher.IPC.fullInstallProgressItem(
      locale.current.INS_FINISHED,
      locale.current.INS_PLAY,
      locale.current.INS_PLAY_CLICK,
      100
    );
  }

  /**
   * When the installation errors out.
   *
   * @param {Error} err The error object.
   */
  error( err ) {
    this.fsolauncher.IPC.fullInstallProgressItem(
      locale.current.INS_ERROR,
      locale.current.INS_ERROR_DESCR + ' ' + err,
      locale.current.INS_CLOSE,
      100
    );
  }
}

module.exports = CompleteInstaller;
