const { test, expect } = require( '@playwright/test' );
const setupTest = require( './util/setup-test' );
const fs = require( 'fs-extra' );
const path = require( 'path' );

test.describe( 'home', () => {
  const blogXML = fs.readFileSync( path.join( __dirname, './sample-data/blog.xml' ), 'utf8' );
  const lotsJSON = JSON.stringify( require( './sample-data/trending-lots.json' ) );

  const T = setupTest();

  test.skip( 'parses and displays RSS feed items correctly', async () => {
    // Intercept the RSS feed URL and respond with the sample XML
    await T.getPage().context().route( '**/feed/', route => {
      route.fulfill( {
        status: 200,
        contentType: 'application/rss+xml',
        body: blogXML,
      } );
    } );

    await T.getPage().locator( '#refresh-home-button' ).click();

    await T.getPage().locator( '#home-loading' ).waitFor( { state: 'hidden' } );

    // Check for the correct number of feed items displayed
    const feedItemCount = await T.getPage().locator( '.rss-entry' ).count();
    expect( feedItemCount ).toBe( 10 );

    // Check the title and description of the first feed item
    const firstItemTitle = await T.getPage().locator( '.rss-entry:first-child .article-title' ).innerText();
    const firstItemDescription = await T.getPage().locator( '.rss-entry:first-child .rss-content' ).innerText();

    expect( firstItemTitle ).toContain( 'e2e'.toUpperCase() );
    expect( firstItemDescription ).toContain( 'The Sims Online is all about escapism' );
  } );

  test.skip( 'displays an error message when the RSS feed cannot be fetched', async () => {
    // Intercept the RSS feed URL and respond with an error
    await T.getPage().context().route( '**/feed/', route => route.fulfill( { status: 500 } ) );

    await T.getPage().locator( '#refresh-home-button' ).click();

    await T.getPage().locator( '#home-loading' ).waitFor( { state: 'hidden' } );

    // Check for an error message
    // Assuming 'rss-error' class is used for displaying fetch errors
    const isErrorVisible = await T.getPage().locator( '#blog .alt-content' ).isVisible();
    expect( isErrorVisible ).toBeTruthy();
  } );

  test( 'shows populated trending lots widget', async () => {
    // Intercept and mock an HTTP response
    await T.getPage().context().route( '**/TrendingLots', ( route ) => {
      // Respond with a mocked JSON object
      route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: lotsJSON,
      } );
    } );

    await T.getPage().locator( '#refresh-home-button' ).click();

    await T.getPage().locator( '#now-trending' ).waitFor();

    expect( await T.getPage().locator( '#now-trending .top span i' ).innerText() ).toBe( '300' );
    expect( await T.getPage().locator( '#now-trending ul li' ).count() ).toBe( 10 );
    const firstLotName = await T.getPage().locator( '#now-trending ul li:first-child .lot-name' ).innerText();
    expect( firstLotName.includes( 'e2e' ) ).toBeTruthy();
  } );
} );