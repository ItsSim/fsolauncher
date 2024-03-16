const { test, expect } = require( '@playwright/test' );
const fs = require( 'fs-extra' );
const setupTest = require( './setup-test' );

test.describe( 'main', () => {
  const T = setupTest( test );

  test( 'starts the app', () => {
    // Setup and teardown
  } );

  test( 'config file is present', async () => {
    expect( await fs.exists( T.getAppData() + '/FSOLauncher.ini' ) ).toBeTruthy();
  } );
} );