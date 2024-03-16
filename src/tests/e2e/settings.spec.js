const { test, expect } = require( '@playwright/test' );
const setupTest = require( './util/setup-test' );

test.describe( 'settings', () => {
  const T = setupTest();

  test( 'changes the theme', async () => {
    await T.getWindow().locator( '[page-trigger="settings"]' ).click();
    await T.getWindow().locator( '[option-id="Launcher.Theme"]' ).selectOption( 'indigo' );

    const bodyClass = await T.getWindow().locator( 'body' ).getAttribute( 'class' );

    expect( bodyClass.includes( 'indigo' ) || bodyClass.includes( 'halloween' ) ).toBeTruthy();
  } );
} );