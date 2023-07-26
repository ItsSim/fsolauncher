const { _electron: electron } = require( 'playwright' );
const { test, expect } = require( '@playwright/test' );
const { findLatestBuild, parseElectronApp } = require( 'electron-playwright-helpers' );
const fs = require( 'fs-extra' );

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

test.beforeAll( () => {
  latestBuild = findLatestBuild( '../release' );
  appInfo = parseElectronApp( latestBuild );
  exeDir = require( 'path' ).dirname( appInfo.executable );
  appData = process.platform == 'win32' ? exeDir :
    require( 'os' ).homedir() + '/Library/Application Support/FreeSO Launcher';
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

test( 'starts the app', () => {
  // Setup and teardown
} );

test( 'config file is present', async () => {
  expect( await fs.exists( appData + '/FSOLauncher.ini' ) ).toBeTruthy();
} );

