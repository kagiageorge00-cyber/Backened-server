const axios = require('axios');

const { amadeusConfig } = require('../config/amadeus');

function getAmadeusConfig() {
  return {
    baseUrl: amadeusConfig.baseUrl,
    clientId: amadeusConfig.clientId,
    clientSecret: amadeusConfig.clientSecret,
    token: amadeusConfig.token,
  };
}

function getMarginBreakdown(baseAmount) {
  const amount = Number(baseAmount || 0);
  const marginPercentage = 30;
  const marginAmount = Number((amount * marginPercentage / 100).toFixed(2));
  const finalAmount = Number((amount + marginAmount).toFixed(2));
  return {
    marginPercentage,
    marginAmount,
    finalAmount,
  };
}

async function getAccessToken() {
  const config = getAmadeusConfig();
  if (config.token) {
    return config.token;
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Amadeus credentials are not configured.');
  }

  const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 30000,
  });

  return response?.data?.access_token;
}

async function searchFlights({ origin, destination, departureDate, adults = 1, travelClass = 'ECONOMY', returnDate }) {
  const token = await getAccessToken();
  const config = getAmadeusConfig();

  const params = {
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults,
    travelClass,
    currencyCode: 'USD',
    max: 6,
  };

  if (returnDate) {
    params.returnDate = returnDate;
  }

  const response = await axios.get(`${config.baseUrl}/shopping/flight-offers`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
    timeout: 45000,
  });

  const offers = Array.isArray(response?.data?.data) ? response.data.data : [];
  return offers.map((offer, index) => ({
    id: `${origin}-${destination}-${index + 1}`,
    origin,
    destination,
    departureDate,
    returnDate,
    airline: offer?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'Unknown',
    flightNumber: offer?.itineraries?.[0]?.segments?.[0]?.number || 'N/A',
    price: Number((offer?.price?.grandTotal || 0)),
    currency: offer?.price?.currency || 'USD',
    margin: getMarginBreakdown(offer?.price?.grandTotal || 0),
    raw: offer,
  }));
}

async function priceFlightOffer(offer) {
  const token = await getAccessToken();
  const config = getAmadeusConfig();

  const response = await axios.post(`${config.baseUrl}/shopping/flight-offers/pricing`, offer, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 45000,
  });

  return response?.data || null;
}

async function createFlightBooking(payload) {
  const token = await getAccessToken();
  const config = getAmadeusConfig();

  const response = await axios.post(`${config.baseUrl}/booking/flight-orders`, payload, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 60000,
  });

  return response?.data || null;
}

module.exports = {
  getAmadeusConfig,
  getMarginBreakdown,
  searchFlights,
  priceFlightOffer,
  createFlightBooking,
};
