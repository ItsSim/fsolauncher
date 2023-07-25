const { _electron: electron } = require( 'playwright' );
const { test, expect } = require( '@playwright/test' );
const { findLatestBuild, parseElectronApp, stubDialog } = require( 'electron-playwright-helpers' );
const { promisify } = require( 'util' );

const path = require( 'path' );
const exec = promisify( require( 'child_process' ).exec );
const fs = require( 'fs-extra' );

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
  await window.waitForSelector( '[data-insprog="true"]' );
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

test( 'launches the app without errors', () => {
  // Setup and teardown
} );

test( 'performs a complete installation', async () => {
  // Go to installer
  await window.click( '[page-trigger="installer"]' );
  await window.waitForSelector( '#full-install-button' );

  // Open the installer modal
  await window.click( '#full-install-button' );

  // Click modal
  const modalSelector = process.platform === 'win32' ?
    '.oneclick-install' : '[data-response-id="FULL_INSTALL_CONFIRM"]';
  await window.waitForSelector( modalSelector );

  if ( process.platform === 'win32' ) {
    // Reproduce installation flow on Windows
    // Stub the file dialog to return the predefined install path for tests
    await stubDialog( electronApp, 'showOpenDialog', { filePaths: [ installDir ] } );

    // Click the 'select folder' button
    await window.click( '.oneclick-install-select' );
    await window.waitForSelector( '.oneclick-install-confirm' );

    // Click the 'confirm selected folder' button
    await window.click( '.oneclick-install-confirm' );
  } else {
    // Reproduce the installation on macOS
    // Click the 'YES' button
    await window.click( '[data-response-id="FULL_INSTALL_CONFIRM"] .yes-button' );
  }

  // Wait for full install to start
  await window.waitForSelector( '#full-install' );

  // Full install was started!
  console.info( 'test: full install started' );
  test.setTimeout( INSTALL_TIMEOUT_MS ); // Allow whole test to run for 10 mins

  // Wait for the full install to finish
  await window.waitForSelector( '#full-install', { state: 'hidden', timeout: INSTALL_TIMEOUT_MS } );

  // No error modals
  expect( await window.isVisible( '.modal-error' ) ).toBeFalsy();

  // Check the game is correctly installed
  await window.click( '[page-trigger="installer"]' );
  expect( await window.isVisible( '.item.installed[install="FSO"]' ) ).toBeTruthy();
  expect( await window.isVisible( '.item.installed[install="TSO"]' ) ).toBeTruthy();

  // Click the 'PLAY' button
  await window.click( 'button.launch' );

  // No error modals
  expect( await window.isVisible( '.modal-error' ) ).toBeFalsy();

  // Kill FreeSO.exe after launching
  await killGame();
} );

test( 'is still installed after a launcher restart', async () => {
  // Programs should still be installed after a reboot
  await window.click( '[page-trigger="installer"]' );
  expect( await window.isVisible( '.item.installed[install="FSO"]' ) ).toBeTruthy();
  expect( await window.isVisible( '.item.installed[install="TSO"]' ) ).toBeTruthy();
} );

test( 'installs Simitone', async () => {
  await window.click( '[page-trigger="simitone"]' );
  await window.click( '#simitone-install-button' );

  expect( await window.isVisible( '.modal-error' ) ).toBeFalsy();

  await window.waitForSelector( '[data-response-id="INSTALL_COMPONENT"]' );
  await window.click( '[data-response-id="INSTALL_COMPONENT"] .yes-button' );

  const dl = await window.waitForSelector( '#downloads-page .download' );
  const dlTitle = await ( await dl.$( '.progress-title' ) ).textContent();
  const dlId = await dl.getAttribute( 'id' );

  expect( dlTitle.toLowerCase() ).toContain( 'simitone' );

  console.info( 'test: remesh installation started' );
  test.setTimeout( INSTALL_TIMEOUT_MS );

  // Wait for the installer to finish
  await window.waitForSelector( `#${dlId}.stopped`, { timeout: INSTALL_TIMEOUT_MS } );

  await window.click( '[page-trigger="simitone"]' );

  expect( await window.isVisible( '#simitone-play-button' ) ).toBeTruthy();
} );

test( 'installs Remesh Package', async () => {
  await window.click( '[page-trigger="installer"]' );
  await window.click( '[install="RMS"]' );

  expect( await window.isVisible( '.modal-error' ) ).toBeFalsy();

  await window.waitForSelector( '[data-response-id="INSTALL_COMPONENT"]' );
  await window.click( '[data-response-id="INSTALL_COMPONENT"] .yes-button' );

  if ( process.platform == 'win32' ) {
    await stubDialog( electronApp, 'showOpenDialog', { filePaths: [ installDir ] } );
  }

  const dl = await window.waitForSelector( '#downloads-page .download' );
  const dlTitle = await ( await dl.$( '.progress-title' ) ).textContent();
  const dlId = await dl.getAttribute( 'id' );

  expect( dlTitle.toLowerCase() ).toContain( 'remesh' );

  console.info( 'test: remesh installation started for FreeSO' );
  test.setTimeout( INSTALL_TIMEOUT_MS );

  // Wait for the installer to finish
  await window.waitForSelector( `#${dlId}.stopped`, { timeout: INSTALL_TIMEOUT_MS } );

  const dirPath = process.platform == 'win32' ?
    installDir + '/FreeSO Game/FreeSO/Content/MeshReplace' :
    installDir + '/FreeSO/Content/MeshReplace';

  expect( await fs.pathExists( dirPath ) ).toBeTruthy();
  expect( ( await fs.readdir( dirPath ) ).length ).toBeGreaterThan( 0 );

  // Now for Simitone
  const dlSimitone = await window.waitForSelector( '#downloads-page .download:not(.stopped)' );
  const dlTitleSimitone = await ( await dlSimitone.$( '.progress-title' ) ).textContent();
  const dlIdSimitone = await dlSimitone.getAttribute( 'id' );

  expect( dlTitleSimitone.toLowerCase() ).toContain( 'remesh' );

  console.info( 'test: remesh installation started for Simitone' );
  test.setTimeout( INSTALL_TIMEOUT_MS );

  // Wait for the installer to finish
  await window.waitForSelector( `#${dlIdSimitone}.stopped`, { timeout: INSTALL_TIMEOUT_MS } );

  const dirPathSimitone = installDir + '/Simitone for Windows/Content/MeshReplace';

  expect( await fs.pathExists( dirPathSimitone ) ).toBeTruthy();
  expect( ( await fs.readdir( dirPathSimitone ) ).length ).toBeGreaterThan( 0 );
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