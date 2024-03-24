const { test, expect } = require( '@playwright/test' );
const { stubDialog } = require( 'electron-playwright-helpers' );
const { promisify } = require( 'util' );

const exec = promisify( require( 'child_process' ).exec );
const fs = require( 'fs-extra' );
const setupTest = require( './util/setup-test' );

test.describe( 'installer', () => {
  // Timeout for long tests
  const INSTALL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  const T = setupTest();

  test( 'performs a complete installation', async () => {
    await T.getPage().locator( '[page-trigger="installer"]' ).click();
    await T.getPage().locator( '#full-install-button' ).waitFor();
    await T.getPage().locator( '#full-install-button' ).click();

    if ( process.platform === 'win32' ) {
      await stubDialog( T.getElectronApp(), 'showOpenDialog', { filePaths: [ T.getInstallDir() ] } );
      await T.getPage().locator( '.oneclick-install-select' ).click();
      await T.getPage().locator( '.oneclick-install-confirm' ).click();
    } else {
      await T.getPage().locator( '[data-response-id="FULL_INSTALL_CONFIRM"] .yes-button' ).click();
    }

    // Full installation started
    expect( await T.getPage().locator( '#full-install' ).isVisible() ).toBeTruthy();

    // Wait for the installation to finish
    test.setTimeout( INSTALL_TIMEOUT_MS );
    await T.getPage().locator( '#full-install' ).waitFor( { state: 'hidden', timeout: INSTALL_TIMEOUT_MS } );

    // Expect no errors when the installation finishes
    expect( await T.getPage().locator( '.modal-error' ).isVisible() ).toBeFalsy();

    // Go to the installer and make sure the checkmarks are there
    await T.getPage().locator( '[page-trigger="installer"]' ).dblclick();
    expect( await T.getPage().locator( '.item.installed[install="FSO"]' ).isVisible() ).toBeTruthy();
    expect( await T.getPage().locator( '.item.installed[install="TSO"]' ).isVisible() ).toBeTruthy();

    await T.getPage().locator( 'button.launch' ).click();

    // Expect no errors when launching the game
    expect( await T.getPage().locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await killGame();
  } );

  test( 'is still installed after a launcher restart', async () => {
    await T.getPage().locator( '[page-trigger="installer"]' ).click();
    await T.getPage().locator( '.item.installed[install="FSO"]' ).waitFor( { state: 'visible' } );
    await T.getPage().locator( '.item.installed[install="TSO"]' ).waitFor( { state: 'visible' } );
  } );

  test( 'installs Simitone', async () => {
    await T.getPage().locator( '[page-trigger="simitone"]' ).click();
    await T.getPage().locator( '#simitone-install-button' ).click();

    expect( await T.getPage().locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await T.getPage().locator( '[data-response-id="INSTALL_COMPONENT"] .yes-button' ).click();

    if ( process.platform == 'win32' ) {
      await stubDialog( T.getElectronApp(), 'showOpenDialog', { filePaths: [ T.getInstallDir() ] } );
    }

    const dlTitle = await T.getPage().locator( '#downloads-page .download .progress-title' ).textContent();
    const dlId = await T.getPage().locator( '#downloads-page .download' ).getAttribute( 'id' );

    expect( dlTitle.toLowerCase() ).toContain( 'simitone' );

    console.info( 'test: Simitone installation started' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await T.getPage().locator( `#${dlId}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    await T.getPage().locator( '[page-trigger="simitone"]' ).click();
    await T.getPage().locator( '#simitone-play-button' ).waitFor();
  } );

  test( 'installs Remesh Package', async () => {
    await T.getPage().locator( '[page-trigger="installer"]' ).click();
    await T.getPage().locator( '.item.installed[install="FSO"]' ).waitFor( { state: 'visible' } );
    await T.getPage().locator( '[install="RMS"]' ).click();

    expect( await T.getPage().locator( '.modal-error' ).isVisible() ).toBeFalsy();

    await T.getPage().locator( '[data-response-id="INSTALL_COMPONENT"] .yes-button' ).click();

    const dlTitle = await T.getPage().locator( '#downloads-page .download .progress-title' ).textContent();
    const dlId = await T.getPage().locator( '#downloads-page .download' ).getAttribute( 'id' );

    expect( dlTitle.toLowerCase() ).toContain( 'remesh' );

    console.info( 'test: Remesh package installation started for FreeSO' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await T.getPage().locator( `#${dlId}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    const dirPath = process.platform == 'win32' ?
      T.getInstallDir() + '/FreeSO Game/FreeSO/Content/MeshReplace' :
      T.getInstallDir() + '/FreeSO/Content/MeshReplace';

    expect( await fs.pathExists( dirPath ) ).toBeTruthy();
    expect( ( await fs.readdir( dirPath ) ).length ).toBeGreaterThan( 0 );

    // Now for Simitone
    const dlTitleSimitone = await T.getPage().locator( '#downloads-page .download:not(.stopped) .progress-title' ).textContent();
    const dlIdSimitone = await T.getPage().locator( '#downloads-page .download:not(.stopped)' ).getAttribute( 'id' );

    expect( dlTitleSimitone.toLowerCase() ).toContain( 'remesh' );

    console.info( 'test: Remesh package installation started for Simitone' );
    test.setTimeout( INSTALL_TIMEOUT_MS );

    // Wait for the installer to finish
    await T.getPage().locator( `#${dlIdSimitone}.stopped` ).waitFor( { timeout: INSTALL_TIMEOUT_MS } );

    const dirPathSimitone = T.getInstallDir() + '/Simitone for Windows/Content/MeshReplace';

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