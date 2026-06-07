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

// Phases are open-ended: each runs from its `from` age until the next phase
// begins (the last runs to wherever the graph currently ends). Labels are
// editable and persisted, so they follow the user's data instead of being a
// fixed, decorative band.
const DEFAULT_ERAS = [
  { from: 0, label: "Childhood" },
  { from: 7, label: "Growing up" },
  { from: 18, label: "Adulthood" },
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
  // faces / expressions
  { e: "😀", k: "happy smile grin face glad" },
  { e: "😃", k: "happy smile face joy" },
  { e: "😄", k: "happy smile laugh face joy" },
  { e: "😁", k: "grin happy face beam" },
  { e: "😆", k: "laugh happy face haha" },
  { e: "😅", k: "relief nervous laugh sweat face" },
  { e: "😂", k: "laugh cry funny lol face joy" },
  { e: "🤣", k: "laugh rofl funny face" },
  { e: "🙂", k: "smile slight happy ok face" },
  { e: "🙃", k: "upside down silly playful face" },
  { e: "😉", k: "wink playful face" },
  { e: "😊", k: "happy smile content warm face" },
  { e: "😇", k: "angel innocent good face" },
  { e: "🥰", k: "love adore hearts happy face" },
  { e: "😍", k: "love heart eyes adore face" },
  { e: "🤩", k: "star struck amazed wow excited face" },
  { e: "😘", k: "kiss love face" },
  { e: "😋", k: "yum tasty happy face" },
  { e: "😎", k: "cool sunglasses confident face" },
  { e: "🥳", k: "party celebrate birthday face" },
  { e: "😌", k: "calm relieved content peace face" },
  { e: "😏", k: "smirk sly confident face" },
  { e: "🥲", k: "happy tears bittersweet face" },
  { e: "🥹", k: "holding back tears touched grateful face" },
  { e: "😐", k: "neutral meh blank face" },
  { e: "😑", k: "expressionless blank face" },
  { e: "😶", k: "no words speechless blank face" },
  { e: "🙄", k: "eye roll annoyed face" },
  { e: "😬", k: "grimace awkward nervous face" },
  { e: "🤔", k: "thinking wonder hmm face" },
  { e: "😕", k: "confused unsure slight frown face" },
  { e: "🙁", k: "slight frown sad face" },
  { e: "😟", k: "worried concerned sad face" },
  { e: "😣", k: "persevere struggle frustrated face" },
  { e: "😖", k: "confounded frustrated face" },
  { e: "😩", k: "weary tired frustrated face" },
  { e: "😫", k: "tired exhausted overwhelmed face" },
  { e: "🥺", k: "pleading sad cute begging face" },
  { e: "😤", k: "frustrated determined huff face" },
  { e: "😡", k: "angry mad rage face" },
  { e: "🤬", k: "swearing furious angry face" },
  { e: "😳", k: "flushed shocked embarrassed face" },
  { e: "🥵", k: "hot overwhelmed burnout face" },
  { e: "🥶", k: "cold freezing face" },
  { e: "😱", k: "scream shocked fear face" },
  { e: "😨", k: "fearful scared anxious face" },
  { e: "😥", k: "sad disappointed relieved face" },
  { e: "😓", k: "sweat stressed tired face" },
  { e: "🤗", k: "hug warm comfort face" },
  { e: "🤭", k: "giggle shy oops face" },
  { e: "😔", k: "sad down pensive low face" },
  { e: "😞", k: "disappointed sad low face" },
  { e: "😢", k: "cry sad tear face" },
  { e: "😭", k: "sob crying very sad grief face" },
  { e: "😪", k: "sleepy tired face" },
  { e: "😴", k: "sleep tired exhausted face" },
  { e: "🤒", k: "sick ill fever face" },
  { e: "🤕", k: "hurt injured face" },
  { e: "🤯", k: "mind blown shocked overwhelmed face" },
  { e: "😵", k: "dizzy overwhelmed dazed face" },
  { e: "🫠", k: "melting overwhelmed done face" },
];

