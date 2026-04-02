export function getLocationText(location) {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object" && typeof location.address === "string") {
    return location.address;
  }
  return "";
}

