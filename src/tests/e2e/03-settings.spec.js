const { test, expect } = require( '@playwright/test' );
const setupTest = require( './util/setup-test' );

test.describe( 'settings', () => {
  const T = setupTest();

  test.beforeEach( async () => {
    await T.getWindow().locator( '[page-trigger="settings"]' ).click();
  } );

  test( 'changes the theme', async () => {
    await T.getWindow().locator( '[option-id="Launcher.Theme"]' ).selectOption( 'indigo' );

    const bodyClass = await T.getWindow().locator( 'body' ).getAttribute( 'class' );

    expect( bodyClass.includes( 'indigo' ) || bodyClass.includes( 'halloween' ) ).toBeTruthy();
  } );

  test( 'contains valid graphics modes for OS', async () => {
    const dropdown = T.getWindow().locator( 'select[option-id="Game.GraphicsMode"]' );
    await dropdown.waitFor( { state: 'visible' } );
    await dropdown.hover();
    await dropdown.click();

    // Fetch all option element handles
    const graphicsModesOptionsHandles = await T.getWindow().locator( '[option-id="Game.GraphicsMode"] option' ).elementHandles();

    // Filter out invisible options and then map to their values
    const graphicsModesValues = await Promise.all(
      graphicsModesOptionsHandles
        .map( async ( handle ) => {
          const isVisible = await handle.isVisible();
          const value = await handle.getAttribute( 'value' );
          return isVisible ? value : null;
        } )
    );

    // Filter out null values resulting from invisible options
    const visibleGraphicsModesValues = graphicsModesValues.filter( value => value !== null );

    // Now visibleGraphicsModesValues should only contain values of visible options
    if ( process.platform === 'darwin' ) {
      expect( visibleGraphicsModesValues ).not.toContain( 'dx' );
      expect( visibleGraphicsModesValues ).not.toContain( 'sw' );
    } else {
      expect( visibleGraphicsModesValues ).toContain( 'dx' );
      expect( visibleGraphicsModesValues ).toContain( 'sw' );
    }
  } );


} );