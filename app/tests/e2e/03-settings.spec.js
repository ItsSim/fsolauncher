const { test, expect } = require( '@playwright/test' );
const setupTest = require( './util/setup-test' );

test.describe( 'settings', () => {
  const T = setupTest();

  test.beforeEach( async () => {
    await T.getPage().locator( '[page-trigger="settings"]' ).dblclick();
  } );

  test( 'changes the theme', async () => {
    await T.getPage().locator( '[option-id="Launcher.Theme"]' ).selectOption( 'indigo' );

    const bodyClass = await T.getPage().locator( 'body' ).getAttribute( 'class' );

    expect( bodyClass.includes( 'indigo' ) || bodyClass.includes( 'halloween' ) ).toBeTruthy();
  } );

  test( 'contains valid graphics modes for OS', async () => {
    const dropdown = T.getPage().locator( 'select[option-id="Game.GraphicsMode"]' );
    await dropdown.waitFor( { state: 'visible' } );

    // Fetch all option element handles
    const graphicsModesOptionsHandles = await T.getPage().locator( '[option-id="Game.GraphicsMode"] option' ).elementHandles();

    // Evaluate the display style of each option to determine visibility
    const graphicsModesValues = await Promise.all(
      graphicsModesOptionsHandles.map( async ( handle ) => {
        // Use evaluate to check the computed style directly in the browser context
        const displayStyle = await handle.evaluate( el => window.getComputedStyle( el ).display );
        // If the display style is not 'none', consider the element as visible and return its value
        if ( displayStyle !== 'none' ) {
          return handle.getAttribute( 'value' );
        }
        return null; // Otherwise, return null to indicate the option is not visible
      } )
    );

    // Filter out null values resulting from options with display: none
    const visibleGraphicsModesValues = graphicsModesValues.filter( value => value !== null );

    // Assertions based on expected visible options
    if ( [ 'darwin', 'linux' ].includes( process.platform ) ) {
      expect( visibleGraphicsModesValues ).not.toContain( 'dx' );
      expect( visibleGraphicsModesValues ).not.toContain( 'sw' );
    } else {
      expect( visibleGraphicsModesValues ).toContain( 'dx' );
      expect( visibleGraphicsModesValues ).toContain( 'sw' );
    }
  } );



} );