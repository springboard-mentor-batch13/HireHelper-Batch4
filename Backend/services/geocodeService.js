const axios = require("axios");

const geocodeAddress = async (address) => {
  try {
    const apiKey = process.env.OPENCAGE_API_KEY;

    if (!apiKey) {
      throw new Error("OPENCAGE_API_KEY not found in .env");
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await axios.get(url);

    if (!response.data.results.length) {
      throw new Error("Invalid address");
    }

    const { lat, lng } = response.data.results[0].geometry;

    return { lat, lng };

  } catch (error) {
    console.error("Geocoding Error:", error.message);
    throw new Error("Failed to fetch coordinates");
  }
};

module.exports = geocodeAddress;