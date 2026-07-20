import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY } from "../data/constants.js";

const LocationContext = createContext();

function reverseGeocode(lat, lon) {
  return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => `${data.city || data.locality || "Unknown"}, ${data.principalSubdivisionCode?.replace("CA-", "") || data.countryCode}`);
}

function coordsLabel(lat, lon) {
  return `${Math.abs(lat).toFixed(4)}${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}${lon >= 0 ? "E" : "W"}`;
}

function saveLocation(lat, lon, city, source) {
  localStorage.setItem("bckgeo_location", JSON.stringify({ lat, lon, city, source }));
}

export function LocationProvider({ children }) {
  const [userLat, setUserLat] = useState(null);
  const [userLon, setUserLon] = useState(null);
  const [cityName, setCityName] = useState(DEFAULT_CITY);
  const [locSource, setLocSource] = useState("default");
  const [locLoading, setLocLoading] = useState(false);

  const lat = userLat ?? DEFAULT_LAT;
  const lon = userLon ?? DEFAULT_LON;

  useEffect(() => {
    const saved = localStorage.getItem("bckgeo_location");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setUserLat(p.lat);
        setUserLon(p.lon);
        setCityName(p.city);
        // Older saves predate the source field; assume gps for those
        setLocSource(p.source === "manual" ? "manual" : "gps");
      } catch {}
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLon(longitude);
        setLocSource("gps");
        reverseGeocode(latitude, longitude)
          .then(city => {
            setCityName(city);
            saveLocation(latitude, longitude, city, "gps");
          })
          .catch(() => {
            const fallback = coordsLabel(latitude, longitude);
            setCityName(fallback);
            saveLocation(latitude, longitude, fallback, "gps");
          })
          .finally(() => setLocLoading(false));
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setLocLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const resetLocation = useCallback(() => {
    localStorage.removeItem("bckgeo_location");
    setUserLat(null);
    setUserLon(null);
    setCityName(DEFAULT_CITY);
    setLocSource("default");
  }, []);

  const setManualLocation = useCallback((newLat, newLon) => {
    setUserLat(newLat);
    setUserLon(newLon);
    setLocSource("manual");
    reverseGeocode(newLat, newLon)
      .then(city => {
        setCityName(city);
        saveLocation(newLat, newLon, city, "manual");
      })
      .catch(() => {
        const fallback = coordsLabel(newLat, newLon);
        setCityName(fallback);
        saveLocation(newLat, newLon, fallback, "manual");
      });
  }, []);

  return (
    <LocationContext.Provider value={{ lat, lon, cityName, locSource, locLoading, requestLocation, resetLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
