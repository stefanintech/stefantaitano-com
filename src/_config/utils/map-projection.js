/**
 * Albers equal-area conic projection, fitted to the check-ins map's viewBox.
 * Shared by the outline generator and the build so state shapes and city
 * beads land on the same grid. Output is SVG units (y grows downward).
 */
const RADIANS = Math.PI / 180;

/** Raw Albers x/y for one point, before the viewBox fit. */
export const albers = ({parallels: [south, north], origin: [originLon, originLat]}) => {
  const phi1 = south * RADIANS;
  const phi2 = north * RADIANS;
  const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
  const c = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(c - 2 * n * Math.sin(originLat * RADIANS)) / n;

  return (lon, lat) => {
    const theta = n * (lon - originLon) * RADIANS;
    const rho = Math.sqrt(c - 2 * n * Math.sin(lat * RADIANS)) / n;
    return [rho * Math.sin(theta), -(rho0 - rho * Math.cos(theta))];
  };
};

/** Projector for an outline's stored projection: (lon, lat) → whole-number SVG [x, y]. */
export const projector = projection => {
  const raw = albers(projection);
  const {scale, translate: [tx, ty]} = projection;
  return (lon, lat) => {
    const [x, y] = raw(lon, lat);
    return [Math.round(x * scale + tx), Math.round(y * scale + ty)];
  };
};

/** True when a point falls inside the outline's drawn extent. */
export const inExtent = ({west, east, south, north}, lon, lat) =>
  lon >= west && lon <= east && lat >= south && lat <= north;
