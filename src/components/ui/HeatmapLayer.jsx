import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export function HeatmapLayer({ points, radius = 25, blur = 15, maxZoom = 10, minOpacity = 0.4, gradient }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const heat = L.heatLayer(points, { radius, blur, maxZoom, minOpacity, gradient });
    heat.addTo(map);
    return () => map.removeLayer(heat);
  }, [map, points, radius, blur, maxZoom, minOpacity, gradient]);

  return null;
}
