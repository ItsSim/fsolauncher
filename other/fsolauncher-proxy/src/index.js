const express = require( 'express' );
const axios = require( 'axios' );
const app = express();
const port = 30631;
const updateInterval = 5; // minutes

// Cache for trending lots
let trendingLots = [];
let lastUpdateTime = 0;

// Function to update trending lots
const updateTrendingLots = async () => {
  try {
    // Get online lots
    const onlineLotsResponse = await axios.get( 'https://api.freeso.org/userapi/city/1/lots/online' );
    const onlineLots = onlineLotsResponse.data.lots;

    // Sort by avatars_in_lot and pick the top 10
    const sortedLots = onlineLots.sort( ( a, b ) => b.avatars_in_lot - a.avatars_in_lot ).slice( 0, 10 );

    // Get additional details for each lot
    for ( let lot of sortedLots ) {
      const ownerDetailsResponse = await axios.get( `https://api.freeso.org/userapi/city/1/lots/location/${lot.location}` );
      lot.ownerDetails = ownerDetailsResponse.data;
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
  res.json( { lastUpdate: lastUpdateTime, count: trendingLots.length, lots: trendingLots } );
} );

app.listen( port, () => {
  console.log( `Server running on port ${port}` );
} );