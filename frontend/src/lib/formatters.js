/**
 * formatters.js
 * 
 * Reusable utility helpers for formatting astronomical, commercial,
 * and ownership properties uniformly across web/mobile clients.
 */

/**
 * Format ownership status messages.
 */
export function formatOwnershipStatus(isClaimed, ownerName = "", isTR = true) {
  if (isClaimed) {
    const owner = ownerName || (isTR ? "Pilot" : "Pilot");
    return isTR 
      ? `Bu yıldız ${owner} tarafından sahiplenilmiştir.`
      : `This star is registered by ${owner}.`;
  }
  return isTR 
    ? "Bu yıldız şu anda sahiplenilebilir durumdadır."
    : "This star is currently available for registration.";
}

/**
 * Format stellar distance. Handles converting parsecs/lightyears or adding proper unit.
 */
export function formatDistance(distanceLy, isTR = true) {
  if (!distanceLy) return "N/A";
  
  const formatted = Number(distanceLy).toLocaleString();
  if (isTR) {
    return `${formatted} ışık yılı`;
  }
  return `${formatted} light years`;
}

/**
 * Format spectral class with full description.
 */
export function formatSpectralType(spectralType = "G") {
  if (!spectralType) return "Unknown";
  
  const firstLetter = spectralType.charAt(0).toUpperCase();
  const classes = {
    O: "Mavi Dev (Çok Sıcak)",
    B: "Mavi-Beyaz Dev (Sıcak)",
    A: "Beyaz Yıldız",
    F: "Sarı-Beyaz Yıldız",
    G: "Sarı Cüce (Güneş Benzeri)",
    K: "Turuncu Dev",
    M: "Kırmızı Cüce / Dev (Soğuk)"
  };
  
  const desc = classes[firstLetter] || "Kozmik Sınıf";
  return `${spectralType} (${desc})`;
}

/**
 * Format magnitude brightness metric.
 */
export function formatMagnitude(magnitude) {
  if (magnitude === undefined || magnitude === null) return "N/A";
  return `${Number(magnitude).toFixed(2)} mag`;
}

/**
 * Format temperature.
 */
export function formatTemperature(temp) {
  if (!temp) return "N/A";
  return `${Number(temp).toLocaleString()} K`;
}

/**
 * Format pricing in local currency or USD.
 */
export function formatPrice(price) {
  if (price === undefined || price === null) return "N/A";
  return `$${Number(price).toLocaleString()}`;
}
