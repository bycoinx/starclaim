import * as THREE from "three";

export function parseRightAscension(value) {
  if (typeof value === "number") return value;
  const parts = String(value).match(/(\d+(?:\.\d+)?)h?\s*(\d*(?:\.\d+)?)m?\s*(\d*(?:\.\d+)?)s?/i);
  if (!parts) return 0;
  const hours = parseFloat(parts[1]) || 0;
  const minutes = parseFloat(parts[2]) || 0;
  const seconds = parseFloat(parts[3]) || 0;
  return hours + minutes / 60 + seconds / 3600;
}

export function parseDeclination(value) {
  if (typeof value === "number") return value;
  const sign = String(value).trim().startsWith("-") ? -1 : 1;
  const parts = String(value).match(/([+-]?\d+(?:\.\d+)?)°?\s*(\d*(?:\.\d+)?)'?\s*(\d*(?:\.\d+)?)"?/i);
  if (!parts) return 0;
  const degrees = Math.abs(parseFloat(parts[1]) || 0);
  const minutes = parseFloat(parts[2]) || 0;
  const seconds = parseFloat(parts[3]) || 0;
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

export function raDecToVector3(ra, dec, radius = 500) {
  const rightAscension = parseRightAscension(ra);
  const declination = parseDeclination(dec);
  const phi = (90 - declination) * (Math.PI / 180);
  const theta = rightAscension * 15 * (Math.PI / 180);

  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
