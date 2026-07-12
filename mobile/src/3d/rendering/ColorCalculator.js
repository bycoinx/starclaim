/**
 * P0.8.2 - Star Rendering: Color Calculator
 * 
 * Converts astronomical color indices (BP-RP) and spectral types
 * to RGB colors for star rendering.
 */

/**
 * Convert Gaia BP-RP color index to effective temperature (K)
 * 
 * Empirical formula for G < 19 mag:
 * Using calibration from Gaia DR3 color-temperature relations
 */
export function bprpToTemperature(bprp) {
  if (typeof bprp !== 'number' || isNaN(bprp)) {
    return 5778; // Default: Sun temperature
  }
  
  // Clamp to reasonable range
  const clamped = Math.max(-0.5, Math.min(4.0, bprp));
  
  // Fast two-term color-temperature approximation. This keeps the solar
  // reference near 5778 K while remaining monotonic for blue and red stars.
  const temp = 4600 * (
    1 / (0.92 * clamped + 1.7) +
    1 / (0.92 * clamped + 0.62)
  );
  
  // Clamp to physically reasonable range
  return Math.max(2500, Math.min(15000, temp));
}

/**
 * Convert effective temperature (K) to RGB using Planck radiation
 * Simplified algorithm for performance
 * 
 * Based on Tanner Helland's algorithm
 * http://www.tannerhelland.com/4435/convert-temperature-rgb-algorithm-code/
 */
export function temperatureToRGB(temperature) {
  if (temperature < 2500 || temperature > 15000) {
    return { r: 1, g: 1, b: 1 }; // Default white
  }
  
  const temp = temperature / 100;
  let r, g, b;
  
  // Red channel
  if (temp <= 66) {
    r = 1; // Always full red in warm colors
  } else {
    r = temp - 60;
    r = 329.698727466 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(1, r / 255));
  }
  
  // Green channel
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(1, g / 255));
  
  // Blue channel
  if (temp >= 66) {
    b = 1; // Always full blue in cool colors
  } else {
    if (temp <= 19) {
      b = 0; // Too cool to emit blue
    } else {
      b = temp - 10;
      b = 138.5177312231 * Math.log(b) - 305.0447927307;
      b = Math.max(0, Math.min(1, b / 255));
    }
  }
  
  return { r, g, b };
}

/**
 * Get star color from BP-RP or spectral type
 * 
 * Returns normalized RGB [0, 1] for use in shaders
 */
export function getStarColor(bprp, spectralType = null) {
  // BP-RP takes precedence if available
  if (typeof bprp === 'number' && !isNaN(bprp)) {
    const temp = bprpToTemperature(bprp);
    return temperatureToRGB(temp);
  }
  
  // Fallback to spectral type if provided
  if (spectralType && typeof spectralType === 'string') {
    return spectralTypeToRGB(spectralType);
  }
  
  // Default: Sun-like
  return { r: 1, g: 0.95, b: 0.9 };
}

/**
 * Convert spectral type string to RGB
 * Examples: "A0V", "F7Ib-II", "B6epe"
 */
export function spectralTypeToRGB(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') {
    return { r: 1, g: 1, b: 1 };
  }
  
  // Extract primary spectral class (first character)
  const spClass = spectralType[0].toUpperCase();
  
  // Approximate temperatures by spectral class
  const spectralTemps = {
    'O': 40000,
    'B': 12000,
    'A': 8500,
    'F': 6500,
    'G': 5800,  // Sun
    'K': 4300,
    'M': 3500,
  };
  
  const temp = spectralTemps[spClass] || 5778;
  return temperatureToRGB(Math.max(2500, Math.min(15000, temp)));
}

/**
 * Test reference colors
 */
export const REFERENCE_STAR_COLORS = {
  sirius: { // A1V, BP-RP = 0.005
    bprp: 0.005,
    expected: { r: 1, g: 0.98, b: 0.85 },
  },
  vega: { // A0V, BP-RP = -0.15
    bprp: -0.15,
    expected: { r: 1, g: 1, b: 0.8 },
  },
  sun: { // G2V, BP-RP = 0.656
    bprp: 0.656,
    expected: { r: 1, g: 0.95, b: 0.9 },
  },
  betelgeuse: { // M1Ib, BP-RP = 1.5
    bprp: 1.5,
    expected: { r: 1, g: 0.5, b: 0.2 },
  },
};
