import { useCallback } from "react";
import { usePolledFeed } from "./usePolledFeed.js";
import { NOAA_KP, NOAA_SCALES, NOAA_WIND_SPEED, NOAA_WIND_MAG, NOAA_XRAY, NOAA_XRAY_FLUX } from "../data/constants.js";

const INTERVAL = 12e4; // 2 minutes

export function useSpaceWeather() {
  const fetchFn = useCallback(async () => {
    const [a, b, c, d, e, f] = await Promise.allSettled([
      fetch(NOAA_KP).then(r => r.json()),
      fetch(NOAA_SCALES).then(r => r.json()),
      fetch(NOAA_WIND_SPEED).then(r => r.json()),
      fetch(NOAA_WIND_MAG).then(r => r.json()),
      fetch(NOAA_XRAY).then(r => r.json()),
      fetch(NOAA_XRAY_FLUX).then(r => r.json()),
    ]);
    return {
      kp: a.status === "fulfilled" ? a.value : [],
      scales: b.status === "fulfilled" ? b.value : {},
      wind: c.status === "fulfilled" ? c.value : {},
      mag: d.status === "fulfilled" ? d.value : {},
      flux: e.status === "fulfilled" ? e.value : {},
      xray: f.status === "fulfilled" ? f.value : [],
    };
  }, []);

  return usePolledFeed({ fetchFn, interval: INTERVAL });
}
