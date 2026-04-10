import { useRef, useState, useCallback, useEffect } from "react";

const SNAP_COLLAPSED = 0;
const SNAP_HALF = 1;
const SNAP_FULL = 2;

// Snap positions as fraction of viewport height (from bottom)
const SNAP_HEIGHTS = [0.12, 0.5, 0.92];

// Require at least this much drag movement (as fraction of viewport) before allowing a snap change
const SNAP_HYSTERESIS = 0.08;

export function MobileBottomSheet({ children, B, resultCount }) {
  const sheetRef = useRef(null);
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false, pointerId: null });
  const [snap, setSnap] = useState(SNAP_COLLAPSED);
  const [height, setHeight] = useState(null); // null = use snap height
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 700);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const snapHeight = SNAP_HEIGHTS[snap] * vh;
  const currentHeight = height ?? snapHeight;

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      startY: e.clientY,
      startHeight: currentHeight,
      dragging: true,
      pointerId: e.pointerId,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [currentHeight]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const delta = dragRef.current.startY - e.clientY;
    const newHeight = Math.max(vh * 0.08, Math.min(vh * 0.95, dragRef.current.startHeight + delta));
    setHeight(newHeight);
  }, [vh]);

  const endDrag = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);

    // Release pointer capture explicitly
    if (e && dragRef.current.pointerId != null) {
      try { e.currentTarget.releasePointerCapture(dragRef.current.pointerId); } catch { /* ignore */ }
    }

    // Require minimum movement before snapping (hysteresis)
    const finalHeight = height ?? snapHeight;
    const startFrac = dragRef.current.startHeight / vh;
    const endFrac = finalHeight / vh;
    if (Math.abs(endFrac - startFrac) < SNAP_HYSTERESIS) {
      // Not enough movement -- snap back to starting snap position
      setHeight(null);
      return;
    }

    // Snap to nearest position
    let closest = SNAP_COLLAPSED;
    let minDist = Math.abs(endFrac - SNAP_HEIGHTS[0]);
    for (let i = 1; i < SNAP_HEIGHTS.length; i++) {
      const dist = Math.abs(endFrac - SNAP_HEIGHTS[i]);
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
        background: isDragging ? `${B.bg}f8` : `${B.bg}f5`,
        borderTop: `1px solid ${B.border}`,
        borderRadius: "12px 12px 0 0",
        backdropFilter: "blur(8px)",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        transition: height != null ? "none" : "height 0.18s ease-out, background 0.1s",
        touchAction: "none",
      }}
    >
      {/* Drag area -- covers handle + result count for larger hit target */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
          flexShrink: 0,
          paddingTop: 8,
        }}
      >
        {/* Visual handle */}
        <div style={{
          width: 40,
          height: 4,
          background: B.textDim,
          borderRadius: 2,
          margin: "0 auto 6px",
          opacity: isDragging ? 0.9 : 0.5,
          transition: "opacity 0.1s",
        }} />

        {/* Result count (inside drag area) */}
        <div style={{
          padding: "0 12px 8px",
          fontSize: 10,
          color: B.textDim,
          fontFamily: B.font,
        }}>
          {resultCount} result{resultCount !== 1 ? "s" : ""}
          {snap === SNAP_COLLAPSED && (
            <span style={{ float: "right", fontSize: 9, color: B.textDim }}>Drag up for table</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "0 8px",
        touchAction: "pan-y",
      }}>
        {children}
      </div>
    </div>
  );
}
