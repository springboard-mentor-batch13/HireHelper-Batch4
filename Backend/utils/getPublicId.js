module.exports.getPublicIdFromUrl = (url) => {
  try {
    const afterUpload = url.split("/upload/")[1]; 
    const parts = afterUpload.split("/");

    // remove version (v123...)
    if (parts[0].startsWith("v")) {
      parts.shift();
    }

    const fullPath = parts.join("/");
    const publicId = fullPath.replace(/\.[^/.]+$/, ""); // remove extension

    return publicId;
  } catch (error) {
    console.error("Error extracting public_id:", error);
    return null;
  }
};