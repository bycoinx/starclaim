// Solar system dataset and helper functions
export const SOLAR_SCALE = 2.0; // 1 AU = 2 three units

export const PLANETS = [
  { name: 'Merkür',  sma: 0.387, period: 0.241,  radius: 0.0035, color: '#b5b5b5', tilt: 0.034, e: 0.206 },
  { name: 'Venüs',   sma: 0.723, period: 0.615,  radius: 0.0087, color: '#e8cda0', tilt: 177.4, e: 0.007 },
  { name: 'Dünya',   sma: 1.000, period: 1.000,  radius: 0.0092, color: '#4fa8e8', tilt: 23.4, e: 0.017 },
  { name: 'Mars',    sma: 1.524, period: 1.881,  radius: 0.0049, color: '#c1440e', tilt: 25.2, e: 0.093 },
  { name: 'Jüpiter', sma: 5.203, period: 11.862, radius: 0.1005, color: '#c88b3a', tilt: 3.1, e: 0.049 },
  { name: 'Satürn',  sma: 9.537, period: 29.457, radius: 0.0837, color: '#e4d191', tilt: 26.7, hasRings: true, e: 0.057 },
  { name: 'Uranüs',  sma: 19.19, period: 84.01,  radius: 0.0364, color: '#7de8e8', tilt: 97.8, e: 0.046 },
  { name: 'Neptün',  sma: 30.07, period: 164.8,  radius: 0.0354, color: '#3f54ba', tilt: 28.3, e: 0.010 },
];

export function keplerEllipsePosition(sma, e, period, time) {
  // anomaly approximation (simple uniform mean anomaly -> circular approximation)
  const t = typeof time === 'number' ? time : Date.now() / 1000;
  const years = t / (3600 * 24 * 365.25); // seconds -> years
  const anomaly = 2 * Math.PI * ((years % period) / period);
  const c = sma * e;
  const x = sma * Math.cos(anomaly) - c;
  const z = sma * Math.sqrt(1 - e * e) * Math.sin(anomaly);
  return [x * SOLAR_SCALE, 0, z * SOLAR_SCALE];
}

export default {
  PLANETS,
  keplerEllipsePosition,
};
