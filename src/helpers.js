// Shared drawing math for the life graph.
// Catmull-Rom curve fitting + dense sampling, used for the line render and
// the label-collision layout.

// Catmull-Rom -> cubic bezier path through points (organic, overshoots at peaks)
export function catmull(pts, k) {
  k = k == null ? 1 : k;
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * k;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * k;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * k;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * k;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

// densely sample a catmull curve, returns array of {x,y}
export function sampleCatmull(pts, stepsPer, k) {
  stepsPer = stepsPer || 24;
  k = k == null ? 1 : k;
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    for (let s = 0; s < stepsPer; s++) {
      const t = s / stepsPer;
      const t2 = t * t, t3 = t2 * t;
      const cx = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t * k +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const cy = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t * k +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      out.push({ x: cx, y: cy });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
