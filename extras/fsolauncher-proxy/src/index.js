const express = require( 'express' );
const axios = require( 'axios' );
const { parseStringPromise } = require( 'xml2js' ); // Promisified version for async/await
const app = express();
const port = 30631;
const lotsUpdateInterval = 5; // minutes
const blogUpdateInterval = 60; // 1 req every hour

// Cache for trending lots
let trendingLots = [];
let avatarsOnline = 0;
let lastUpdateTime = 0;

const getImageAsBase64 = async ( url ) => {
  try {
    const response = await axios.get( url, { responseType: 'arraybuffer' } );
    return Buffer.from( response.data, 'binary' ).toString( 'base64' );
  } catch ( error ) {
    console.error( 'Failed to get image:', { url, message: error.message } );
    return null;
  }
};

// Function to update trending lots
const updateTrendingLots = async () => {
  try {
    // Get avatars online
    const avatarsOnlineResponse = await axios.get( 'https://api.freeso.org/userapi/avatars/online?compact=true' );
    avatarsOnline = avatarsOnlineResponse.data.avatars_online_count;

    // Get online lots
    const onlineLotsResponse = await axios.get( 'https://api.freeso.org/userapi/city/1/lots/online' );
    const onlineLots = onlineLotsResponse.data.lots;

    // Sort by avatars_in_lot and pick the top 10
    const sortedLots = onlineLots.sort( ( a, b ) => b.avatars_in_lot - a.avatars_in_lot ).slice( 0, 10 );

    // Get additional details for each lot
    for ( let lot of sortedLots ) {
      const lotDetailsResponse = await axios.get( `https://api.freeso.org/userapi/city/1/lots/location/${lot.location}` );
      const ownerId = lotDetailsResponse.data.owner_id;
      const ownerDetailsResponse = await axios.get( `https://api.freeso.org/userapi/avatars/?ids=${ownerId}` );

      lot.ownerDetails = ownerDetailsResponse.data.avatars[0];

      // Fetch and attach the base64 image
      const imageUrl = `https://api.freeso.org/userapi/city/1/${lot.location}.png`;
      lot.base64Image = await getImageAsBase64( imageUrl );

      lot.is_trending = lot.avatars_in_lot >= 8;
    }

    trendingLots = sortedLots;
    lastUpdateTime = Date.now();
  } catch ( error ) {
    console.error( 'Failed to update trending lots:', error );
  }
};

// Assuming `cachedRSSData` is declared at the top level to store our RSS feed data
const cachedBlogData = [];

// Helper function to extract all image URLs from content
const extractImageUrls = content => {
  const matches = [ ...content.matchAll( /<img.*?src=["'](.*?)["']/g ) ];
  return matches.map( match => match[1] );
};

// Helper function to extract excerpt from content
const extractExcerpt = content => {
  const targetLength = 138; // Target length of the excerpt
  const strippedContent = content.replace( /(<([^>]+)>)/gi, '' ).trim(); // Remove HTML tags and trim

  if ( strippedContent.length <= targetLength ) {
    return strippedContent;
  }

  // Find the last space before the target length to avoid cutting in the middle of a word
  let endIndex = strippedContent.lastIndexOf( ' ', targetLength );
  if ( endIndex === -1 ) {
    // In case there's no space (e.g., a very long word), use the target length to avoid overflow
    endIndex = targetLength;
  }

  return strippedContent.substring( 0, endIndex ) + '...';
};

// Updated function to fetch and cache RSS feed, including multiple image handling
const updateBlogFeed = async () => {
  try {
    const feedUrl = 'https://freeso.org/feed/';
    const response = await axios.get( feedUrl );
    const result = await parseStringPromise( response.data );

    // Process only the latest 10 items
    const latestItems = result.rss.channel[0].item.slice(0, 10);

    const items = await Promise.all( latestItems.map( async item => {
      const content = item['content:encoded'] ? item['content:encoded'][0] : '';
      const imageUrls = extractImageUrls( content || item.description[0] );
      const excerpt = extractExcerpt( item.description[0] );

      let imageBase64 = null;
      for ( const imageUrl of imageUrls ) {
        imageBase64 = await getImageAsBase64( imageUrl );
        if ( imageBase64 ) break; // Stop if an image is successfully fetched
      }

      return {
        title: item.title[0],
        link: item.link[0],
        imageUrl: imageUrls[0], // Still store the first image URL for reference
        imageBase64,
        excerpt,
        date: item.pubDate[0],
        author: item['dc:creator'] ? item['dc:creator'][0] : 'Unknown'
      };
    } ) );

    // Cache the processed items
    cachedBlogData.length = 0; // Clear the current cache
    cachedBlogData.push( ...items );
  } catch ( error ) {
    console.error( 'Failed to fetch and process RSS feed:', error );
  }
};

// Schedule the update to run every X minutes
setInterval( updateTrendingLots, lotsUpdateInterval * 60 * 1000 );
updateTrendingLots(); // initial update

// Call at the end of your setup
setInterval( updateBlogFeed, blogUpdateInterval * 60 * 1000 );
updateBlogFeed();

// Endpoint to get trending lots
app.get( '/trending-lots', ( req, res ) => {
  res.json( { lastUpdate: lastUpdateTime, lotCount: trendingLots.length, avatarsOnline, lots: trendingLots } );
} );

app.get( '/blog', ( req, res ) => {
  res.json( { articles: cachedBlogData } );
} );

app.listen( port, () => {
  console.log( `Server running on port ${port}` );
} );