require('dotenv').config();

const amadeusConfig = {
  baseUrl: process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com/v2',
  clientId: process.env.AMADEUS_CLIENT_ID || '',
  clientSecret: process.env.AMADEUS_CLIENT_SECRET || '',
  token: process.env.AMADEUS_TOKEN || '',
};

module.exports = {
  amadeusConfig,
};
