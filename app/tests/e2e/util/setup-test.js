const { _electron: electron } = require( 'playwright' );
const { test } = require( '@playwright/test' );
const { findLatestBuild, parseElectronApp } = require( 'electron-playwright-helpers' );
const fs = require( 'fs-extra' );
const path = require( 'path' );

module.exports = () => {
  /** @type {import('playwright').Page} */
  let page;

  /** @type {import('playwright').ElectronApplication} */
  let electronApp;

  /** @type {string} */
  let latestBuild;

  /** @type {import('electron-playwright-helpers').ElectronAppInfo} */
  let appInfo;

  /** @type {string} */
  let exeDir;

  /** @type {string} */
  let appData;

  /** @type {string} */
  let installDir;

  /** @type {string[]} */
  let logs = [];

  test.beforeAll( () => {
    latestBuild = findLatestBuild( '../release' );
    console.log( 'latestBuild', latestBuild );
    appInfo = parseElectronApp( latestBuild );
    exeDir = path.dirname( appInfo.executable );
    appData = exeDir;
    if ( process.platform === 'darwin' ) {
      appData = require( 'os' ).homedir() + '/Library/Application Support/FreeSO Launcher';
    }
    if ( process.platform === 'linux' ) {
      appData = require( 'os' ).homedir() + '/.fsolauncher';
    }
    installDir = process.platform === 'win32' ? 'C:\\Users\\Public\\TéstFõldér' :
      appData + '/GameComponents';

    fs.existsSync( `${appData}/FSOLauncher.ini` ) && fs.unlinkSync( `${appData}/FSOLauncher.ini` );
  } );

  test.beforeEach( async () => {
    // Reset console errors at the start of each test
    logs = [];

    // Pass in --test-mode for headless testing
    const args = [ appInfo.main, '--disable-http-cache', '--fl-test-mode' ];
    /*if ( process.platform !== 'linux' ) {
      logs.push( '--fl-test-mode' );
    }*/
    electronApp = await electron.launch( {
      timeout: 60000,
      cwd: exeDir,
      args,
      executablePath: appInfo.executable // Path to the Electron executable
    } );
    console.info( '[beforeEach] launched electronApp' );

    await electronApp.evaluate( async ( { session } ) => await session.defaultSession.clearCache() );

    // Log main process
    electronApp.process().stdout.on( 'data', data => console.info( `[main] ${data}` ) );
    electronApp.process().stderr.on( 'data', error => console.info( `[main] ${error}` ) );
    electronApp.process().stderr.on( 'data', error => logs.push( `[main] ${error}` ) );

    page = await electronApp.firstWindow();
    console.info( '[beforeEach] waited for firstWindow' );

    // Log renderer process
    page.on( 'console', log => console.info( `[renderer] ${log.text()}` ) );
    page.on( 'console', log => {
      if ( log.type() === 'error' ) {
        logs.push( `[renderer] ${log.text()}` );
      }
    } );
  } );

  test.afterEach( async () => {
    try {
      console.info( '[afterEach] setting global.willQuit to true...' );
      await electronApp.evaluate( async () => global.willQuit = true );
      console.info( '[afterEach] global.willQuit has been set to true - attempting to close the app...' );
      await electronApp.close();
      console.info( '[afterEach] the app has been closed.' );
    } catch ( err ) {
      console.error( '[afterEach] an error occurred:', err );
    }
  } );

  return {
    getPage: () => page,
    getElectronApp: () => electronApp,
    getLatestBuild: () => latestBuild,
    getAppInfo: () => appInfo,
    getExeDir: () => exeDir,
    getAppData: () => appData,
    getInstallDir: () => installDir,
    getLogs: () => ( {
      main: logs.filter( log => log.includes( '[main]' ) ),
      renderer: logs.filter( log => log.includes( '[renderer]' ) ),
      all: logs,
    } ),
    /**
     * @param {string[]} excludes
     */
    restartLogs: () => ( logs = [] )
  };
};
