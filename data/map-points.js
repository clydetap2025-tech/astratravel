/**
 * Where places sit on the City Lens map, a 1200 × 720 schematic of central Almaty with 60-unit blocks.
 * Approximate: the map is a sketch, not to scale. Places outside the city (day trips) have no point.
 * @type {Record<string, { x: number; y: number }>}
 */
export const MAP_POINTS = {
  bazaar: { x: 720, y: 165 }, lanzhou: { x: 600, y: 190 }, cathedral: { x: 750, y: 240 }, rodem: { x: 545, y: 235 },
  ramen77: { x: 690, y: 290 }, navat: { x: 790, y: 335 }, "kok-tobe": { x: 935, y: 465 }, tandoor: { x: 470, y: 300 },
  "sadik-usta": { x: 300, y: 400 }, "line-brew": { x: 655, y: 340 }, ami: { x: 630, y: 285 }, shakespeare: { x: 790, y: 280 },
  dadiani: { x: 845, y: 305 },
};
