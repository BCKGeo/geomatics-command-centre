import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { DEFAULT_LAT, DEFAULT_LON, DEFAULT_CITY } from "../data/constants.js";

const LocationContext = createContext();

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
        setLocSource("gps");
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
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(r => r.json())
          .then(data => {
            const cityStr = `${data.city || data.locality || "Unknown"}, ${data.principalSubdivisionCode?.replace("CA-", "") || data.countryCode}`;
            setCityName(cityStr);
            localStorage.setItem("bckgeo_location", JSON.stringify({ lat: latitude, lon: longitude, city: cityStr }));
            setLocLoading(false);
          })
          .catch(() => setLocLoading(false));
      },
      () => setLocLoading(false),
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
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${newLat}&longitude=${newLon}&localityLanguage=en`)
      .then(r => r.json())
      .then(data => {
        const cityStr = `${data.city || data.locality || "Unknown"}, ${data.principalSubdivisionCode?.replace("CA-", "") || data.countryCode}`;
        setCityName(cityStr);
        localStorage.setItem("bckgeo_location", JSON.stringify({ lat: newLat, lon: newLon, city: cityStr }));
      })
      .catch(() => {
        setCityName(`${newLat.toFixed(4)}, ${newLon.toFixed(4)}`);
        localStorage.setItem("bckgeo_location", JSON.stringify({ lat: newLat, lon: newLon, city: `${newLat.toFixed(4)}, ${newLon.toFixed(4)}` }));
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
