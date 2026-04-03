// Astronomical coordinate engine
// Computes which catalog stars are visible from Quito, Ecuador
// on a given date at 9 PM local time, and returns alt/az positions.

const Astronomy = {
  LAT: -0.1807,   // Quito latitude (degrees)
  LON: -78.4678,  // Quito longitude (degrees)
  LAT_RAD: 0,
  _stars: [],      // Pre-processed catalog: [{ra, dec, mag, bv}] in radians

  init() {
    this.LAT_RAD = this.LAT * Math.PI / 180;

    // Convert catalog entries from [RA_hours, Dec_deg, mag, bv] to radians
    this._stars = STAR_CATALOG.map(entry => ({
      ra:  entry[0] * 15 * Math.PI / 180,   // hours -> degrees -> radians
      dec: entry[1] * Math.PI / 180,         // degrees -> radians
      mag: entry[2],
      bv:  entry[3],
    }));
  },

  // Julian Date from calendar date + UTC hour
  julianDate(year, month, day, utcHour) {
    if (month <= 2) { year--; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716))
         + Math.floor(30.6001 * (month + 1))
         + day + utcHour / 24 + B - 1524.5;
  },

  // Greenwich Mean Sidereal Time in degrees
  gmst(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    let gmst = 280.46061837
             + 360.98564736629 * (jd - 2451545.0)
             + 0.000387933 * T * T
             - T * T * T / 38710000.0;
    return ((gmst % 360) + 360) % 360;  // normalize to 0-360
  },

  // Local Sidereal Time in radians
  lst(jd) {
    const lstDeg = ((this.gmst(jd) + this.LON) % 360 + 360) % 360;
    return lstDeg * Math.PI / 180;
  },

  // RA/Dec -> Alt/Az (all in radians)
  raDecToAltAz(ra, dec, lst) {
    const ha = lst - ra;
    const sinAlt = Math.sin(dec) * Math.sin(this.LAT_RAD)
                 + Math.cos(dec) * Math.cos(this.LAT_RAD) * Math.cos(ha);
    const alt = Math.asin(sinAlt);

    const cosAz = (Math.sin(dec) - Math.sin(alt) * Math.sin(this.LAT_RAD))
                / (Math.cos(alt) * Math.cos(this.LAT_RAD));
    let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
    if (Math.sin(ha) > 0) az = 2 * Math.PI - az;

    return { alt, az };
  },

  // Main entry: get all visible stars for a date string like '2026-03-28'
  // Returns [{alt, az, mag, bv}] for stars above the horizon
  getVisibleStars(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    // 9 PM Quito time (UTC-5) = 02:00 UTC next day
    const jd = this.julianDate(year, month, day + 1, 2);
    const localLst = this.lst(jd);

    const visible = [];
    const minAlt = 5 * Math.PI / 180;  // 5 degrees above horizon

    for (const star of this._stars) {
      const { alt, az } = this.raDecToAltAz(star.ra, star.dec, localLst);
      if (alt < minAlt) continue;

      // Atmospheric extinction: stars near horizon appear dimmer
      const airmass = 1 / Math.sin(alt);
      const extinction = 0.2 * airmass;
      const effectiveMag = star.mag + extinction;

      // Skip stars too dim after extinction (mag > 5.5)
      if (effectiveMag > 5.5) continue;

      visible.push({
        alt,
        az,
        mag: effectiveMag,
        bv: star.bv,
      });
    }

    return visible;
  },
};
