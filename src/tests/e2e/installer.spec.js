const { _electron: electron } = require( 'playwright' );
const { test, expect } = require( '@playwright/test' );
const { findLatestBuild, parseElectronApp, stubDialog } = require( 'electron-playwright-helpers' );
const { promisify } = require( 'util' );

const path = require( 'path' );
const exec = promisify( require( 'child_process' ).exec );
const fs = require( 'fs-extra' );

test.describe( 'installer', () => {

  // Timeout for long tests
  const INSTALL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  /** @type {import('playwright').Page} */
  let window;

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

  test.beforeAll( () => {
    latestBuild = findLatestBuild( '../release' );
    appInfo = parseElectronApp( latestBuild );
    exeDir = path.dirname( appInfo.executable );
    appData = process.platform == 'win32' ? exeDir :
      require( 'os' ).homedir() + '/Library/Application Support/FreeSO Launcher';
    installDir = process.platform == 'win32' ? 'C:\\Users\\Public\\TéstFõldér' :
      require( 'os' ).homedir() + '/Documents';

    fs.existsSync( `${appData}/FSOLauncher.ini` ) && fs.unlinkSync( `${appData}/FSOLauncher.ini` );
  } );

  test.beforeEach( async () => {
  // Pass in --test-mode for headless testing
    electronApp = await electron.launch( {
      timeout: 60000,
      cwd: exeDir,
      args: [ appInfo.main, '--test-mode=true' ], // Main file from package.json
      executablePath: appInfo.executable // Path to the Electron executable
    } );
    console.info( '[beforeEach] launched electronApp' );

    // Log main process
    electronApp.process().stdout.on( 'data', data => console.info( `[main] ${data}` ) );
    electronApp.process().stderr.on( 'data', error => console.info( `[main] ${error}` ) );

    window = await electronApp.firstWindow();
    console.info( '[beforeEach] waited for firstWindow' );

    // Log renderer process
    window.on( 'console', log => console.info( `[renderer] ${log.text()}` ) );

    await window.waitForLoadState( 'load' ); // Waits for the page to be completely loaded
    console.info( '[beforeEach] achieved loadState' );
    await window.locator( '[data-insprog="true"]' ).waitFor();
    console.info( '[beforeEach] INS_PROG was received by renderer' );
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

  test( 'performs a complete installation', async () => {
    await window.locator( '[page-trigger="installer"]' ).click();
    await window.locator( '#full-install-button' ).waitFor();
    await window.locator( '#full-install-button' ).click();

    if ( process.platform === 'win32' ) {
      await stubDialog( electronApp, 'showOpenDialog', { filePaths: [ installDir ] } );
      await window.locator( '.oneclick-install-select' ).click();
      await window.locator( '.oneclick-install-confirm' ).click();
    } else {
      await window.locator( '[data-response-id="FULL_INSTALL_CONFIRM"] .yes-button' ).click();
    }

    // Full installation started
    expect( await window.locator( '#full-install' ).isVisible() ).toBeTruthy();

    // Wait for the installation to finish
    test.setTimeout( INSTALL_TIMEOUT_MS );
    await window.locator( '#full-install' ).waitFor( { state: 'hidden', timeout: INSTALL_TIMEOUT_MS } );

    // Expect no errors when the installation finishes
    expect( await window.locator( '.modal-error' ).isVisible() ).toBeFalsy();

    // Go to the installer and make sure the checkmarks are there
    await window.locator( '[page-trigger="installer"]' ).click();
    expect( await window.locator( '.item.installed[install="FSO"]' ).isVisible() ).toBeTruthy();
    expect( await window.locator( '.item.installed[install="TSO"]' ).isVisible() ).toBeTruthy();

    await window.locator( 'button.launch' ).click();

    // Expect no errors when launching the game
    expect( await window.locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await killGame();
  } );

  test( 'is still installed after a launcher restart', async () => {
    await window.locator( '[page-trigger="installer"]' ).click();
    expect( await window.locator( '.item.installed[install="FSO"]' ).isVisible() ).toBeTruthy();
    expect( await window.locator( '.item.installed[install="TSO"]' ).isVisible() ).toBeTruthy();
  } );

  test( 'installs Simitone', async () => {
    await window.locator( '[page-trigger="simitone"]' ).click();
    await window.locator( '#simitone-install-button' ).click();

    expect( await window.locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await window.locator( '[data-response-id="INSTALL_COMPONENT"] .yes-button' ).click();

    if ( process.platform == 'win32' ) {
      await stubDialog( electronApp, 'showOpenDialog', { filePaths: [ installDir ] } );
    }

    const dlTitle = await window.locator( '#downloads-page .download .progress-title' ).textContent();
    const dlId = await window.locator( '#downloads-page .download' ).getAttribute( 'id' );

    expect( dlTitle.toLowerCase() ).toContain( 'simitone' );

    console.info( 'test: Simitone installation started' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await window.locator( `#${dlId}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    await window.locator( '[page-trigger="simitone"]' ).click();
    await window.locator( '#simitone-play-button' ).waitFor();
  } );

  test( 'installs Remesh Package', async () => {
    await window.locator( '[page-trigger="installer"]' ).click();
    await window.locator( '[install="RMS"]' ).click();

    expect( await window.locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await window.locator( '[data-response-id="INSTALL_COMPONENT"] .yes-button' ).click();

    const dlTitle = await window.locator( '#downloads-page .download .progress-title' ).textContent();
    const dlId = await window.locator( '#downloads-page .download' ).getAttribute( 'id' );

    expect( dlTitle.toLowerCase() ).toContain( 'remesh' );

    console.info( 'test: Remesh package installation started for FreeSO' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await window.locator( `#${dlId}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    const dirPath = process.platform == 'win32' ?
      installDir + '/FreeSO Game/FreeSO/Content/MeshReplace' :
      installDir + '/FreeSO/Content/MeshReplace';

    expect( await fs.pathExists( dirPath ) ).toBeTruthy();
    expect( ( await fs.readdir( dirPath ) ).length ).toBeGreaterThan( 0 );

    // Now for Simitone
    const dlTitleSimitone = await window.locator( '#downloads-page .download:not(.stopped) .progress-title' ).textContent();
    const dlIdSimitone = await window.locator( '#downloads-page .download:not(.stopped)' ).getAttribute( 'id' );

    expect( dlTitleSimitone.toLowerCase() ).toContain( 'remesh' );

    console.info( 'test: Remesh package installation started for Simitone' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await window.locator( `#${dlIdSimitone}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    const dirPathSimitone = installDir + '/Simitone for Windows/Content/MeshReplace';

    expect( await fs.pathExists( dirPathSimitone ) ).toBeTruthy();
    expect( ( await fs.readdir( dirPathSimitone ) ).length ).toBeGreaterThan( 0 );
  } );
} );

async function killGame() {
  // Kill FreeSO.exe on Windows and macOS
  if ( process.platform === 'win32' ) {
    try {
      console.info( 'killing any running instances of freeso.exe...' );
      console.info( await exec( 'taskkill /F /IM freeso.exe' ) );
    } catch ( err ) {
      console.error( 'error killing freeso:', err );
    }
  } else if ( process.platform === 'darwin' ) {
    try {
      console.info( 'killing any running instances of FreeSO on macOS...' );
      // 'pgrep' finds the process ID of a running program
      const { stdout: pid } = await exec( 'pgrep -f freeso.command' );
      // 'pkill' kills the process by its ID
      console.info( await exec( `pkill -TERM ${pid}` ) );
    } catch ( err ) {
      console.error( 'error killing FreeSO:', err );
    }
  }
}