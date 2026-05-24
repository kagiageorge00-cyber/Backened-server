/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {onRequest} = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors");
const {searchFlights, searchHotels, searchCities} = require("./flightSearch");

// API Key validation - in production, store in Cloud Functions environment variables
const BLISS_API_KEY = process.env.BLISS_API_KEY || "your-secret-api-key-here";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Enable CORS for all endpoints
const corsHandler = cors({ origin: true });

// ==================== API KEY VALIDATION MIDDLEWARE ====================
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: "Missing API key. Please provide 'x-api-key' header."
    });
  }

  if (apiKey !== BLISS_API_KEY) {
    logger.warn("Invalid API key attempt", { apiKey: apiKey.substring(0, 5) + "..." });
    return res.status(403).json({
      error: "Invalid API key."
    });
  }

  logger.info("API key validated successfully");
  next();
};

// ==================== FLIGHT SEARCH ENDPOINT ====================
exports.flightSearch = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Validate API key
    validateApiKey(req, res, async () => {
      logger.info("Flight search request received", { body: req.body });

      try {
        const {origin, destination, departureDate, adults = 1, children = 0, infants = 0} = req.body;

        // Validate required fields
        if (!origin || !destination || !departureDate) {
          return res.status(400).json({
            error: "Missing required fields: origin, destination, departureDate"
          });
        }

        // Call Amadeus flight search
        const flights = await searchFlights(origin, destination, departureDate, adults, children, infants);

        res.status(200).json({
          success: true,
        data: flights,
        count: flights.length
      });
    } catch (error) {
      logger.error("Flight search error:", error);
      res.status(500).json({
        error: error.message || "Failed to search flights"
      });
    }
  });
});

// ==================== HOTEL SEARCH ENDPOINT ====================
exports.hotelSearch = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Validate API key
    validateApiKey(req, res, async () => {
      logger.info("Hotel search request received", { body: req.body });

      try {
        const {city, checkInDate, checkOutDate, adults = 1} = req.body;

        // Validate required fields
        if (!city || !checkInDate || !checkOutDate) {
          return res.status(400).json({
            error: "Missing required fields: city, checkInDate, checkOutDate"
          });
        }

        // Call Amadeus hotel search
        const hotels = await searchHotels(city, checkInDate, checkOutDate, adults);

        res.status(200).json({
          success: true,
          data: hotels,
          count: hotels.length
        });
      } catch (error) {
        logger.error("Hotel search error:", error);
        res.status(500).json({
          error: error.message || "Failed to search hotels"
        });
      }
    });
  });
});

// ==================== CITY SEARCH ENDPOINT ====================
exports.citiesSearch = onRequest((req, res) => {
  corsHandler(req, res, async () => {
    // Validate API key
    validateApiKey(req, res, async () => {
      logger.info("City search request received", { body: req.body });

      try {
        const {keyword} = req.body;

        // Validate required fields
        if (!keyword) {
          return res.status(400).json({
            error: "Missing required field: keyword"
          });
        }

        // Call Amadeus city search
        const cities = await searchCities(keyword);

        res.status(200).json({
          success: true,
          data: cities,
          count: cities.length
        });
      } catch (error) {
        logger.error("City search error:", error);
        res.status(500).json({
          error: error.message || "Failed to search cities"
        });
      }
    });
  });
});

