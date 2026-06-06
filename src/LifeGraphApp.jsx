import React from "react";
import { catmull, sampleCatmull } from "./helpers";

/* Drag points to set how full a moment felt; the line warms (green) while
   life climbs and cools (red) while it slips; add/edit/delete moments.
   Data is loaded/saved by the parent via the initialState / onPersist props. */

const VBW = 1200, VBH = 720;
const MARG = { l: 92, r: 130, t: 132, b: 138 };
const PLOT = { x0: MARG.l, x1: VBW - MARG.r, y0: MARG.t, y1: VBH - MARG.b };

const COL = {
  paper: "#F3ECDC", ink: "#2E2A24", inkSoft: "#6B6457",
  growth: "#5E7F2E", decline: "#C0573A", flat: "#9B8C5C",
  flag: "#F0E4CE", pole: "#6B4A2E", gold: "#C98A2B", terra: "#C2603C",
};

const EMOJI = ["🎓", "🏆", "🎂", "❤️", "🏠", "✈️", "💼", "🎉", "🌱", "⭐", "😢", "🐣"];

const DEFAULT_ERAS = [
  { from: 0, to: 5, label: "Childhood" },
  { from: 5, to: 18, label: "School" },
  { from: 18, to: 22, label: "College" },
  { from: 22, to: 99, label: "Work" },
];

const uid = () => "e" + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}
function slopeColor(dySlope) {
  // dySlope = change in screen-y per sample (>0 means going DOWN = decline)
  const SENS = 4.2;
  const t = clamp(dySlope / SENS, -1, 1);
  if (t > 0) return mix(COL.flat, COL.decline, t);
  return mix(COL.flat, COL.growth, -t);
}

const FACES = ["😭", "😢", "😞", "😐", "🙂", "😊", "😄", "🤩"];
function satFace(sat) { return FACES[clamp(Math.round((sat / 100) * (FACES.length - 1)), 0, FACES.length - 1)]; }

// searchable emoji library (emoji + space-separated keywords)
const EMOJI_LIB = [
  { e: "🎓", k: "graduation school college degree study learn" },
  { e: "🏫", k: "school building study" },
  { e: "📚", k: "books study read school education" },
  { e: "✏️", k: "pencil write study exam" },
  { e: "🏆", k: "trophy win award achievement first prize" },
  { e: "🥇", k: "medal gold win award" },
  { e: "⭐", k: "star favorite special" },
  { e: "🎉", k: "party celebrate birthday fun" },
  { e: "🎂", k: "birthday cake party age" },
  { e: "🎈", k: "balloon party celebrate" },
  { e: "❤️", k: "love heart relationship" },
  { e: "💑", k: "couple love relationship date" },
  { e: "💍", k: "ring engaged marriage propose" },
  { e: "👰", k: "wedding marriage bride" },
  { e: "👶", k: "baby child born newborn" },
  { e: "🐣", k: "hatch baby new beginning chick" },
  { e: "🐶", k: "dog pet puppy" },
  { e: "🐱", k: "cat pet kitten" },
  { e: "🏠", k: "home house move family" },
  { e: "🔑", k: "key home house new place" },
  { e: "💼", k: "work job briefcase career office" },
  { e: "💻", k: "laptop work computer code tech" },
  { e: "💰", k: "money savings rich salary" },
  { e: "📈", k: "growth chart success up" },
  { e: "🚀", k: "launch startup rocket success new" },
  { e: "✈️", k: "travel plane flight trip vacation abroad international" },
  { e: "🌍", k: "world travel earth global international" },
  { e: "🗺️", k: "map travel trip adventure" },
  { e: "🏖️", k: "beach vacation holiday sea" },
  { e: "⛰️", k: "mountain hike climb adventure" },
  { e: "🏕️", k: "camp nature outdoors" },
  { e: "🚗", k: "car drive license road" },
  { e: "🚲", k: "bike cycle" },
  { e: "⚽", k: "soccer football sport" },
  { e: "🏀", k: "basketball sport" },
  { e: "🎽", k: "run marathon race fitness sport" },
  { e: "🏋️", k: "gym fitness workout strong" },
  { e: "🧘", k: "yoga calm meditate health" },
  { e: "🎸", k: "guitar music band hobby" },
  { e: "🎵", k: "music song hobby" },
  { e: "🎨", k: "art paint hobby creative" },
  { e: "📷", k: "camera photo hobby" },
  { e: "✍️", k: "write author book journal" },
  { e: "🌱", k: "grow plant new beginning nature" },
  { e: "🌻", k: "flower sun bloom happy" },
  { e: "🌿", k: "nature leaf calm" },
  { e: "🔥", k: "fire passion intense motivation" },
  { e: "💡", k: "idea insight realization" },
  { e: "🧠", k: "mind brain therapy growth mental" },
  { e: "🙏", k: "grateful thanks pray hope" },
  { e: "🌈", k: "rainbow hope pride colorful" },
  { e: "🌟", k: "shine special glowing star" },
  { e: "💊", k: "medicine health sick recovery" },
  { e: "🏥", k: "hospital health surgery sick" },
  { e: "🤒", k: "sick ill unwell" },
  { e: "😢", k: "sad cry low down hard" },
  { e: "😔", k: "sad down low disappointed" },
  { e: "😭", k: "crying very sad grief" },
  { e: "💔", k: "heartbreak breakup loss sad" },
  { e: "😠", k: "angry mad frustrated" },
  { e: "😰", k: "anxious worried stress fear" },
  { e: "😴", k: "tired sleep exhausted burnout" },
  { e: "🍽️", k: "food dinner restaurant meal" },
  { e: "☕", k: "coffee cafe break" },
  { e: "🍾", k: "celebrate champagne toast party" },
  { e: "👥", k: "friends people social popular" },
  { e: "🤝", k: "deal partner agreement team" },
  { e: "🎤", k: "speech sing perform stage" },
  { e: "🎬", k: "movie film hobby" },
  { e: "🎮", k: "game gaming hobby fun" },
  { e: "📱", k: "phone tech app" },
  { e: "🔬", k: "science research lab" },
  { e: "⚓", k: "anchor stable steady ground" },
];

