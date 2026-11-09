// Small helpers that generate the inline SVG used by visual aptitude items.
// Everything is drawn on an 80x80 viewBox so options render at a consistent size.

const STROKE = '#1F4D43' // spruce, keep visual items on the brand palette
const FILL = '#CFE0D8' // soft spruce tint

function wrap(inner: string): string {
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">${inner}</svg>`
}

export function polygon(points: string, filled = true): string {
  return wrap(
    `<polygon points="${points}" fill="${filled ? FILL : 'none'}" stroke="${STROKE}" stroke-width="3" stroke-linejoin="round"/>`,
  )
}

export function circleShape(): string {
  return wrap(`<circle cx="40" cy="40" r="30" fill="${FILL}" stroke="${STROKE}" stroke-width="3"/>`)
}

export const SHAPES = {
  triangle: polygon('40,12 66,64 14,64'),
  square: polygon('15,16 65,16 65,66 15,66'),
  pentagon: polygon('40,10 68.5,30.7 57.6,64.3 22.4,64.3 11.5,30.7'),
  hexagon: polygon('40,10 65.98,25 65.98,55 40,70 14.02,55 14.02,25'),
  circle: circleShape(),
}

// Directional arrows (used in the rotation-sequence item).
export function arrow(dir: 'up' | 'down' | 'left' | 'right'): string {
  const paths: Record<string, string> = {
    up: 'M40,62 V22 M28,34 L40,20 L52,34',
    down: 'M40,18 V58 M28,46 L40,60 L52,46',
    right: 'M18,40 H58 M46,28 L60,40 L46,52',
    left: 'M62,40 H22 M34,28 L20,40 L34,52',
  }
  return wrap(
    `<path d="${paths[dir]}" fill="none" stroke="${STROKE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  )
}

// Render a polyomino from [col,row] cells on a unit grid, auto-centred.
export function poly(cells: [number, number][], unit = 16): string {
  const cols = Math.max(...cells.map((c) => c[0])) + 1
  const rows = Math.max(...cells.map((c) => c[1])) + 1
  const offX = (80 - cols * unit) / 2
  const offY = (80 - rows * unit) / 2
  const rects = cells
    .map(
      ([c, r]) =>
        `<rect x="${offX + c * unit}" y="${offY + r * unit}" width="${unit}" height="${unit}" fill="${FILL}" stroke="${STROKE}" stroke-width="2.5"/>`,
    )
    .join('')
  return wrap(rects)
}

// The "F" letter in four orientations, for the mirror-image item.
export function fShape(variant: 'normal' | 'mirror' | 'flip180' | 'rot90'): string {
  const rects: Record<string, [number, number, number, number][]> = {
    // [x, y, w, h]
    normal: [
      [24, 14, 10, 52],
      [24, 14, 30, 10],
      [24, 34, 22, 10],
    ],
    mirror: [
      [46, 14, 10, 52],
      [26, 14, 30, 10],
      [34, 34, 22, 10],
    ],
    flip180: [
      [46, 14, 10, 52],
      [26, 56, 30, 10],
      [34, 36, 22, 10],
    ],
    rot90: [
      [14, 46, 52, 10],
      [14, 26, 10, 30],
      [34, 34, 10, 22],
    ],
  }
  const inner = rects[variant]
    .map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${STROKE}"/>`)
    .join('')
  return wrap(inner)
}
