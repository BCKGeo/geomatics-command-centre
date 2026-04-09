import { useRef, useState, useCallback, useEffect } from "react";

const SNAP_COLLAPSED = 0;
const SNAP_HALF = 1;
const SNAP_FULL = 2;

// Snap positions as fraction of viewport height (from bottom)
const SNAP_HEIGHTS = [0.12, 0.5, 0.92];

export function MobileBottomSheet({ children, B, resultCount }) {
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false });
  const [snap, setSnap] = useState(SNAP_COLLAPSED);
  const [height, setHeight] = useState(null); // null = use snap height
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 700);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const snapHeight = SNAP_HEIGHTS[snap] * vh;
  const currentHeight = height ?? snapHeight;

  const onPointerDown = useCallback((e) => {
    dragRef.current = { startY: e.clientY, startHeight: currentHeight, dragging: true };
    e.target.setPointerCapture(e.pointerId);
  }, [currentHeight]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const delta = dragRef.current.startY - e.clientY;
    const newHeight = Math.max(vh * 0.08, Math.min(vh * 0.95, dragRef.current.startHeight + delta));
    setHeight(newHeight);
  }, [vh]);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    // Snap to nearest position
    const frac = (height ?? snapHeight) / vh;
    let closest = SNAP_COLLAPSED;
    let minDist = Math.abs(frac - SNAP_HEIGHTS[0]);
    for (let i = 1; i < SNAP_HEIGHTS.length; i++) {
      const dist = Math.abs(frac - SNAP_HEIGHTS[i]);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setSnap(closest);
    setHeight(null); // let snap take over
  }, [height, snapHeight, vh]);

  return (
    <div
      ref={sheetRef}
      role="region"
      aria-label="Results panel"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: currentHeight,
        background: `${B.bg}f5`,
        borderTop: `1px solid ${B.border}`,
        borderRadius: "12px 12px 0 0",
        backdropFilter: "blur(8px)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        transition: height != null ? "none" : "height 0.25s ease-out",
        touchAction: "none",
      }}
    >
      {/* Drag handle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          padding: "8px 0 4px",
          cursor: "grab",
          touchAction: "none",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 32,
          height: 4,
          background: B.textDim,
          borderRadius: 2,
          margin: "0 auto",
          opacity: 0.5,
        }} />
      </div>

      {/* Result count */}
      <div style={{
        padding: "0 12px 6px",
        fontSize: 10,
        color: B.textDim,
        fontFamily: B.font,
        flexShrink: 0,
      }}>
        {resultCount} result{resultCount !== 1 ? "s" : ""}
        {snap === SNAP_COLLAPSED && (
          <span style={{ float: "right", fontSize: 9, color: B.textDim }}>Drag up for table</span>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: snap === SNAP_COLLAPSED ? "hidden" : "auto",
        padding: "0 8px",
      }}>
        {children}
      </div>
    </div>
  );
}