export default function LifeGraphApp({ initialState, account, onPersist }) {
  const init = React.useRef(initialState).current;
  const [events, setEvents] = React.useState(init.events);
  const [title, setTitle] = React.useState(init.title);
  const [subtitle, setSubtitle] = React.useState(init.subtitle);
  const [selected, setSelected] = React.useState(null);
  const [dragId, setDragId] = React.useState(null);
  const [hoverId, setHoverId] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);
  const [todayAge, setTodayAge] = React.useState(init.todayAge != null ? init.todayAge : Math.max(0, ...init.events.map((e) => e.age)));
  const [pop, setPop] = React.useState(null);
  const [emojiMore, setEmojiMore] = React.useState(false);
  const [emojiQuery, setEmojiQuery] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  const svgRef = React.useRef(null);

  // persist (debounced) — parent decides where it goes (Supabase + local cache)
  React.useEffect(() => {
    const t = setTimeout(() => {
      onPersist({ events: events.filter((e) => e.title && e.title.trim()), title, subtitle, todayAge });
    }, 400);
    return () => clearTimeout(t);
  }, [events, title, subtitle, todayAge, onPersist]);

  // draw-on reveal
  React.useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t); }, []);

  // discard a moment that was never given a title when its editor closes
  const prevSelRef = React.useRef(null);
  React.useEffect(() => {
    const prev = prevSelRef.current;
    if (prev && prev !== selected) {
      setEvents((es) => {
        const m = es.find((e) => e.id === prev);
        return (m && (!m.title || !m.title.trim())) ? es.filter((e) => e.id !== prev) : es;
      });
    }
    prevSelRef.current = selected;
  }, [selected]);

  const sorted = React.useMemo(() => [...events].sort((a, b) => a.age - b.age), [events]);
  const domainMax = React.useMemo(() => {
    const m = Math.max(25, todayAge, ...events.map((e) => e.age));
    return Math.ceil((m + 8) / 5) * 5;
  }, [events, todayAge]);

  const xOf = (age) => PLOT.x0 + (age / domainMax) * (PLOT.x1 - PLOT.x0);
  const yOf = (sat) => PLOT.y0 + (1 - sat / 100) * (PLOT.y1 - PLOT.y0);
  const ageOf = (x) => clamp(((x - PLOT.x0) / (PLOT.x1 - PLOT.x0)) * domainMax, 0, domainMax);
  const satOf = (y) => clamp((1 - (y - PLOT.y0) / (PLOT.y1 - PLOT.y0)) * 100, 0, 100);

  const pts = sorted.map((e) => ({ ...e, px: xOf(e.age), py: yOf(e.sat) }));

  // densely-sampled curve (shared by line segments + label collision)
  const curveSamples = React.useMemo(
    () => (pts.length >= 2 ? sampleCatmull(pts.map((p) => ({ x: p.px, y: p.py })), 16, 1) : []),
    [pts.map((p) => p.px + "," + p.py).join("|")]
  );

  // colored segments
  const segs = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < curveSamples.length - 1; i++) {
      const a = curveSamples[i], b = curveSamples[i + 1];
      const future = ageOf((a.x + b.x) / 2) > todayAge + 0.2;
      out.push({ a, b, color: slopeColor(b.y - a.y), future });
    }
    return out;
  }, [curveSamples, todayAge]);

  // label placement: vertical stems, never overlapping the curve or each other
  const lay = React.useMemo(() => {
    const yRange = (x0, x1) => {
      let mn = Infinity, mx = -Infinity;
      for (const s of curveSamples) if (s.x >= x0 && s.x <= x1) { if (s.y < mn) mn = s.y; if (s.y > mx) mx = s.y; }
      return [mn, mx];
    };
    const placed = []; const out = [];
    pts.forEach((p, i) => {
      const prev = pts[i - 1], next = pts[i + 1];
      const valley = prev && next && p.sat <= prev.sat && p.sat < next.sat;
      const w = Math.max((p.title || "").length, (p.note || "").length + 3) * 7 + 16;
      const side = valley ? "below" : "above";
      // keep labels off the left axis / right edge: offset sideways there
      let anchor = "middle", lx = p.px;
      if (p.px - w / 2 < PLOT.x0 + 2) { anchor = "start"; lx = p.px + 13; }
      else if (p.px + w / 2 > PLOT.x1 + 34) { anchor = "end"; lx = p.px - 13; }
      const x0 = anchor === "start" ? lx : (anchor === "end" ? lx - w : p.px - w / 2);
      const x1 = anchor === "start" ? lx + w : (anchor === "end" ? lx : p.px + w / 2);
      let H = side === "above" ? 50 : 34;
      for (let tries = 0; tries < 10; tries++) {
        const ty = side === "above" ? p.py - H : p.py + H;
        const by0 = ty - 18;
        const by1 = ty + (p.note ? 22 : 4);
        const [cmn, cmx] = yRange(x0 - 4, x1 + 4);
        const curveHit = cmn !== Infinity && by0 <= cmx + 2 && by1 >= cmn - 2;
        const nbHit = placed.some((b) => !(x1 < b.x0 || x0 > b.x1 || by1 < b.y0 || by0 > b.y1));
        if (!curveHit && !nbHit) break;
        H += 22;
        if (H > (side === "above" ? 188 : 130)) break;
      }
      const ty = side === "above" ? p.py - H : p.py + H;
      placed.push({ x0: x0, x1: x1, y0: ty - 18, y1: ty + (p.note ? 22 : 4) });
      out.push({ side: side, H: H, ty: ty, anchor: anchor, lx: lx });
    });
    return out;
  }, [pts.map((p) => p.px + "," + p.py + "," + (p.title || "") + "," + (p.note || "")).join("|"), curveSamples]);

  // ---- pointer helpers ----
  function toSvg(evt) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = svg.getScreenCTM().inverse();
    return pt.matrixTransform(m);
  }

  function startDrag(evt, id) {
    evt.stopPropagation();
    evt.preventDefault();
    setSelected(null);
    setDragId(id);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
  }
  const dragRef = React.useRef(null);
  React.useEffect(() => { dragRef.current = { dragId, sorted }; });
  function onMove(evt) {
    const { dragId } = dragRef.current;
    if (!dragId) return;
    const p = toSvg(evt);
    const newSat = satOf(p.y);            // vertical drag only — age stays fixed
    setEvents((prev) => prev.map((e) => e.id === dragId ? { ...e, sat: Math.round(newSat) } : e));
  }
  // draggable "today" marker (horizontal) to set current age
  function startTodayDrag(evt) {
    evt.stopPropagation(); evt.preventDefault();
    setSelected(null);
    window.addEventListener("pointermove", onTodayMove);
    window.addEventListener("pointerup", endTodayDrag);
  }
  function onTodayMove(evt) {
    const p = toSvg(evt);
    setTodayAge(clamp(+ageOf(p.x).toFixed(1), 0, domainMaxRef.current));
  }
  function endTodayDrag() {
    window.removeEventListener("pointermove", onTodayMove);
    window.removeEventListener("pointerup", endTodayDrag);
  }
  const domainMaxRef = React.useRef(domainMax);
  React.useEffect(() => { domainMaxRef.current = domainMax; });
  function endDrag() {
    setDragId(null);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", endDrag);
  }

  function addAt(age, sat) {
    const e = { id: uid(), title: "", note: "", emoji: "", age: +clamp(age, 0, domainMax).toFixed(2), sat: Math.round(clamp(sat, 0, 100)) };
    setEvents((prev) => [...prev, e]);
    setSelected(e.id);
  }
  function bgClick(evt) {
    if (dragId) return;
    if (evt.target.closest && evt.target.closest(".lg-flag, .lg-today, .lg-pop")) return; // not the canvas
    const p = toSvg(evt);
    if (p.x < PLOT.x0 - 20 || p.x > PLOT.x1 + 20 || p.y < PLOT.y0 - 30 || p.y > PLOT.y1 + 20) return;
    addAt(ageOf(p.x), satOf(p.y));
  }
  function patch(id, k, v) { setEvents((prev) => prev.map((e) => e.id === id ? { ...e, [k]: v } : e)); }
  function remove(id) { setEvents((prev) => prev.filter((e) => e.id !== id)); setSelected(null); }

  // ---- export to PNG (with fonts embedded so it looks right) ----
  async function embedFontCss() {
    const url = "https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap";
    let css = await (await fetch(url)).text();
    const found = [...css.matchAll(/url\((https:[^)]+\.woff2)\)/g)].map((m) => m[1]);
    const uniq = [...new Set(found)];
    const map = {};
    await Promise.all(uniq.map(async (u) => {
      const buf = await (await fetch(u)).arrayBuffer();
      const bytes = new Uint8Array(buf); let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      map[u] = "data:font/woff2;base64," + btoa(bin);
    }));
    for (const u of uniq) css = css.split(u).join(map[u]);
    return css;
  }
  async function exportPNG() {
    if (exporting) return;
    setExporting(true);
    setSelected(null);
    try {
      const node = svgRef.current.cloneNode(true);
      node.setAttribute("width", VBW); node.setAttribute("height", VBH);
      // paper background
      const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bg.setAttribute("x", 0); bg.setAttribute("y", 0); bg.setAttribute("width", VBW); bg.setAttribute("height", VBH); bg.setAttribute("fill", COL.paper);
      node.insertBefore(bg, node.firstChild);
      try {
        const css = await embedFontCss();
        const st = document.createElementNS("http://www.w3.org/2000/svg", "style");
        st.textContent = css;
        node.insertBefore(st, node.firstChild);
      } catch (e) { /* fall back to system fonts */ }
      const xml = new XMLSerializer().serializeToString(node);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const s = 2, canvas = document.createElement("canvas");
          canvas.width = VBW * s; canvas.height = VBH * s;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(s, s); ctx.drawImage(img, 0, 0, VBW, VBH);
          URL.revokeObjectURL(url);
          canvas.toBlob((b) => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = (title || "my-life-graph").replace(/[^\w]+/g, "-").toLowerCase() + ".png";
            a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); res();
          }, "image/png");
        };
        img.onerror = rej; img.src = url;
      });
    } catch (e) { /* no-op */ }
    setExporting(false);
  }

  React.useEffect(() => {
    const k = (e) => { if (e.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  // guides
  const guides = [{ sat: 88, label: "thriving" }, { sat: 55, label: "steady" }, { sat: 22, label: "hard" }];
  const ticks = []; for (let a = 0; a <= domainMax + 0.001; a += 5) ticks.push(Math.round(a));

  // editor popover — position frozen on open so it doesn't jump while editing
  const sel = selected ? events.find((e) => e.id === selected) : null;
  React.useEffect(() => {
    setEmojiMore(false); setEmojiQuery("");
    if (!selected || !svgRef.current) { setPop(null); return; }
    const ev = events.find((e) => e.id === selected);
    if (!ev) { setPop(null); return; }
    const r = svgRef.current.getBoundingClientRect();
    const px = xOf(ev.age), py = yOf(ev.sat);
    let left = r.left + (px / VBW) * r.width;
    const top = r.top + (py / VBH) * r.height;
    const place = (py < 300) ? "below" : "above";
    left = clamp(left, r.left + 150, r.right - 150);
    setPop({ left: left, top: top, place: place });
  }, [selected]);

  const linePath = pts.length >= 2 ? catmull(pts.map((p) => ({ x: p.px, y: p.py })), 1) : "";

  return (
    <div className="lg-wrap">
      <header className="lg-head">
        <div className="lg-head-l">
          <h1 className="lg-title" contentEditable suppressContentEditableWarning
            onBlur={(e) => setTitle(e.target.textContent)}>{title}</h1>
          <p className="lg-sub" contentEditable suppressContentEditableWarning
            onBlur={(e) => setSubtitle(e.target.textContent)}>{subtitle}</p>
        </div>
        <div className="lg-head-r">
          {account ? (
            <div className="lg-account">
              <span className="lg-acct-email">{account.email}</span>
              <button className="lg-acct-btn" onClick={account.onSignOut}>sign out</button>
            </div>
          ) : null}
          <div className="lg-legend">
            <span><i className="sw" style={{ background: COL.growth }}></i>climbing</span>
            <span><i className="sw" style={{ background: COL.decline }}></i>harder days</span>
          </div>
          <div className="lg-btns">
            <button className="lg-add ghost" onClick={exportPNG} disabled={exporting}>{exporting ? "Exporting…" : "↓ Export image"}</button>
            <button className="lg-add" onClick={() => addAt(domainMax * 0.5, 50)}>＋ Add a moment</button>
          </div>
        </div>
      </header>

      <div className="lg-stage">
        <svg ref={svgRef} viewBox={`0 0 ${VBW} ${VBH}`} className="lg-svg" onClick={bgClick}>
          <defs>
            <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.045 0" /></filter>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.2" fill="#CDC0A2" /></pattern>
          </defs>

          <rect x={PLOT.x0} y={PLOT.y0 - 18} width={PLOT.x1 - PLOT.x0} height={PLOT.y1 - PLOT.y0 + 18} fill="url(#dots)" opacity="0.6" />

          {todayAge < domainMax - 0.1 ? (
            <g className="lg-future">
              <rect x={xOf(todayAge)} y={PLOT.y0 - 18} width={PLOT.x1 - xOf(todayAge)} height={PLOT.y1 - PLOT.y0 + 26} fill="#E2D9C0" opacity="0.5" />
              <text x={(xOf(todayAge) + PLOT.x1) / 2} y={PLOT.y1 - 12} textAnchor="middle" className="t-ital" fontSize="15" fill="#A89A7C">the years ahead — drop a hope or goal here</text>
            </g>
          ) : null}

          {guides.map((g, i) => (
            <g key={i}>
              <line x1={PLOT.x0} y1={yOf(g.sat)} x2={PLOT.x1} y2={yOf(g.sat)} stroke={COL.inkSoft} strokeWidth="1" strokeDasharray="2 7" opacity="0.45" />
              <text x={PLOT.x0 - 14} y={yOf(g.sat) + 5} textAnchor="end" className="t-hand" fontSize="22" fill={COL.inkSoft}>{g.label}</text>
            </g>
          ))}

          <line x1={PLOT.x0} y1={PLOT.y0 - 18} x2={PLOT.x0} y2={PLOT.y1 + 8} stroke={COL.ink} strokeWidth="1.6" />
          <line x1={PLOT.x0 - 4} y1={PLOT.y1 + 8} x2={PLOT.x1 + 10} y2={PLOT.y1 + 8} stroke={COL.ink} strokeWidth="1.6" />
          {ticks.map((a) => (
            <g key={a}>
              <line x1={xOf(a)} y1={PLOT.y1 + 8} x2={xOf(a)} y2={PLOT.y1 + 15} stroke={COL.ink} strokeWidth="1.3" />
              <text x={xOf(a)} y={PLOT.y1 + 34} textAnchor="middle" className="t-hand" fontSize="21" fill={COL.inkSoft}>{a}</text>
            </g>
          ))}
          <text x={PLOT.x1 + 12} y={PLOT.y1 + 34} textAnchor="start" className="t-ital" fontSize="16" fill={COL.inkSoft}>age →</text>

          {DEFAULT_ERAS.map((e, i) => {
            const to = Math.min(e.to, domainMax);
            if (e.from >= domainMax) return null;
            const cx = (xOf(e.from) + xOf(to)) / 2;
            return (
              <g key={i}>
                <line x1={xOf(e.from) + 6} y1={PLOT.y1 + 52} x2={xOf(to) - 6} y2={PLOT.y1 + 52} stroke={COL.inkSoft} strokeWidth="1" opacity="0.4" />
                <text x={cx} y={PLOT.y1 + 73} textAnchor="middle" className="t-era" fill={COL.inkSoft}>{e.label}</text>
              </g>
            );
          })}

          {/* line (draws on via CSS) */}
          <g className={"lg-line" + (mounted ? " in" : "")}>
            <path d={linePath} fill="none" stroke="#000" strokeOpacity="0.10" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,4)" />
            {segs.map((s, i) => (
              <line key={i} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={s.color} strokeWidth={s.future ? 3 : 4.4} strokeLinecap="round" strokeDasharray={s.future ? "1 8" : "none"} opacity={s.future ? 0.6 : 1} />
            ))}
          </g>

          {/* today marker (draggable horizontally to set current age) */}
          <g className="lg-today" style={{ cursor: "ew-resize" }} onPointerDown={startTodayDrag}>
            <line x1={xOf(todayAge)} y1={PLOT.y0 - 16} x2={xOf(todayAge)} y2={PLOT.y1 + 6} stroke={COL.gold} strokeWidth="1.6" strokeDasharray="4 5" />
            <rect x={xOf(todayAge) - 12} y={PLOT.y0 - 16} width="24" height={PLOT.y1 - PLOT.y0 + 22} fill="transparent" />
            <g transform={`translate(${xOf(todayAge)}, ${PLOT.y0 - 20})`}>
              <rect x="-27" y="-22" width="54" height="21" rx="6" fill={COL.gold} />
              <text x="0" y="-7" textAnchor="middle" className="t-hand" fontSize="17" fontWeight="700" fill="#FBF1DC">today</text>
              <path d="M-6,-1 L6,-1 L0,7 Z" fill={COL.gold} />
            </g>
          </g>

          {/* moments */}
          {pts.map((p, i) => {
            const isToday = Math.abs(p.age - todayAge) < 0.5;
            const isFuture = p.age > todayAge + 0.4;
            const isActive = p.id === dragId || p.id === hoverId || p.id === selected;
            const L = lay[i];
            const above = L.side === "above";
            const ty = L.ty;
            const markCol = isToday ? COL.gold : (isFuture ? "#A89A7C" : COL.ink);
            const leaderTop = above ? (p.emoji ? p.py - 30 : p.py - 13) : (p.py + 13);
            const leaderEnd = above ? ty + (p.note ? 23 : 7) : ty - 16;
            return (
              <g key={p.id} className={"lg-flag" + (mounted ? " in" : "")} style={{ cursor: "grab", transitionDelay: (0.25 + i * 0.09) + "s" }}
                onPointerDown={(e) => startDrag(e, p.id)}
                onPointerEnter={() => setHoverId(p.id)} onPointerLeave={() => setHoverId(null)}
                onDoubleClick={(e) => { e.stopPropagation(); setSelected(p.id); }}>
                {/* leader from point to label (vertical, or angled near the edges) */}
                <line x1={p.px} y1={leaderTop} x2={L.lx} y2={leaderEnd} stroke={COL.inkSoft} strokeWidth="1" opacity="0.32" />
                {/* emoji above the point, if set */}
                {p.emoji ? <text x={p.px} y={p.py - 15} textAnchor="middle" fontSize="26" opacity={isFuture ? 0.85 : 1}>{p.emoji}</text> : null}
                {/* the marker dot */}
                <circle cx={p.px} cy={p.py} r={isActive ? 9.5 : 7.5} fill={COL.paper} stroke={markCol} strokeWidth="2.8" strokeDasharray={isFuture ? "3 3" : "none"} />
                <circle cx={p.px} cy={p.py} r="2.8" fill={markCol} />
                {/* hit area */}
                <circle cx={p.px} cy={p.py} r="22" fill="transparent" />
                {/* label */}
                <text x={L.lx} y={ty} textAnchor={L.anchor} className="t-hand" fontSize="25" fontWeight="700" fill={isFuture ? "#8C7F63" : COL.ink} fontStyle={isFuture ? "italic" : "normal"}>{p.title}</text>
                {p.note ? <text x={L.lx} y={ty + 18} textAnchor={L.anchor} className="t-ital" fontSize="14" fill={COL.inkSoft}>{p.note}</text> : null}
                {/* feeling face while dragging/hovering — offset to the side, clear of the cursor */}
                {(p.id === dragId || p.id === hoverId) ? (() => {
                  const fs = p.px > (PLOT.x0 + PLOT.x1) / 2 ? -1 : 1;
                  const fx = p.px + fs * 42, fy = p.py;
                  return (
                    <g style={{ pointerEvents: "none" }}>
                      <circle cx={fx} cy={fy - 9} r="19" fill={COL.paper} opacity="0.9" />
                      <text x={fx} y={fy} textAnchor="middle" fontSize="30">{satFace(p.sat)}</text>
                    </g>
                  );
                })() : null}
              </g>
            );
          })}

          <rect x="0" y="0" width={VBW} height={VBH} filter="url(#grain)" opacity="0.5" pointerEvents="none" />
        </svg>

        <p className="lg-hint">drag a point ↕ to set the feeling · double-click to edit age, emoji &amp; more · click past “today” to drop a future goal · drag the gold ‘today’ line to set your age</p>

        {sel && pop ? (
          <div className={"lg-pop" + (pop.place === "below" ? " below" : "")} style={{ left: pop.left, top: pop.top }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <div className="lg-pop-row">
              <input className="lg-in-title" value={sel.title} onChange={(e) => patch(sel.id, "title", e.target.value)} placeholder="What happened?" />
              <button className="lg-x" onClick={() => setSelected(null)}>✕</button>
            </div>
            <input className="lg-in" value={sel.note || ""} onChange={(e) => patch(sel.id, "note", e.target.value)} placeholder="a note (optional)" />
            <div className="lg-emoji">
              {EMOJI.map((em) => (
                <button key={em} className={"lg-em" + (sel.emoji === em ? " on" : "")} onClick={() => patch(sel.id, "emoji", sel.emoji === em ? "" : em)}>{em}</button>
              ))}
              <button className={"lg-em lg-more" + (emojiMore ? " on" : "")} title="search more" onClick={() => setEmojiMore((v) => !v)}>{emojiMore ? "×" : "⋯"}</button>
            </div>
            {emojiMore ? (
              <div className="lg-emolib">
                <input className="lg-emsearch" autoFocus value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="search emoji — travel, love, work…" />
                <div className="lg-emgrid">
                  {EMOJI_LIB.filter((x) => !emojiQuery.trim() || x.k.includes(emojiQuery.trim().toLowerCase()) || x.e === emojiQuery.trim()).slice(0, 60).map((x) => (
                    <button key={x.e} className={"lg-em" + (sel.emoji === x.e ? " on" : "")} onClick={() => patch(sel.id, "emoji", sel.emoji === x.e ? "" : x.e)}>{x.e}</button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="lg-lab"><span>When · age {sel.age}</span>
              <input type="range" min="0" max={domainMax} step="0.5" value={sel.age}
                onChange={(e) => patch(sel.id, "age", +e.target.value)} />
            </label>
            <label className="lg-lab"><span>How it felt</span>
              <input type="range" min="0" max="100" value={sel.sat}
                onChange={(e) => patch(sel.id, "sat", +e.target.value)} />
              <div className="lg-scale"><span>😭</span><span>😞</span><span>😐</span><span>🙂</span><span>🤩</span></div>
            </label>
            <button className="lg-del" onClick={() => remove(sel.id)}>Delete moment</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
