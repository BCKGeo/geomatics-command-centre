import { describe, it, expect } from 'vitest';
import { calcSun, getMoon, xrayClass } from './astronomy.js';

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
