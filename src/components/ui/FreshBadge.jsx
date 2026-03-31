import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";

export function FreshBadge({ lastUpdated, interval }) {
  const { B } = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  if (!lastUpdated) return <span style={{ fontSize: 9, color: B.textDim }}>loading</span>;

  const age = now - lastUpdated.getTime();
  const secs = Math.floor(age / 1000);
  const label = secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;

  let color;
  if (age <= interval) color = "#22c55e";
  else if (age <= interval * 2) color = "#eab308";
  else color = "#ef4444";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 9, color: B.textDim }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block" }} />
      {age > interval * 2 ? "STALE" : label}
    </span>
  );
}
