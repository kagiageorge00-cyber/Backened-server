const Amadeus = require('amadeus');

// ==================== TOKEN MANAGEMENT ====================
// Amadeus tokens expire after 30 minutes (1800 seconds)
// We store the token and its expiration time to avoid unnecessary refreshes

let cachedToken = null;
let tokenExpiration = null;
const TOKEN_EXPIRY_TIME = 1800; // 30 minutes in seconds
const REFRESH_BUFFER = 300; // Refresh 5 minutes before expiration

const amadeusInstance = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID || 'Mr4hPQavdEomIqO2StyG5hIlaTL18ESr',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || 'hmS3c1BTiAWbekue'
});

/**
 * Get a valid access token, refreshing if necessary
 * Handles the 30-minute expiration automatically
 */
async function getValidToken() {
  const now = Math.floor(Date.now() / 1000);
  
  // Check if token exists and is still valid (with buffer)
  if (cachedToken && tokenExpiration && (tokenExpiration - now) > REFRESH_BUFFER) {
    // Token is still valid, return cached token
    return cachedToken;
  }

  try {
    // Token is expired or doesn't exist - get a new one
    const response = await amadeusInstance.client.post('/v1/security/oauth2/token', {
      grant_type: 'client_credentials',
      client_id: amadeusInstance.clientId,
      client_secret: amadeusInstance.clientSecret
    });

    cachedToken = response.data.access_token;
    tokenExpiration = now + TOKEN_EXPIRY_TIME;
    
    console.log(`✓ New Amadeus token obtained. Expires in ${TOKEN_EXPIRY_TIME} seconds`);
    return cachedToken;
  } catch (error) {
    console.error('❌ Failed to obtain Amadeus token:', error.message);
    throw new Error('Unable to authenticate with Amadeus API');
  }
}

/**
 * Search for flight offers
 */
async function searchFlights(originCode, destinationCode, departureDate, adults = 1, children = 0, infants = 0) {
  try {
    const response = await amadeusInstance.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: departureDate,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      max: 10 // Return top 10 results
    });

    return response.data;
  } catch (error) {
    console.error('❌ Flight search failed:', error.message);
    throw new Error('Failed to search flights');
  }
}

/**
 * Search for hotels
 */
async function searchHotels(cityCode, checkInDate, checkOutDate, adult = 1) {
  try {
    // First get hotel search results
    const response = await amadeusInstance.shopping.hotelOffersSearch.get({
      cityCode: cityCode,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: String(adult),
      max: 10
    });

    return response.data;
  } catch (error) {
    console.error('❌ Hotel search failed:', error.message);
    throw new Error('Failed to search hotels');
  }
}

/**
 * Get city search results (for autocomplete and validation)
 */
async function searchCities(keyword) {
  try {
    const response = await amadeusInstance.referenceData.locations.get({
      keyword: keyword,
      subType: 'CITY,AIRPORT',
      max: 10
    });

    return response.data;
  } catch (error) {
    console.error('❌ City search failed:', error.message);
    throw new Error('Failed to search cities');
  }
}

module.exports = {
  getValidToken,
  searchFlights,
  searchHotels,
  searchCities,
  amadeusInstance
};
