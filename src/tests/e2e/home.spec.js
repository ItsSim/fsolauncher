const { test, expect } = require( '@playwright/test' );
const setupTest = require( './util/setup-test' );
const fs = require( 'fs-extra' );
const path = require( 'path' );

test.describe( 'home', () => {
  const T = setupTest();

  test( 'parses and displays RSS feed items correctly', async () => {
    const xmlContent = fs.readFileSync( path.join( __dirname, './sample-data/blog.xml' ), 'utf8' );

    // Intercept the RSS feed URL and respond with the sample XML
    await T.getWindow().context().route( '**/feed/', route => {
      route.fulfill( {
        status: 200,
        contentType: 'application/rss+xml',
        body: xmlContent,
      } );
    } );

    await T.getWindow().locator( '#rss-loading' ).waitFor( { state: 'hidden' } );

    // Check for the correct number of feed items displayed
    const feedItemCount = await T.getWindow().locator( '.rss-entry' ).count();
    expect( feedItemCount ).toBe( 10 );

    // Check the title and description of the first feed item
    const firstItemTitle = await T.getWindow().locator( '.rss-entry:first-child .article-title' ).innerText();
    const firstItemDescription = await T.getWindow().locator( '.rss-entry:first-child .rss-content' ).innerText();

    expect( firstItemTitle ).toContain( 'e2e' );
    expect( firstItemDescription ).toContain( 'The Sims Online is all about escapism' );
  } );

  test( 'displays an error message when the RSS feed cannot be fetched', async () => {
    // Intercept the RSS feed URL and respond with an error
    await T.getWindow().context().route( '**/feed/', route => route.fulfill( { status: 500 } ) );

    await T.getWindow().locator( '#rss-loading' ).waitFor( { state: 'hidden' } );

    // Check for an error message
    // Assuming 'rss-error' class is used for displaying fetch errors
    const isErrorVisible = await T.getWindow().locator( '#rss .alt-content' ).isVisible();
    expect( isErrorVisible ).toBeTruthy();
  } );

  test( 'shows populated trending lots widget', async () => {
    // Intercept and mock an HTTP response
    await T.getWindow().context().route( '**/TrendingLots', ( route ) => {
      // Respond with a mocked JSON object
      route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify( require( './sample-data/trending-lots.json' ) ),
      } );
    } );

    await T.getWindow().locator( '#now-trending' ).waitFor();

    expect( await T.getWindow().locator( '#now-trending .top span i' ).innerText() ).toBe( '300' );
    expect( await T.getWindow().locator( '#now-trending ul li' ).count() ).toBe( 10 );
    const firstLotName = await T.getWindow().locator( '#now-trending ul li:first-child .lot-name' ).innerText();
    expect( firstLotName.includes( 'e2e' ) ).toBeTruthy();
  } );

  test( 'shows empty trending lots widget on error', async () => {
    // Intercept and mock an HTTP response
    await T.getWindow().context().route( '**/TrendingLots', ( route ) => route.fulfill( { status: 500 } ) );

    await T.getWindow().locator( '#now-trending' ).waitFor();
    expect( await T.getWindow().locator( '#now-trending .top span i' ).innerText() ).toBe( '0' );
    expect( await T.getWindow().locator( '#now-trending ul li' ).count() ).toBe( 0 );
  } );
} );