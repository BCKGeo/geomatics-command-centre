/**
 * MapLibre GL marker sprite registration.
 *
 * Generates 24 marker icons at runtime via the browser Canvas API
 * and registers them with map.addImage(). No build-time sprite sheet needed.
 *
 * Shapes:  city (circle), town (triangle), municipality (square), regional (diamond)
 * Colors:  green (#4caf50), amber (#e6a817), grey (#555555)
 * Rings:   plain, ring (3px white border = standards indicator)
 *
 * Each canvas is 48x48 with the visible shape centered. The shape sits inside
 * an 18px diameter bounding area; the remaining space serves as a hit-area pad
 * and room for the drop shadow.
 */

const ICON_SIZE = 48;
const CENTER = ICON_SIZE / 2; // 24

const SHAPES = ['city', 'town', 'municipality', 'regional'];
const COLORS = {
  green: '#4caf50',
  amber: '#e6a817',
  grey: '#555555',
};
const RING_VARIANTS = [false, true];

// ---- drawing helpers ----

function applyShadow(ctx) {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
}

function clearShadow(ctx) {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Build the shape path on `ctx` without filling/stroking.
 * All shapes are centered at (CENTER, CENTER).
 */
function shapePath(ctx, shape) {
  ctx.beginPath();
  switch (shape) {
    case 'city': {
      // Circle, 18px diameter
      ctx.arc(CENTER, CENTER, 9, 0, Math.PI * 2);
      break;
    }
    case 'town': {
      // Equilateral triangle, 18px tall, point at top
      const h = 18;
      const side = (2 * h) / Math.sqrt(3); // ~20.78
      const topY = CENTER - h / 2;
      const botY = CENTER + h / 2;
      ctx.moveTo(CENTER, topY);
      ctx.lineTo(CENTER + side / 2, botY);
      ctx.lineTo(CENTER - side / 2, botY);
      ctx.closePath();
      break;
    }
    case 'municipality': {
      // Rounded square, 16x16, 2px border-radius
      const s = 16;
      const r = 2;
      const x = CENTER - s / 2;
      const y = CENTER - s / 2;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + s - r, y);
      ctx.arcTo(x + s, y, x + s, y + r, r);
      ctx.lineTo(x + s, y + s - r);
      ctx.arcTo(x + s, y + s, x + s - r, y + s, r);
      ctx.lineTo(x + r, y + s);
      ctx.arcTo(x, y + s, x, y + s - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      break;
    }
    case 'regional': {
      // Diamond: 16x16 square rotated 45deg
      const half = 8;
      ctx.moveTo(CENTER, CENTER - half); // top
      ctx.lineTo(CENTER + half, CENTER); // right
      ctx.lineTo(CENTER, CENTER + half); // bottom
      ctx.lineTo(CENTER - half, CENTER); // left
      ctx.closePath();
      break;
    }
  }
}

/**
 * Draw a single marker icon and return its ImageData.
 */
function drawIcon(shape, color, ring) {
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d');

  // -- ring (white border) drawn first, slightly larger --
  if (ring) {
    applyShadow(ctx);
    ctx.save();
    ctx.lineWidth = 6; // 3px visible on each side
    ctx.strokeStyle = '#ffffff';
    shapePath(ctx, shape);
    ctx.stroke();
    ctx.restore();
    clearShadow(ctx);
  }

  // -- filled shape --
  if (!ring) applyShadow(ctx);
  ctx.fillStyle = color;
  shapePath(ctx, shape);
  ctx.fill();
  if (!ring) clearShadow(ctx);

  // For ring variant, draw the white stroke on top cleanly (no shadow)
  if (ring) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    shapePath(ctx, shape);
    ctx.stroke();
  }

  return canvas;
}

// ---- public API ----

/**
 * Sprite ID list for external consumption (e.g. layer style expressions).
 */
export const SPRITE_IDS = [];

const colorNames = Object.keys(COLORS);
for (const shape of SHAPES) {
  for (const colorName of colorNames) {
    SPRITE_IDS.push(`${shape}-${colorName}`);
    SPRITE_IDS.push(`${shape}-${colorName}-ring`);
  }
}

/**
 * Register all 24 marker sprites on the given MapLibre map instance.
 * Call this once after the map's 'load' event fires.
 *
 * @param {import('maplibre-gl').Map} map
 */
export function registerSprites(map) {
  for (const shape of SHAPES) {
    for (const [colorName, hex] of Object.entries(COLORS)) {
      for (const ring of RING_VARIANTS) {
        const id = ring ? `${shape}-${colorName}-ring` : `${shape}-${colorName}`;
        if (map.hasImage(id)) continue;
        const canvas = drawIcon(shape, hex, ring);
        map.addImage(id, canvas, { pixelRatio: 1 });
      }
    }
  }
}
