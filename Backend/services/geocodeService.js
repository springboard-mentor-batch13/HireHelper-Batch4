const axios = require("axios");

const geocodeAddress = async (address) => {
  const apiKey = process.env.OPENCAGE_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await axios.get(url);
    const firstResult = response?.data?.results?.[0];

    if (!firstResult?.geometry) {
      return null;
    }

    const { lat, lng } = firstResult.geometry;

    if (lat == null || lng == null) {
      return null;
    }

    return { lat, lng };
  } catch (error) {
    console.error("Geocoding Error:", error.message);
    return null;
  }
};

module.exports = geocodeAddress;