export default function LifeGraphApp({ initialState, account, onPersist, onRequestAuth }) {
  const init = React.useRef(initialState).current;
  const [events, setEvents] = React.useState(init.events);
  const [title, setTitle] = React.useState(init.title);
  const [subtitle, setSubtitle] = React.useState(init.subtitle);
  const [eras, setEras] = React.useState(
    Array.isArray(init.eras) && init.eras.length ? init.eras : DEFAULT_ERAS
  );
  const [editingEra, setEditingEra] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [dragId, setDragId] = React.useState(null);
  const [hoverId, setHoverId] = React.useState(null);
  const [mounted, setMounted] = React.useState(false);
  const [todayAge, setTodayAge] = React.useState(init.todayAge != null ? init.todayAge : Math.max(0, ...init.events.map((e) => e.age)));
  const [pop, setPop] = React.useState(null);
  const [emojiMore, setEmojiMore] = React.useState(false);
  const [emojiQuery, setEmojiQuery] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  const [canUndo, setCanUndo] = React.useState(false);
  const [phasePop, setPhasePop] = React.useState(null);
  const svgRef = React.useRef(null);

  // persist (debounced) — parent decides where it goes (Supabase + local cache)
  React.useEffect(() => {
    const t = setTimeout(() => {
      onPersist({ events: events.filter((e) => e.title && e.title.trim()), title, subtitle, todayAge, eras });
    }, 400);
    return () => clearTimeout(t);
  }, [events, title, subtitle, todayAge, eras, onPersist]);

  // ---- undo: record settled snapshots (drags/typing coalesce via the debounce) ----
  const histRef = React.useRef([]);
  const committedRef = React.useRef({ events: init.events, title: init.title, subtitle: init.subtitle, eras: (Array.isArray(init.eras) && init.eras.length ? init.eras : DEFAULT_ERAS), todayAge: (init.todayAge != null ? init.todayAge : Math.max(0, ...init.events.map((e) => e.age))) });
  React.useEffect(() => {
    const t = setTimeout(() => {
      const next = { events, title, subtitle, eras, todayAge };
      if (JSON.stringify(next) !== JSON.stringify(committedRef.current)) {
        histRef.current.push(committedRef.current);
        if (histRef.current.length > 60) histRef.current.shift();
        committedRef.current = next;
        setCanUndo(histRef.current.length > 0);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [events, title, subtitle, eras, todayAge]);
  function undo() {
    if (!histRef.current.length) return;
    const prev = histRef.current.pop();
    committedRef.current = prev;   // so the snapshot effect doesn't re-record this restore
    setEvents(prev.events); setTitle(prev.title); setSubtitle(prev.subtitle);
    setEras(prev.eras); setTodayAge(prev.todayAge);
    setSelected(null); setEditingEra(null);
    setCanUndo(histRef.current.length > 0);
  }
  const undoRef = React.useRef(undo); undoRef.current = undo;
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
        e.preventDefault(); undoRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const dragRef = React.useRef(null);
  function startDrag(evt, id) {
    evt.stopPropagation();
    evt.preventDefault();
    setDragId(id);
    // remember what was open so a click can toggle the editor closed
    dragRef.current = { dragId: id, moved: false, x: evt.clientX, y: evt.clientY, wasSelected: selected };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", endDrag);
  }
  function onMove(evt) {
    const d = dragRef.current;
    if (!d || !d.dragId) return;
    if (!d.moved) {                 // ignore micro-movement so a click isn't read as a drag
      const dx = evt.clientX - d.x, dy = evt.clientY - d.y;
      if (dx * dx + dy * dy < 16) return;
      d.moved = true;
      setSelected(null);            // a real drag started → close any open editor
    }
    const p = toSvg(evt);
    const newSat = satOf(p.y);      // vertical drag only — age stays fixed
    setEvents((prev) => prev.map((e) => e.id === d.dragId ? { ...e, sat: Math.round(newSat) } : e));
  }
  function endDrag() {
    const d = dragRef.current;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", endDrag);
    // a press with no real drag is a click → toggle that moment's editor
    if (d && d.dragId && !d.moved) setSelected(d.wasSelected === d.dragId ? null : d.dragId);
    setDragId(null);
    dragRef.current = null;
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

  function addAt(age, sat) {
    const e = { id: uid(), title: "", note: "", emoji: "", age: +clamp(age, 0, domainMax).toFixed(2), sat: Math.round(clamp(sat, 0, 100)) };
    setEvents((prev) => [...prev, e]);
    setSelected(e.id);
  }
  // single click on empty canvas just dismisses an open editor — never adds
  function bgClick(evt) {
    if (dragId) return;
    if (evt.target.closest && evt.target.closest(".lg-flag, .lg-today, .lg-pop, .lg-phase-pop, .lg-era-label")) return; // not the canvas
    if (selected) setSelected(null);
    if (editingEra != null) setEditingEra(null);
  }
  // a moment is added only on a deliberate double-click of empty canvas
  function bgDoubleClick(evt) {
    if (dragId) return;
    if (evt.target.closest && evt.target.closest(".lg-flag, .lg-today, .lg-pop")) return; // not the canvas
    const p = toSvg(evt);
    if (p.x < PLOT.x0 - 20 || p.x > PLOT.x1 + 20 || p.y < PLOT.y0 - 30 || p.y > PLOT.y1 + 20) return;
    addAt(ageOf(p.x), satOf(p.y));
  }
  function patch(id, k, v) { setEvents((prev) => prev.map((e) => e.id === id ? { ...e, [k]: v } : e)); }
  function remove(id) { setEvents((prev) => prev.filter((e) => e.id !== id)); setSelected(null); }
  // ---- phases (eras): rename / move / add / delete ----
  function renamePhase(idx, label) { setEras((prev) => prev.map((e, i) => (i === idx ? { ...e, label } : e))); }
  function setPhaseFrom(idx, age) {
    const v = clamp(Math.round(+age || 0), 0, domainMax);
    setEras((prev) => prev.map((e, i) => (i === idx ? { ...e, from: v } : e)));
  }
  function addPhaseAfter(idx) {
    const cur = eras[idx];
    const later = eras.map((e) => e.from).filter((f) => f > cur.from).sort((a, b) => a - b);
    const nextFrom = later.length ? later[0] : domainMax;
    const from = clamp(Math.round((cur.from + nextFrom) / 2), 0, domainMax);
    setEras((prev) => [...prev, { from, label: "New phase" }]);
    setEditingEra(eras.length);   // open the newly added phase for naming
  }
  function deletePhase(idx) {
    setEras((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    setEditingEra(null);
  }

  // ---- export to PNG (with fonts embedded so it looks right) ----
  async function embedFontCss() {
    const url = "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&display=swap";
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
    setSelected(null); setHoverId(null); setDragId(null);
    try {
      const NS = "http://www.w3.org/2000/svg";
      const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      // a shared image isn't interactive — strip any "drag a point…" instruction
      // clause from the subtitle so it reads as a description, not a UI hint
      const exportSubtitle = ((subtitle || "").replace(/\s*[—–-]\s*drag\b.*/i, "").trim()) || subtitle;
      // give the export a dedicated header band so the title/subtitle never
      // collide with the chart's top labels (on screen those live in HTML above)
      const HEADER = 116;
      const EXP_H = VBH + HEADER;
      // crop the right edge to a little past "today" (or the furthest moment) so
      // the shared image isn't dominated by an empty future band; the SVG viewBox
      // clips cleanly, so trailing ticks/axis simply end there
      const lastAge = Math.max(todayAge, ...events.map((e) => e.age));
      const cropAge = Math.min(domainMax, Math.ceil((lastAge + 2) / 5) * 5);
      const EXP_W = Math.min(VBW, Math.round(xOf(cropAge) + 70));
      const node = svgRef.current.cloneNode(true);
      node.setAttribute("viewBox", `0 0 ${EXP_W} ${EXP_H}`);
      node.setAttribute("width", EXP_W); node.setAttribute("height", EXP_H);
      // push the whole chart down below the header band
      const chartG = document.createElementNS(NS, "g");
      chartG.setAttribute("transform", `translate(0, ${HEADER})`);
      while (node.firstChild) chartG.appendChild(node.firstChild);
      node.appendChild(chartG);
      // drop interactive-only guidance so the shared image reads as a finished
      // keepsake, not a screenshot of a tool (keeps the shaded "future" band)
      chartG.querySelectorAll(".lg-future text").forEach((n) => n.remove());
      // never bake in a transient hover/drag feeling face
      chartG.querySelectorAll(".lg-face").forEach((n) => n.remove());
      // paper background (full canvas)
      const bg = document.createElementNS(NS, "rect");
      bg.setAttribute("x", 0); bg.setAttribute("y", 0); bg.setAttribute("width", EXP_W); bg.setAttribute("height", EXP_H); bg.setAttribute("fill", COL.paper);
      node.insertBefore(bg, node.firstChild);
      // bake the paper grain into the export (it lives on the page bg on screen)
      const grain = document.createElementNS(NS, "rect");
      grain.setAttribute("x", 0); grain.setAttribute("y", 0); grain.setAttribute("width", EXP_W); grain.setAttribute("height", EXP_H);
      grain.setAttribute("filter", "url(#grain)"); grain.setAttribute("opacity", "0.5");
      node.appendChild(grain);
      // title / subtitle / legend / frame / attribution — the on-screen header is
      // HTML, so it isn't in the SVG; bake a polished version into the export
      const deco = document.createElementNS(NS, "g");
      deco.innerHTML =
        `<rect x="16" y="16" width="${EXP_W - 32}" height="${EXP_H - 32}" rx="20" fill="none" stroke="#D8CBAC" stroke-width="2" opacity="0.85"/>` +
        `<text x="${MARG.l}" y="64" font-family="Spectral, serif" font-style="italic" font-weight="600" font-size="40" fill="${COL.ink}">${esc(title)}</text>` +
        `<text x="${MARG.l}" y="96" font-family="Caveat, cursive" font-size="26" fill="${COL.terra}">${esc(exportSubtitle)}</text>` +
        `<text x="${EXP_W - 40}" y="${EXP_H - 26}" text-anchor="end" font-family="Spectral, serif" font-style="italic" font-size="15" fill="${COL.inkSoft}" opacity="0.75">made with ArcLine · arcline-dun.vercel.app</text>`;
      node.appendChild(deco);
      try {
        const css = await embedFontCss();
        const st = document.createElementNS(NS, "style");
        // embed the webfonts AND the class→font-family rules (those live in the
        // external stylesheet, which a standalone SVG can't see)
        st.textContent = css +
          `\ntext{font-family:'Spectral',serif;}` +
          `\n.t-hand{font-family:'Caveat',cursive;}` +
          `\n.t-ital{font-family:'Spectral',serif;font-style:italic;}` +
          `\n.t-era{font-family:'Spectral',serif;letter-spacing:3px;}`;
        node.insertBefore(st, node.firstChild);
      } catch (e) { /* fall back to system fonts */ }
      const xml = new XMLSerializer().serializeToString(node);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const s = 2, canvas = document.createElement("canvas");
          canvas.width = EXP_W * s; canvas.height = EXP_H * s;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = COL.paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(s, s); ctx.drawImage(img, 0, 0, EXP_W, EXP_H);
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
    // export = intent to keep it → nudge anonymous users to save to an account
    if (!account && onRequestAuth) onRequestAuth();
  }

  React.useEffect(() => {
    const k = (e) => { if (e.key === "Escape") { setSelected(null); setEditingEra(null); } };
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
    // Map the dot's SVG coords to screen pixels via the live CTM — this is exact
    // even though the SVG is letterboxed (preserveAspectRatio), so the card lines
    // up directly with the moment's icon.
    const r = svgRef.current.getBoundingClientRect();
    const ctm = svgRef.current.getScreenCTM();
    const sp = svgRef.current.createSVGPoint();
    sp.x = xOf(ev.age); sp.y = yOf(ev.sat);
    const scr = sp.matrixTransform(ctm);
    const place = scr.y < r.top + r.height * 0.42 ? "below" : "above";
    const left = clamp(scr.x, r.left + 150, r.right - 150);
    setPop({ left: left, top: scr.y, place: place });
  }, [selected]);

  // phase editor popover — anchored above the phase's label band
  React.useEffect(() => {
    if (editingEra == null || !svgRef.current || !eras[editingEra]) { setPhasePop(null); return; }
    const ordered = eras.map((x, i) => ({ ...x, idx: i })).sort((a, b) => a.from - b.from);
    const oi = ordered.findIndex((o) => o.idx === editingEra);
    const e = ordered[oi];
    const next = ordered[oi + 1];
    const to = Math.min(next ? next.from : domainMax, domainMax);
    const cx = (xOf(e.from) + xOf(to)) / 2;
    const r = svgRef.current.getBoundingClientRect();
    const ctm = svgRef.current.getScreenCTM();
    const sp = svgRef.current.createSVGPoint();
    sp.x = cx; sp.y = PLOT.y1 + 60;
    const scr = sp.matrixTransform(ctm);
    setPhasePop({ left: clamp(scr.x, r.left + 120, r.right - 120), top: scr.y });
  }, [editingEra, eras, domainMax]);

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
          ) : (
            <div className="lg-account">
              <button className="lg-acct-btn lg-acct-save" onClick={onRequestAuth}>Sign in to save</button>
            </div>
          )}
          <div className="lg-btns">
            <button className="lg-add ghost" onClick={undo} disabled={!canUndo} title="Undo (⌘/Ctrl+Z)"><span className="lg-undo-ico">↩</span> Undo</button>
            <button className="lg-add ghost" onClick={exportPNG} disabled={exporting}>{exporting ? "Exporting…" : "↓ Export image"}</button>
            <button className="lg-add" onClick={() => addAt(domainMax * 0.5, 50)}>＋ Add a moment</button>
          </div>
        </div>
      </header>

      <div className="lg-stage">
        <svg ref={svgRef} viewBox={`0 0 ${VBW} ${VBH}`} className="lg-svg" onClick={bgClick} onDoubleClick={bgDoubleClick}>
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

          {/* phases: spans derived from the data; double-click a label to edit
              (rename / move / add / delete) via a popover */}
          {(() => {
            const ordered = eras.map((e, idx) => ({ ...e, idx })).sort((a, b) => a.from - b.from);
            return ordered.map((e, i) => {
              if (e.from >= domainMax) return null;
              const next = ordered[i + 1];
              const to = Math.min(next ? next.from : domainMax, domainMax);
              if (to <= e.from) return null;
              const cx = (xOf(e.from) + xOf(to)) / 2;
              const active = editingEra === e.idx;
              return (
                <g key={e.idx}>
                  <line x1={xOf(e.from) + 6} y1={PLOT.y1 + 52} x2={xOf(to) - 6} y2={PLOT.y1 + 52} stroke={active ? COL.gold : COL.inkSoft} strokeWidth="1" opacity={active ? 0.7 : 0.4} />
                  <text x={cx} y={PLOT.y1 + 73} textAnchor="middle" className="t-era lg-era-label" fill={active ? COL.gold : COL.inkSoft}
                    onClick={(ev) => ev.stopPropagation()}
                    onDoubleClick={(ev) => { ev.stopPropagation(); setEditingEra(e.idx); }}>
                    <title>double-click to edit this phase</title>{e.label}
                  </text>
                </g>
              );
            });
          })()}

          {/* line (draws on via CSS) */}
          <g className={"lg-line" + (mounted ? " in" : "")}>
            <path d={linePath} fill="none" stroke="#000" strokeOpacity="0.10" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" transform="translate(0,4)" />
            {segs.map((s, i) => (
              <line key={i} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={s.color} strokeWidth={s.future ? 3 : 4.4} strokeLinecap="round" strokeDasharray={s.future ? "1 8" : "none"} opacity={s.future ? 0.6 : 1} />
            ))}
          </g>

          {/* today marker (draggable horizontally to set current age) */}
          {(() => {
            const tx = xOf(todayAge);
            const right = tx < PLOT.x1 - 70;   // keep the flag on whichever side has room
            const dir = right ? 1 : -1;
            // if a moment sits at today, drop the flag just below its dot so it
            // never collides with that moment's label (which sits above)
            const coincident = pts.find((p) => Math.abs(p.age - todayAge) < 0.6);
            const flagY = coincident ? coincident.py + 32 : PLOT.y0 + 30;
            return (
              <g className="lg-today" style={{ cursor: "ew-resize" }} onPointerDown={startTodayDrag}>
                <line x1={tx} y1={PLOT.y0 - 16} x2={tx} y2={PLOT.y1 + 6} stroke={COL.gold} strokeWidth="1.6" strokeDasharray="4 5" />
                <rect x={tx - 12} y={PLOT.y0 - 16} width="24" height={PLOT.y1 - PLOT.y0 + 22} fill="transparent" />
                {/* horizontal flag beside the line, pointing at it */}
                <g transform={`translate(${tx}, ${flagY})`}>
                  <path d={right ? "M5,-5 L5,5 L-2,0 Z" : "M-5,-5 L-5,5 L2,0 Z"} fill={COL.gold} />
                  <rect x={right ? 5 : -59} y="-11" width="54" height="22" rx="6" fill={COL.gold} />
                  <text x={dir * 32} y="5" textAnchor="middle" className="t-hand" fontSize="17" fontWeight="700" fill="#FBF1DC">today</text>
                </g>
              </g>
            );
          })()}

          {/* moments */}
          {pts.map((p, i) => {
            const isToday = Math.abs(p.age - todayAge) < 0.5;
            const isFuture = p.age > todayAge + 0.4;
            const isActive = p.id === dragId || p.id === hoverId || p.id === selected;
            const hovering = p.id === dragId || p.id === hoverId;
            const L = lay[i];
            const above = L.side === "above";
            const ty = L.ty;
            // a custom emoji is always the icon; otherwise it's the normal dot,
            // and the feeling face only appears while hovering/dragging
            const glyph = p.emoji || (hovering ? satFace(p.sat) : null);
            const gsize = isActive ? 31 : 27;
            const disc = isActive ? 19 : 17;
            const markCol = isToday ? COL.gold : (isFuture ? "#A89A7C" : COL.ink);
            const leaderTop = above
              ? (glyph ? p.py - (disc + 3) : p.py - 13)
              : (glyph ? p.py + (disc + 3) : p.py + 13);
            const leaderEnd = above ? ty + (p.note ? 23 : 7) : ty - 16;
            return (
              <g key={p.id} className={"lg-flag" + (mounted ? " in" : "")} style={{ cursor: "grab", transitionDelay: (0.25 + i * 0.09) + "s" }}
                onPointerDown={(e) => startDrag(e, p.id)}
                onPointerEnter={() => setHoverId(p.id)} onPointerLeave={() => setHoverId(null)}>
                {/* leader from point to label (vertical, or angled near the edges) */}
                <line x1={p.px} y1={leaderTop} x2={L.lx} y2={leaderEnd} stroke={COL.inkSoft} strokeWidth="1" opacity="0.32" />
                {glyph ? (
                  <>
                    {/* paper halo so the emoji/face reads cleanly over the line */}
                    <circle cx={p.px} cy={p.py} r={disc} fill={COL.paper} opacity={isFuture ? 0.55 : 0.92}
                      stroke={isToday ? COL.gold : "none"} strokeWidth={isToday ? 1.6 : 0} strokeDasharray={isFuture ? "3 3" : "none"} />
                    {/* baseline-offset so the emoji's ink (not its glyph box) centers on the dot */}
                    <text x={p.px} y={p.py + gsize * 0.34} textAnchor="middle" fontSize={gsize} opacity={isFuture ? 0.7 : 1}>{glyph}</text>
                  </>
                ) : (
                  <>
                    {/* default marker dot */}
                    <circle cx={p.px} cy={p.py} r={isActive ? 9.5 : 7.5} fill={COL.paper} stroke={markCol} strokeWidth="2.8" strokeDasharray={isFuture ? "3 3" : "none"} />
                    <circle cx={p.px} cy={p.py} r="2.8" fill={markCol} />
                  </>
                )}
                {/* hit area */}
                <circle cx={p.px} cy={p.py} r="22" fill="transparent" />
                {/* label */}
                <text x={L.lx} y={ty} textAnchor={L.anchor} className="t-hand" fontSize="25" fontWeight="700" fill={isFuture ? "#8C7F63" : COL.ink} fontStyle={isFuture ? "italic" : "normal"}>{p.title}</text>
                {p.note ? <text x={L.lx} y={ty + 18} textAnchor={L.anchor} className="t-ital" fontSize="14" fill={COL.inkSoft}>{p.note}</text> : null}
              </g>
            );
          })}
        </svg>

        {/* tips revealed on hover/focus of the "?" so they don't crowd the canvas */}
        <div className="lg-help">
          <div className="lg-help-card" role="tooltip">
            <p className="lg-help-title">Tips</p>
            <ul>
              <li><b>Click</b> a moment to edit it</li>
              <li><b>Drag</b> a point ↕ to set how it felt</li>
              <li><b>Double-click</b> the graph to add a moment</li>
              <li><b>Double-click</b> a phase to rename, move, add or remove it</li>
              <li>Drag the gold <b>today</b> line to set your age</li>
              <li><b>⌘/Ctrl + Z</b> to undo</li>
            </ul>
          </div>
          <button className="lg-help-btn" aria-label="show tips">?</button>
        </div>

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
                  {EMOJI_LIB.filter((x) => !emojiQuery.trim() || x.k.includes(emojiQuery.trim().toLowerCase()) || x.e === emojiQuery.trim()).filter((x, i, arr) => arr.findIndex((y) => y.e === x.e) === i).slice(0, 60).map((x) => (
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

        {editingEra != null && eras[editingEra] && phasePop ? (
          <div className="lg-phase-pop" style={{ left: phasePop.left, top: phasePop.top }} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <button className="lg-x lg-phase-x" onClick={() => setEditingEra(null)} aria-label="close">✕</button>
            <input className="lg-in-title lg-phase-name" value={eras[editingEra].label} placeholder="Phase name"
              onChange={(e) => renamePhase(editingEra, e.target.value)} autoFocus />
            <label className="lg-lab"><span>Starts at age</span>
              <input className="lg-phase-from" type="number" min="0" max={domainMax} value={eras[editingEra].from}
                onChange={(e) => setPhaseFrom(editingEra, e.target.value)} />
            </label>
            <div className="lg-phase-actions">
              <button className="lg-phase-add" onClick={() => addPhaseAfter(editingEra)}>＋ Add phase</button>
              <button className="lg-del" onClick={() => deletePhase(editingEra)} disabled={eras.length <= 1}>Delete</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
