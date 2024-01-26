const express = require( 'express' );
const axios = require( 'axios' );
const app = express();
const port = 30631;
const updateInterval = 5; // minutes

// Cache for trending lots
let trendingLots = [];
let avatarsOnline = 0;
let lastUpdateTime = 0;

const getImageAsBase64 = async ( url ) => {
  try {
    const response = await axios.get( url, { responseType: 'arraybuffer' } );
    return Buffer.from( response.data, 'binary' ).toString( 'base64' );
  } catch ( error ) {
    console.error( 'Failed to get image:', error );
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

// Schedule the update to run every X minutes
setInterval( updateTrendingLots, updateInterval * 60 * 1000 );
updateTrendingLots(); // initial update

// Endpoint to get trending lots
app.get( '/trending-lots', ( req, res ) => {
  res.json( { lastUpdate: lastUpdateTime, lotCount: trendingLots.length, avatarsOnline, lots: trendingLots } );
} );

app.listen( port, () => {
  console.log( `Server running on port ${port}` );
} );