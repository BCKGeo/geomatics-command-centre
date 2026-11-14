import { describe, it, expect } from 'vitest';
import { calcSun, sunEvents, getMoon, xrayClass } from './astronomy.js';

// ── Sun position ──
// Anchored on solstice/equinox geometry: at 12:00 UTC on lon 0 the sun is
// within minutes of the meridian (equation of time < 8 min in all cases
// used), so altitude ≈ 90 - lat + declination and azimuth ≈ 180.
describe('calcSun', () => {
  it('June solstice noon altitude at lat 50, lon 0 ≈ 63.4°', () => {
    const r = calcSun(new Date(Date.UTC(2026, 5, 21, 12, 0)), 50, 0);
    expect(r.altitude).toBeCloseTo(90 - 50 + 23.44, 0);
    expect(Math.abs(r.altitude - 63.44)).toBeLessThan(0.5);
  });

  it('December solstice noon altitude at lat 50, lon 0 ≈ 16.6°', () => {
    const r = calcSun(new Date(Date.UTC(2025, 11, 21, 12, 0)), 50, 0);
    expect(Math.abs(r.altitude - 16.56)).toBeLessThan(0.5);
  });

  it('March equinox noon altitude at lat 50, lon 0 ≈ 40°', () => {
    const r = calcSun(new Date(Date.UTC(2026, 2, 20, 12, 0)), 50, 0);
    expect(Math.abs(r.altitude - 40.0)).toBeLessThan(0.5);
  });

  it('noon sun bears roughly south from mid-northern latitudes', () => {
    const r = calcSun(new Date(Date.UTC(2026, 5, 21, 12, 0)), 50, 0);
    expect(Math.abs(r.azimuth - 180)).toBeLessThan(3);
  });

  it('sun is below the horizon at local midnight in winter', () => {
    const r = calcSun(new Date(Date.UTC(2025, 11, 21, 0, 0)), 50, 0);
    expect(r.altitude).toBeLessThan(-40);
  });
});

// ── Moon phase ──
// Anchors chosen so the answer is unambiguous even with the function's
// local-midnight sampling (± ~1 day of timezone slack ≈ ±0.034 phase).
describe('getMoon', () => {
  it('2000-01-06 was a new moon (18:14 UTC)', () => {
    const r = getMoon(new Date(2000, 0, 6));
    expect(r.illum).toBeLessThanOrEqual(3);
    expect(r.phase < 0.06 || r.phase > 0.94).toBe(true);
  });

  it('2000-01-21 was a full moon (04:40 UTC)', () => {
    const r = getMoon(new Date(2000, 0, 21));
    expect(r.illum).toBeGreaterThanOrEqual(97);
    expect(r.phase).toBeGreaterThan(0.44);
    expect(r.phase).toBeLessThan(0.56);
  });

  it('2024-04-08 was a new moon (the total solar eclipse)', () => {
    const r = getMoon(new Date(2024, 3, 8));
    expect(r.illum).toBeLessThanOrEqual(3);
    expect(r.name).toBe('New Moon');
  });
});

// ── GOES X-ray class ──
describe('xrayClass', () => {
  it('classifies mid-class fluxes', () => {
    expect(xrayClass(5.0e-5).cls).toBe('M5.0');
    expect(xrayClass(2.5e-6).cls).toBe('C2.5');
    expect(xrayClass(1.0e-4).cls).toBe('X1.0');
  });

  it('never displays a 10.0 mantissa: 9.96e-5 is X1.0, not M10.0', () => {
    expect(xrayClass(9.96e-5).cls).toBe('X1.0');
  });

  it('rounds boundary flux up a class across all levels', () => {
    expect(xrayClass(9.97e-6).cls).toBe('M1.0');
    expect(xrayClass(9.97e-7).cls).toBe('C1.0');
    expect(xrayClass(9.97e-8).cls).toBe('B1.0');
  });

  it('handles missing flux', () => {
    expect(xrayClass(0).cls).toBe('--');
    expect(xrayClass(null).cls).toBe('--');
  });
});

// ── Sun events ──
describe('sunEvents', () => {
  it('orders dawn, sunrise, sunset, dusk on an ordinary day', () => {
    const r = sunEvents(new Date(2026, 9, 31, 12), 53.92, -122.75);
    expect(r.civilDawn).toBeInstanceOf(Date);
    expect(r.civilDawn < r.sunrise).toBe(true);
    expect(r.sunrise < r.sunset).toBe(true);
    expect(r.sunset < r.civilDusk).toBe(true);
    expect(r.polarDay).toBe(false);
    expect(r.polarNight).toBe(false);
    // Open-Meteo gives 08:09 and 17:38 local (PDT, UTC-7) for Prince George on
    // this day. Checked as absolute instants so the test does not depend on
    // the time zone of the machine running it (it used to fail under UTC).
    const minutesOff = (d, utcMs) => Math.abs(d.getTime() - utcMs) / 6e4;
    expect(minutesOff(r.sunrise, Date.UTC(2026, 9, 31, 15, 9))).toBeLessThan(5);
    expect(minutesOff(r.sunset, Date.UTC(2026, 10, 1, 0, 38))).toBeLessThan(5);
    const dayLen = (r.sunset - r.sunrise) / 36e5;
    expect(Math.abs(dayLen - 9.48)).toBeLessThan(0.15);
  });

  it('gives the same instants whatever calendar-day window the browser is in', () => {
    // A location 8 h of solar time west of Greenwich: the events must sit
    // around the location's solar noon, sunrise before it and sunset after.
    const r = sunEvents(new Date(2026, 9, 31, 12), 53.92, -122.75);
    const solarNoon = Date.UTC(2026, 9, 31, 12) + 122.75 / 15 * 36e5;
    expect(r.sunrise.getTime()).toBeLessThan(solarNoon);
    expect(r.sunset.getTime()).toBeGreaterThan(solarNoon);
    expect(solarNoon - r.civilDawn.getTime()).toBeLessThan(12 * 36e5);
    expect(r.civilDusk.getTime() - solarNoon).toBeLessThan(12 * 36e5);
  });

  it('returns nulls and the polar flag in the polar night', () => {
    const r = sunEvents(new Date(2026, 11, 21, 12), 82, -62); // Alert, NU
    expect(r.sunrise).toBeNull();
    expect(r.sunset).toBeNull();
    expect(r.polarNight).toBe(true);
    expect(r.polarDay).toBe(false);
  });

  it('returns nulls and the polar flag in the polar day', () => {
    const r = sunEvents(new Date(2026, 5, 21, 12), 82, -62);
    expect(r.sunrise).toBeNull();
    expect(r.polarDay).toBe(true);
    expect(r.polarNight).toBe(false);
  });
});
