/* ── State ────────────────────────────────────────────────── */
const STORAGE_KEY = 'colors-of-mini-v1';
let allColors     = [];
let activeTab     = 'all';
let activeCompany = 'all';
let activeBrand   = 'all';
let searchQuery   = '';
let mineSort      = 'company'; // 'company' | 'color'
const THEME_KEY    = 'colors-of-mini-theme';
const CART_KEY     = 'colors-of-mini-cart-v1';
const LOW_KEY      = 'colors-of-mini-low-v1';
const MIXES_KEY    = 'colors-of-mini-mixes-v1';
const NOTES_KEY    = 'colors-of-mini-notes-v1';
const PRICES_KEY   = 'colors-of-mini-prices-v1';
const AVAILABLE_THEMES = ['dark', 'light'];
let allSort       = 'default'; // 'default' | 'color'
let mineFilterLow = false;
let mineFilterStale = false;
let activeTag     = 'all';
let noteModalColorId = null;
let selectMode    = false;
let selectedIds   = new Set();
let hexMatchTarget = null;

/* ── LocalStorage helpers ─────────────────────────────────── */
function getOwned() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveOwned(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}
function getCart() {
  try { return new Set(JSON.parse(localStorage.getItem(CART_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveCart(set) {
  localStorage.setItem(CART_KEY, JSON.stringify([...set]));
}
function toggleCart(id) {
  const cart = getCart();
  cart.has(id) ? cart.delete(id) : cart.add(id);
  saveCart(cart);
  return cart.has(id);
}
function getLow() {
  try { return new Set(JSON.parse(localStorage.getItem(LOW_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveLow(set) {
  localStorage.setItem(LOW_KEY, JSON.stringify([...set]));
}
function toggleLow(id) {
  const low = getLow();
  low.has(id) ? low.delete(id) : low.add(id);
  saveLow(low);
  const nowLow = low.has(id);
  if (nowLow) {
    const cart = getCart();
    if (!cart.has(id)) { cart.add(id); saveCart(cart); }
  }
  return nowLow;
}
const OPENED_KEY = 'colors-of-mini-opened-v1';
const DRY_OUT_THRESHOLD_DAYS = 540;
function getOpenedDates() {
  try { return JSON.parse(localStorage.getItem(OPENED_KEY) || '{}'); }
  catch { return {}; }
}
function saveOpenedDates(data) {
  localStorage.setItem(OPENED_KEY, JSON.stringify(data));
}
function setOpenedDate(id, dateStr) {
  const data = getOpenedDates();
  if (dateStr) data[id] = { openedDate: dateStr, snoozedUntil: null };
  else delete data[id];
  saveOpenedDates(data);
}
function snoozeFreshness(id, days = 60) {
  const data = getOpenedDates();
  if (!data[id]) return;
  const until = new Date();
  until.setDate(until.getDate() + days);
  data[id].snoozedUntil = until.toISOString().slice(0, 10);
  saveOpenedDates(data);
}
function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
function isDryingOut(id) {
  const entry = getOpenedDates()[id];
  if (!entry || !entry.openedDate) return false;
  if (entry.snoozedUntil && new Date(entry.snoozedUntil) > new Date()) return false;
  return daysSince(entry.openedDate) > DRY_OUT_THRESHOLD_DAYS;
}

function getMixes() {
  try { return JSON.parse(localStorage.getItem(MIXES_KEY) || '[]'); }
  catch { return []; }
}
function saveMixes(mixes) {
  localStorage.setItem(MIXES_KEY, JSON.stringify(mixes));
}
function getMixColors() {
  return getMixes().map(m => ({
    id: m.id, name: m.name, hex: m.hex,
    company: 'Custom Mix', brand: 'Mix',
    isMix: true, ingredients: m.ingredients,
  }));
}
function mixHex(ingredients) {
  const totalRatio = ingredients.reduce((sum, ing) => sum + ing.ratio, 0);
  if (totalRatio <= 0) return null;
  let r = 0, g = 0, b = 0;
  ingredients.forEach(ing => {
    const rgb = hexToRgb(ing.color.hex);
    const w = ing.ratio / totalRatio;
    r += rgb.r * w; g += rgb.g * w; b += rgb.b * w;
  });
  const toHex = v => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
function getNotes() {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); }
  catch { return {}; }
}
function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function getNote(id) {
  return getNotes()[id] || { note: '', tags: [] };
}
function setNote(id, data) {
  const notes = getNotes();
  const hasContent = (data.note && data.note.trim()) || (data.tags && data.tags.length);
  if (hasContent) {
    notes[id] = { note: data.note.trim(), tags: data.tags };
  } else {
    delete notes[id];
  }
  saveNotes(notes);
}
function allUsedTags() {
  const notes = getNotes();
  const tags = new Set();
  Object.values(notes).forEach(n => (n.tags || []).forEach(t => tags.add(t)));
  return [...tags].sort();
}
function getPrices() {
  try { return JSON.parse(localStorage.getItem(PRICES_KEY) || '{}'); }
  catch { return {}; }
}
function savePrices(prices) {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices));
}
function getPrice(id) {
  const p = getPrices()[id];
  return typeof p === 'number' ? p : null;
}
function setPrice(id, value) {
  const prices = getPrices();
  if (value === null || isNaN(value)) delete prices[id];
  else prices[id] = value;
  savePrices(prices);
}
/* ── Colorblind-friendly mode ─────────────────────────────── */
const A11Y_KEY = 'colors-of-mini-a11y-v1';
function getA11ySettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}');
    return { patternMode: !!saved.patternMode, simulate: saved.simulate || 'none' };
  } catch { return { patternMode: false, simulate: 'none' }; }
}
function saveA11ySettings(settings) {
  localStorage.setItem(A11Y_KEY, JSON.stringify(settings));
}

const PATTERN_BG = [
  'none',
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.4) 0 3px, transparent 3px 6px)',
  'repeating-linear-gradient(-45deg, rgba(0,0,0,0.32) 0 3px, transparent 3px 6px)',
  'repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 6px)',
  'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0 2px, transparent 2px 6px)',
  'radial-gradient(rgba(255,255,255,0.45) 22%, transparent 23%) 0 0/7px 7px',
  'radial-gradient(rgba(0,0,0,0.35) 22%, transparent 23%) 0 0/9px 9px',
];

function applyColorblindPatterns() {
  if (!document.documentElement.classList.contains('pattern-mode')) return;
  document.querySelectorAll('.color-circle, .swatch, .palette-swatch, .group-swatch').forEach(el => {
    const bg = el.style.backgroundColor;
    if (!bg) return;
    let hash = 0;
    for (let i = 0; i < bg.length; i++) hash = (hash * 31 + bg.charCodeAt(i)) >>> 0;
    el.style.setProperty('--swatch-pattern', PATTERN_BG[hash % PATTERN_BG.length]);
  });
}

let patternApplyScheduled = false;
function schedulePatternApply() {
  if (!document.documentElement.classList.contains('pattern-mode') || patternApplyScheduled) return;
  patternApplyScheduled = true;
  requestAnimationFrame(() => { patternApplyScheduled = false; applyColorblindPatterns(); });
}
new MutationObserver(schedulePatternApply).observe(document.body, { childList: true, subtree: true });

function applyA11ySettings(settings) {
  document.documentElement.classList.toggle('pattern-mode', settings.patternMode);
  document.documentElement.dataset.simulate = settings.simulate;
  const toggle = document.getElementById('a11y-pattern-toggle');
  const select = document.getElementById('a11y-simulate-select');
  if (toggle) toggle.checked = settings.patternMode;
  if (select) select.value = settings.simulate;
  if (settings.patternMode) applyColorblindPatterns();
}
function initA11y() {
  applyA11ySettings(getA11ySettings());
}

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return AVAILABLE_THEMES.includes(saved) ? saved : 'dark';
}
function applyTheme(theme) {
  const finalTheme = AVAILABLE_THEMES.includes(theme) ? theme : 'dark';
  document.documentElement.dataset.theme = finalTheme;
  localStorage.setItem(THEME_KEY, finalTheme);
  const sel = document.getElementById('theme-select');
  if (sel) sel.value = finalTheme;
}
function initTheme() {
  applyTheme(getSavedTheme());
}
function toggleOwned(id) {
  const owned = getOwned();
  owned.has(id) ? owned.delete(id) : owned.add(id);
  saveOwned(owned);
  if (!owned.has(id)) {
    const low = getLow();
    if (low.delete(id)) saveLow(low);
    setOpenedDate(id, null);
  }
  if (activeTab === 'mine') renderMine();
  if (activeTab === 'palettes') renderPalettes();
  return owned.has(id);
}

/* ── Color helpers ────────────────────────────────────────── */
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  const toHex = v => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function interpolateHexRange(hexA, hexB, count) {
  const a = hexToHsl(hexA), b = hexToHsl(hexB);
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const h = a.h + (b.h - a.h) * t;
    const s = a.s + (b.s - a.s) * t;
    const l = a.l + (b.l - a.l) * t;
    out.push(hslToHex(h, s, l));
  }
  return out;
}

function buildRampHexes(shadowHex, baseHex, highlightHex, steps) {
  steps = Math.max(3, steps);
  const half1 = Math.ceil((steps + 1) / 2);
  const half2 = steps - half1 + 1;
  const seg1 = interpolateHexRange(shadowHex, baseHex, half1);
  const seg2 = interpolateHexRange(baseHex, highlightHex, half2);
  return seg1.concat(seg2.slice(1));
}

// ~10 color families in display order
const FAMILIES = [
  { name: 'Black',  label: 'Black & Very Dark' },
  { name: 'Grey',   label: 'Grey & Neutral'    },
  { name: 'White',  label: 'White & Light'      },
  { name: 'Brown',  label: 'Brown'              },
  { name: 'Red',    label: 'Red'                },
  { name: 'Orange', label: 'Orange & Skin'      },
  { name: 'Yellow', label: 'Yellow'             },
  { name: 'Green',  label: 'Green'              },
  { name: 'Teal',   label: 'Teal & Cyan'        },
  { name: 'Blue',   label: 'Blue'               },
  { name: 'Purple', label: 'Purple'             },
  { name: 'Pink',   label: 'Pink & Magenta'     },
];
const FAMILY_ORDER = Object.fromEntries(FAMILIES.map((f, i) => [f.name, i]));
const FAMILY_LABEL = Object.fromEntries(FAMILIES.map(f => [f.name, f.label]));

const PALETTE_TEMPLATES = [
  // ── Color Theory ────────────────────────────────────────────
  {
    id: 'complementary',
    title: 'Complementary',
    description: 'Colors directly opposite on the wheel create maximum contrast — great for making key details pop at tabletop distance.',
    sample: [
      { name: 'Deep Blue',    hex: '#1A3D7C' },
      { name: 'Orange Fire',  hex: '#C85A00' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'split-complementary',
    title: 'Split Complementary',
    description: 'A base color plus the two hues flanking its complement — strong contrast with a more balanced, forgiving result than pure complementary.',
    sample: [
      { name: 'Deep Blue',     hex: '#1A3D7C' },
      { name: 'Orange Fire',   hex: '#C85A00' },
      { name: 'Sun Yellow',    hex: '#D4A400' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'analogous',
    title: 'Analogous',
    description: 'Adjacent wheel colors produce a cohesive, harmonious result — ideal for realistic shading and unified colour schemes like fire or foliage.',
    sample: [
      { name: 'Dragon Red',   hex: '#BD1313' },
      { name: 'Orange Fire',  hex: '#C85A00' },
      { name: 'Sun Yellow',   hex: '#D4A400' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'triadic',
    title: 'Triadic',
    description: 'Three evenly spaced colors for vibrant, high-energy contrast without the harshness of pure complementary.',
    sample: [
      { name: 'Purple',  hex: '#8B5CF6' },
      { name: 'Orange',  hex: '#F97316' },
      { name: 'Green',   hex: '#22C55E' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'monochromatic',
    title: 'Monochromatic',
    description: 'Shades and tints of a single base color. Clean and cohesive — great for uniforms or when you want highlights and shadows to feel natural.',
    sample: [
      { name: 'Dark Blue',  hex: '#1A3D7C' },
      { name: 'Mid Blue',   hex: '#4A89C0' },
      { name: 'Light Blue', hex: '#93C5FD' },
    ],
    category: 'Color Theory',
  },

  // ── Genre ───────────────────────────────────────────────────
  {
    id: 'high-fantasy',
    title: 'High Fantasy',
    description: 'Saturated primaries, bright purples, magentas, golds, and glowing teals for vibrant heroic characters.',
    sample: [
      { name: 'Royal Blue',   hex: '#4F46E5' },
      { name: 'Vivid Purple', hex: '#DB2777' },
      { name: 'Gold',         hex: '#F59E0B' },
      { name: 'Teal',         hex: '#14B8A6' },
    ],
    category: 'Genre',
  },
  {
    id: 'grimdark',
    title: 'Grimdark / Low Fantasy',
    description: 'Desaturated olive drabs, grimy browns, sepia tones, and rusted iron for a battle-worn aesthetic.',
    sample: [
      { name: 'Olive',        hex: '#6B7280' },
      { name: 'Brown',        hex: '#92400E' },
      { name: 'Rust',         hex: '#B45309' },
      { name: 'Dirty Green',  hex: '#4B6F44' },
    ],
    category: 'Genre',
  },
  {
    id: 'sci-fi',
    title: 'Sci-Fi / Cyberpunk',
    description: 'Dark greys and blacks paired with neon pinks, cyans, and lime greens for a futuristic tabletop look.',
    sample: [
      { name: 'Matte Black', hex: '#111827' },
      { name: 'Neon Cyan',   hex: '#06B6D4' },
      { name: 'Neon Pink',   hex: '#EC4899' },
      { name: 'Lime',        hex: '#84CC16' },
    ],
    category: 'Genre',
  },
  {
    id: 'historical-military',
    title: 'Historical Military',
    description: 'Field grey, olive drab, khaki, desert yellow, and realistic leather browns for accurate historical miniatures.',
    sample: [
      { name: 'Olive Drab',     hex: '#4B5320' },
      { name: 'Khaki',          hex: '#A78B56' },
      { name: 'Desert Yellow',  hex: '#D4B15F' },
      { name: 'Leather Brown',  hex: '#7C4A2F' },
    ],
    category: 'Genre',
  },

  // ── Character Role (Army Painter method) ───────────────────
  {
    id: 'role-leader',
    title: 'Aggressive Leader',
    description: 'Red dominates to convey aggression, authority and elite status — perfect for warlords, champion units, and faction leaders.',
    sample: [
      { name: 'Dragon Red',  hex: '#BD1313' },
      { name: 'Orange Fire', hex: '#C85A00' },
      { name: 'Greedy Gold', hex: '#C49A0A' },
      { name: 'Dark Shade',  hex: '#3A0808' },
    ],
    category: 'Character Role',
  },
  {
    id: 'role-mage',
    title: 'Arcane Mage',
    description: 'Purple signals royalty and magical power; electric blue glows suggest active spellcraft and otherworldly energy.',
    sample: [
      { name: 'Deep Purple',    hex: '#3A1155' },
      { name: 'Purple Warpaint',hex: '#6B2E8A' },
      { name: 'Electric Blue',  hex: '#2457BA' },
      { name: 'Greedy Gold',    hex: '#C49A0A' },
    ],
    category: 'Character Role',
  },
  {
    id: 'role-holy',
    title: 'Holy Champion',
    description: 'White and gold convey purity, divine blessing and good-aligned factions — classic paladin and cleric tones.',
    sample: [
      { name: 'Pure White',    hex: '#F2F2F2' },
      { name: 'Skeleton Bone', hex: '#C4B56E' },
      { name: 'Greedy Gold',   hex: '#C49A0A' },
      { name: 'Crystal Blue',  hex: '#4A89C0' },
    ],
    category: 'Character Role',
  },

  // ── Army Painter Showcase ───────────────────────────────────
  {
    id: 'ap-orc-warrior',
    title: 'Orc Warrior',
    description: 'From the Army Painter guide: complementary blue skin vs rust-orange armour creates maximum tabletop contrast on a classic orc warrior.',
    sample: [
      { name: 'Muted Blue',    hex: '#4A7BAB' },
      { name: 'Rust Orange',   hex: '#B85C1C' },
      { name: 'Dark Shadow',   hex: '#2D3A2A' },
      { name: 'Skeleton Bone', hex: '#C4B56E' },
    ],
    category: 'Army Painter',
  },
  {
    id: 'ap-verdigris-champion',
    title: 'Verdigris Champion',
    description: 'From the Army Painter guide: split-complementary turquoise skin and verdigris armour, balanced with warm gold and rust accents.',
    sample: [
      { name: 'Hydra Turquoise', hex: '#1E9B96' },
      { name: 'Verdigris',       hex: '#4A7260' },
      { name: 'Greedy Gold',     hex: '#C49A0A' },
      { name: 'Warm Rust',       hex: '#C85A00' },
    ],
    category: 'Army Painter',
  },
  {
    id: 'ap-fire-mage',
    title: 'Fire Magic',
    description: 'From the Army Painter guide: analogous reds, oranges and yellows for glowing magical fire effects — cohesive and naturally blending.',
    sample: [
      { name: 'Dragon Red',  hex: '#BD1313' },
      { name: 'Orange Fire', hex: '#C85A00' },
      { name: 'Sun Yellow',  hex: '#D4A400' },
    ],
    category: 'Army Painter',
  },
];

/* ── Paint guides per palette (paint IDs from colors.json) ── */
const PAINT_GUIDES = {
  'complementary': [
    { role: 'Blue — Base',        ids: ['citadel-base-macragge-blue',          'army-painter-sp2-beowulf-blue',        'gsw-acrylic-marine-blue'] },
    { role: 'Blue — Highlight',   ids: ['citadel-layer-hoeth-blue',             'p3-formula-p3-cygnar-blue-highlight',  'gsw-acrylic-zima-blue'] },
    { role: 'Orange — Dark',      ids: ['citadel-layer-tau-light-ochre',        'vallejo-game-color-parasite-brown',    'gsw-acrylic-foxhide-brown'] },
    { role: 'Orange — Bright',    ids: ['citadel-layer-troll-slayer-orange',    'vallejo-model-color-bright-orange',    'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink',        'p3-formula-p3-brown-ink'] },
  ],
  'split-complementary': [
    { role: 'Blue — Base',        ids: ['citadel-base-macragge-blue',           'army-painter-sp2-beowulf-blue',        'ak-quick-gen-night-blue'] },
    { role: 'Blue — Highlight',   ids: ['citadel-layer-hoeth-blue',             'p3-formula-p3-cygnar-blue-highlight',  'gsw-acrylic-zima-blue'] },
    { role: 'Orange',             ids: ['citadel-layer-troll-slayer-orange',    'vallejo-model-color-bright-orange',    'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Yellow',             ids: ['citadel-base-averland-sunset',         'army-painter-sp2-zealot-yellow',       'ak-quick-gen-solar-yellow'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink'] },
  ],
  'analogous': [
    { role: 'Red — Base',         ids: ['citadel-base-mephiston-red',           'army-painter-sp2-slaughter-red',       'gsw-acrylic-cutthroat-red'] },
    { role: 'Red — Midtone',      ids: ['citadel-layer-evil-sunz-scarlet',      'vallejo-game-color-bloody-red',        'ak-quick-gen-space-red'] },
    { role: 'Orange Transition',  ids: ['citadel-layer-troll-slayer-orange',    'vallejo-model-color-bright-orange',    'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Yellow Glow',        ids: ['citadel-base-averland-sunset',         'army-painter-sp2-zealot-yellow',       'ak-quick-gen-solar-yellow'] },
    { role: 'Shade',              ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-brown-ink'] },
  ],
  'triadic': [
    { role: 'Purple — Base',      ids: ['citadel-contrast-leviathan-purple',    'gsw-acrylic-liche-purple',             'ak-quick-gen-necromancer-purple'] },
    { role: 'Purple — Midtone',   ids: ['citadel-layer-xereus-purple',          'vallejo-model-color-royal-purple'] },
    { role: 'Orange',             ids: ['citadel-layer-troll-slayer-orange',    'vallejo-model-color-bright-orange',    'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Green',              ids: ['citadel-base-caliban-green',           'gsw-acrylic-warcry-green',             'ak-quick-gen-forest-green'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink'] },
  ],
  'monochromatic': [
    { role: 'Dark Base',          ids: ['citadel-base-macragge-blue',           'army-painter-sp2-beowulf-blue',        'p3-formula-p3-exile-blue'] },
    { role: 'Midtone',            ids: ['citadel-base-caledor-sky',             'p3-formula-p3-cygnar-blue-highlight',  'gsw-acrylic-zima-blue'] },
    { role: 'Highlight',          ids: ['citadel-layer-hoeth-blue',             'citadel-layer-calgar-blue'] },
    { role: 'Lightest Edge',      ids: ['citadel-layer-ulthuan-grey',           'citadel-base-celestra-grey'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'p3-formula-p3-blue-ink'] },
  ],
  'high-fantasy': [
    { role: 'Blue',               ids: ['citadel-base-macragge-blue',           'army-painter-sp2-beowulf-blue',        'ak-quick-gen-night-blue'] },
    { role: 'Purple',             ids: ['citadel-layer-xereus-purple',          'vallejo-model-color-royal-purple',     'gsw-acrylic-liche-purple'] },
    { role: 'Gold',               ids: ['citadel-base-retributor-armour',       'citadel-layer-auric-armour-gold',      'army-painter-sp2-sand-golem'] },
    { role: 'Teal',               ids: ['citadel-base-incubi-darkness',         'army-painter-sp2-raging-sea',          'gsw-acrylic-arachnid-green'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink',        'citadel-shade-druchii-violet'] },
  ],
  'grimdark': [
    { role: 'Armour — Dark',      ids: ['citadel-base-mechanicus-standard-grey','army-painter-sp2-gravelord-grey',      'ak-quick-gen-german-grey'] },
    { role: 'Armour — Highlight', ids: ['citadel-layer-dawnstone',              'ak-quick-gen-dirty-grey',              'gsw-acrylic-starship-grey'] },
    { role: 'Leather / Wood',     ids: ['citadel-base-dryad-bark',              'p3-formula-p3-tharn-flesh',            'ak-quick-gen-dark-flesh'] },
    { role: 'Rust',               ids: ['citadel-shade-fuegan-orange',          'gsw-acrylic-foxhide-brown',            'ak-quick-gen-orange-brown'] },
    { role: 'Cloth',              ids: ['citadel-base-castellan-green',         'p3-formula-p3-cryx-bane-base',         'ak-quick-gen-forest-green'] },
    { role: 'Shade',              ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-muddy-wash',             'p3-formula-p3-brown-ink'] },
  ],
  'sci-fi': [
    { role: 'Black Body',         ids: ['citadel-base-abaddon-black',           'army-painter-sp2-grim-black',          'vallejo-game-color-smokey-ink'] },
    { role: 'Cyan Glow',          ids: ['citadel-layer-sotek-green',            'army-painter-sp2-raging-sea',          'gsw-acrylic-viridian-green'] },
    { role: 'Pink / Magenta',     ids: ['citadel-base-screamer-pink',           'army-painter-spm-familiar-pink',       'gsw-acrylic-liche-purple'] },
    { role: 'Lime Glow',          ids: ['citadel-layer-warpstone-glow',         'army-painter-sp2-orc-skin',            'gsw-acrylic-warcry-green'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink'] },
  ],
  'historical-military': [
    { role: 'Uniform Green',      ids: ['citadel-base-castellan-green',         'p3-formula-p3-cryx-bane-base',         'ak-quick-gen-forest-green'] },
    { role: 'Webbing / Khaki',    ids: ['citadel-base-zandri-dust',             'vallejo-model-color-dark-yellow',      'vallejo-game-color-khaki'] },
    { role: 'Desert Highlight',   ids: ['citadel-layer-tau-light-ochre',        'ak-quick-gen-dirty-grey',              'citadel-base-averland-sunset'] },
    { role: 'Leather',            ids: ['citadel-base-rhinox-hide',             'p3-formula-p3-tharn-flesh',            'ak-quick-gen-dark-flesh'] },
    { role: 'Shade',              ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-muddy-wash'] },
  ],
  'role-leader': [
    { role: 'Red — Dark Base',    ids: ['citadel-base-khorne-red',              'p3-formula-p3-sanguine-base',          'ak-quick-gen-infernal-red'] },
    { role: 'Red — Midtone',      ids: ['citadel-base-mephiston-red',           'army-painter-sp2-slaughter-red',       'gsw-acrylic-cutthroat-red'] },
    { role: 'Red — Highlight',    ids: ['citadel-layer-evil-sunz-scarlet',      'vallejo-game-color-bloody-red',        'gsw-acrylic-hellfire-red'] },
    { role: 'Gold Trim',          ids: ['citadel-base-balthasar-gold',          'citadel-layer-auric-armour-gold',      'army-painter-sp2-sand-golem'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'p3-formula-p3-brown-ink',              'vallejo-game-color-smokey-ink'] },
  ],
  'role-mage': [
    { role: 'Purple — Base',      ids: ['citadel-contrast-leviathan-purple',    'gsw-acrylic-liche-purple',             'ak-quick-gen-necromancer-purple'] },
    { role: 'Purple — Midtone',   ids: ['citadel-layer-xereus-purple',          'vallejo-model-color-royal-purple'] },
    { role: 'Purple — Shade',     ids: ['citadel-shade-druchii-violet',         'p3-formula-p3-blue-ink'] },
    { role: 'Blue Glow',          ids: ['citadel-layer-altdorf-guard-blue',     'p3-formula-p3-cygnar-blue-highlight',  'gsw-acrylic-zima-blue'] },
    { role: 'Gold Accent',        ids: ['citadel-base-balthasar-gold',          'citadel-layer-auric-armour-gold'] },
  ],
  'role-holy': [
    { role: 'Armour — White',     ids: ['citadel-base-ceramite-white',          'vallejo-game-color-dead-white',        'p3-formula-p3-morrow-white'] },
    { role: 'Armour — Shade',     ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-muddy-wash'] },
    { role: 'Bone / Parchment',   ids: ['citadel-layer-ushabti-bone',           'vallejo-game-color-dead-flesh',        'p3-formula-p3-icy-yellow'] },
    { role: 'Gold',               ids: ['citadel-base-retributor-armour',       'citadel-layer-auric-armour-gold',      'army-painter-sp2-sand-golem'] },
    { role: 'Blue Trim',          ids: ['citadel-base-caledor-sky',             'army-painter-sp2-beowulf-blue',        'p3-formula-p3-exile-blue'] },
  ],
  'ap-orc-warrior': [
    { role: 'Skin — Base',        ids: ['citadel-base-caledor-sky',             'army-painter-sp2-beowulf-blue',        'p3-formula-p3-exile-blue'] },
    { role: 'Skin — Highlight',   ids: ['citadel-layer-hoeth-blue',             'p3-formula-p3-cygnar-blue-highlight',  'gsw-acrylic-zima-blue'] },
    { role: 'Armour — Base',      ids: ['citadel-layer-tau-light-ochre',        'vallejo-game-color-parasite-brown',    'gsw-acrylic-foxhide-brown'] },
    { role: 'Armour — Rust',      ids: ['citadel-shade-fuegan-orange',          'army-painter-sp2-nuclear-sunrise',     'ak-quick-gen-reddish-orange'] },
    { role: 'Bone Details',       ids: ['citadel-layer-ushabti-bone',           'vallejo-game-color-dead-flesh',        'gsw-acrylic-zombie-flesh'] },
    { role: 'Shade',              ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-muddy-wash',             'p3-formula-p3-brown-ink'] },
  ],
  'ap-verdigris-champion': [
    { role: 'Skin — Base',        ids: ['citadel-base-incubi-darkness',         'vallejo-game-color-scurvy-green',      'gsw-acrylic-arachnid-green'] },
    { role: 'Skin — Highlight',   ids: ['citadel-layer-sotek-green',            'army-painter-sp2-raging-sea',          'gsw-acrylic-viridian-green'] },
    { role: 'Armour — Metal',     ids: ['citadel-base-warplock-bronze',         'citadel-base-balthasar-gold'] },
    { role: 'Verdigris Effect',   ids: ['vallejo-game-color-verdigris',         'p3-formula-p3-turquoise-ink',          'citadel-layer-temple-guard-blue'] },
    { role: 'Rust Accent',        ids: ['citadel-shade-fuegan-orange',          'ak-quick-gen-orange-brown',            'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Shade',              ids: ['citadel-shade-nuln-oil',               'vallejo-game-color-smokey-ink'] },
  ],
  'ap-fire-mage': [
    { role: 'Dark Base',          ids: ['citadel-base-mephiston-red',           'army-painter-sp2-slaughter-red',       'gsw-acrylic-cutthroat-red'] },
    { role: 'Red — Midtone',      ids: ['citadel-layer-evil-sunz-scarlet',      'vallejo-game-color-bloody-red',        'ak-quick-gen-space-red'] },
    { role: 'Orange Transition',  ids: ['citadel-layer-troll-slayer-orange',    'vallejo-model-color-bright-orange',    'army-painter-sp2-nuclear-sunrise'] },
    { role: 'Yellow Glow Tip',    ids: ['citadel-base-averland-sunset',         'army-painter-sp2-zealot-yellow',       'ak-quick-gen-solar-yellow'] },
    { role: 'Shade',              ids: ['citadel-shade-agrax-earthshade',       'p3-formula-p3-brown-ink'] },
  ],
};

/* ── Learn: paint-type glossary ──────────────────────────── */
const PAINT_TYPE_GLOSSARY = [
  { range: 'Base', companies: ['Citadel'], description: 'Thick, flat-opaque paint made to cover bare plastic/resin in one or two coats.', whenToUse: 'Always your first coat of color, before any highlighting or shading.' },
  { range: 'Layer', companies: ['Citadel'], description: 'Thinner and more translucent than Base paint, built for building up highlights.', whenToUse: 'Painted over a Base coat to add lighter tones and definition.' },
  { range: 'Shade', companies: ['Citadel'], description: 'A thin, ink-like wash that flows into recesses and adds depth automatically.', whenToUse: 'Applied over a base coat to shade crevices in one step — the single biggest "make it look good fast" tool.' },
  { range: 'Dry', companies: ['Citadel'], description: 'Thick, chalky paint made for drybrushing — catches only raised edges and texture.', whenToUse: 'Great for fur, rubble, fabric texture, or a fast highlight over a shaded model.' },
  { range: 'Edge', companies: ['Citadel'], description: 'Opaque paint formulated to go on cleanly in a thin line along raised edges.', whenToUse: 'For crisp edge highlights on armor plates and blades.' },
  { range: 'Glaze', companies: ['Citadel'], description: 'Very translucent paint that tints the color underneath rather than covering it.', whenToUse: 'Subtle color blending/toning over a finished area — an intermediate technique.' },
  { range: 'Technical', companies: ['Citadel'], description: 'Special-effect paints — texture, rust, cracked earth, snow, blood and similar.', whenToUse: 'Basing and effects, usually applied last.' },
  { range: 'Contrast', companies: ['Citadel'], description: 'One-coat paint that self-shades as it dries, combining a base color and a wash.', whenToUse: 'Fast painting: apply over a white or grey primer for a finished look in one coat.' },
  { range: 'Game Color', companies: ['Vallejo'], description: "Vallejo's general-purpose wargaming range, roughly equivalent to Citadel Base/Layer.", whenToUse: 'General base coating and layering for tabletop miniatures.' },
  { range: 'Model Color', companies: ['Vallejo'], description: 'Artist-grade acrylic aimed at scale modelers, with a huge, precise color range.', whenToUse: 'Fine detail work and historical/scale-model painting.' },
  { range: 'True Metallic Metal', companies: ['Vallejo'], description: 'A metallic system with matched light/base/shade/airbrush tones per metal color.', whenToUse: 'Realistic non-painted metal (NMM alternative) — layering the light/base/shade set together.' },
  { range: 'Speedpaint 2.0', companies: ['Army Painter'], description: "Army Painter's one-coat contrast-style paint — similar role to Citadel Contrast.", whenToUse: 'Fast painting over a light-colored primer, one coat to a finished result.' },
  { range: 'Speedpaint Markers', companies: ['Army Painter'], description: 'Speedpaint formula in a felt-tip marker for very fast, mess-free application.', whenToUse: 'Same as Speedpaint 2.0, when speed matters more than fine control.' },
  { range: 'Formula P3', companies: ['P3 Paints'], description: "Privateer Press's studio paint system, covering base and layer duties in one range.", whenToUse: 'General base coating and highlighting, similar workflow to Citadel Base+Layer.' },
  { range: 'Acrylic', companies: ['Greenstuff World'], description: 'General-purpose hobby acrylic range covering a wide, saturated color spread.', whenToUse: 'Base coating, layering, and effects — check the individual paint\'s finish/opacity.' },
  { range: 'Quick Gen', companies: ['AK Interactive'], description: 'A fast one-coat acrylic range in the same spirit as Contrast/Speedpaint.', whenToUse: 'Speed painting over primer for a finished result in a single coat.' },
];

function renderPaintTypeGlossary() {
  const el = document.getElementById('paint-type-glossary');
  el.innerHTML = PAINT_TYPE_GLOSSARY.map(g => `
    <div class="learn-card">
      <h3>${g.range} <span class="learn-difficulty beginner" style="margin-left:auto">${g.companies.join(', ')}</span></h3>
      <p>${g.description}</p>
      <p class="when-to-use"><strong>When to use it:</strong> ${g.whenToUse}</p>
    </div>
  `).join('');
}

/* ── Learn: technique glossary ───────────────────────────── */
const TECHNIQUE_GLOSSARY = [
  { name: 'Base Coating', difficulty: 'beginner', matchTags: ['base', 'basecoat', 'base coat'], description: 'Applying a solid, even first coat of color over bare primer.', whenToUse: 'The very first painting step on every model.' },
  { name: 'Washing / Shading', difficulty: 'beginner', matchTags: ['wash', 'shade'], description: 'Flowing a thin, dark ink into recesses so shadows appear automatically.', whenToUse: 'Right after your base coat, to add instant depth.' },
  { name: 'Drybrushing', difficulty: 'beginner', matchTags: ['drybrush'], description: 'Wiping almost all paint off a brush, then lightly stroking it over a model so only raised details pick up color.', whenToUse: 'Fast highlights on texture — fur, rubble, chainmail, rock.' },
  { name: 'Layering', difficulty: 'intermediate', matchTags: ['layer', 'layering'], description: 'Building up progressively lighter thin coats to create smooth highlights.', whenToUse: 'The classic way to highlight armor, cloth, and skin with defined edges.' },
  { name: 'Glazing', difficulty: 'intermediate', matchTags: ['glaze'], description: 'Applying very thin, translucent coats to subtly shift or blend a color.', whenToUse: 'Smoothing harsh transitions or tinting an area without hiding what\'s beneath.' },
  { name: 'Edge Highlighting', difficulty: 'intermediate', matchTags: ['edge highlight', 'edge-highlight', 'edge'], description: 'A thin highlight line painted precisely along a raised edge or panel line.', whenToUse: 'Armor plates, blades, and mechanical edges for a crisp, "lit from above" look.' },
  { name: 'Wet Blending', difficulty: 'advanced', matchTags: ['wet-blend', 'wet blend', 'wetblend'], description: 'Blending two or more wet paints directly on the model so they merge with no hard edge.', whenToUse: 'Smooth gradients on skin, cloth, or fantasy effects where no edge should show.' },
  { name: 'Zenithal Priming', difficulty: 'intermediate', matchTags: ['zenithal'], description: 'Priming dark from below and spraying light from directly above, so the model has built-in shading before any paint goes on.', whenToUse: 'Before base coating — especially efficient when using Contrast/Speedpaint-style paints.' },
  { name: 'NMM (Non-Metallic Metal)', difficulty: 'advanced', matchTags: ['nmm'], description: 'Painting metal using ordinary colors (blacks, whites, and a hue) instead of metallic paint, to fake sharp reflections.', whenToUse: 'Display-quality armor or weapons when a painted, stylized metal look is wanted.' },
  { name: 'OSL (Object Source Lighting)', difficulty: 'advanced', matchTags: ['osl'], description: 'Painting a glow that realistically lights up the nearby model surface, as if a light source (a blade, a gem, fire) were really there.', whenToUse: 'Magic weapons, power sources, fire, and other in-universe light effects.' },
];

function renderTechniqueGlossary() {
  const el = document.getElementById('technique-glossary');
  const notes = getNotes();
  el.innerHTML = TECHNIQUE_GLOSSARY.map(t => {
    const linked = allColors.filter(c => {
      const tags = (notes[c.id]?.tags || []).map(tag => tag.toLowerCase());
      return t.matchTags.some(mt => tags.includes(mt));
    });
    const linkedHtml = linked.length
      ? `<div class="learn-linked">
           <div class="learn-linked-label">Your tagged paints (${linked.length})</div>
           <div class="color-tags">${linked.map(c => `<span class="suggestion-chip"><span class="swatch" style="background:${c.hex}"></span>${c.name}</span>`).join('')}</div>
         </div>`
      : '';
    return `
      <div class="learn-card">
        <h3>${t.name} <span class="learn-difficulty ${t.difficulty}">${t.difficulty}</span></h3>
        <p>${t.description}</p>
        <p class="when-to-use"><strong>When to use it:</strong> ${t.whenToUse}</p>
        ${linkedHtml}
      </div>
    `;
  }).join('');
}

/* ── Learn: starter kit ──────────────────────────────────── */
const STARTER_KIT = [
  { role: 'Black Base', ids: { 'Citadel': 'citadel-base-abaddon-black', 'Vallejo': 'vallejo-model-color-black', 'Army Painter': 'army-painter-sp2-grim-black' } },
  { role: 'White Base', ids: { 'Citadel': 'citadel-base-ceramite-white', 'Vallejo': 'vallejo-model-color-white', 'Army Painter': 'army-painter-sp2-holy-white' } },
  { role: 'All-Purpose Shade / Wash', ids: { 'Citadel': 'citadel-shade-nuln-oil', 'Vallejo': 'vallejo-game-color-smokey-ink' } },
  { role: 'Red', ids: { 'Citadel': 'citadel-base-khorne-red', 'Vallejo': 'vallejo-game-color-scarlet-red', 'Army Painter': 'army-painter-sp2-blood-red' } },
  { role: 'Blue', ids: { 'Citadel': 'citadel-base-macragge-blue', 'Vallejo': 'vallejo-game-color-ultramarine-blue', 'Army Painter': 'army-painter-sp2-beowulf-blue' } },
  { role: 'Yellow', ids: { 'Citadel': 'citadel-base-averland-sunset', 'Vallejo': 'vallejo-game-color-sun-yellow', 'Army Painter': 'army-painter-sp2-zealot-yellow' } },
  { role: 'Metallic Gold', ids: { 'Citadel': 'citadel-base-balthasar-gold', 'Vallejo': 'vallejo-true-metallic-metal-imperial-gold-base', 'Army Painter': 'army-painter-sp2-aztec-gold' } },
  { role: 'Skin Tone', ids: { 'Citadel': 'citadel-layer-cadian-fleshtone', 'Vallejo': 'vallejo-game-color-pale-flesh', 'Army Painter': 'army-painter-sp2-peachy-flesh' } },
];
const STARTER_KIT_COMPANIES = ['Citadel', 'Vallejo', 'Army Painter'];
let starterKitCompany = 'Citadel';

function renderStarterKitPills() {
  const el = document.getElementById('starter-company-pills');
  el.innerHTML = STARTER_KIT_COMPANIES.map(co =>
    `<button class="sort-pill${co === starterKitCompany ? ' active' : ''}" data-co="${co}">${co}</button>`
  ).join('');
  el.querySelectorAll('.sort-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      starterKitCompany = btn.dataset.co;
      renderStarterKitPills();
      renderStarterKit();
    });
  });
}

function starterKitColors() {
  return STARTER_KIT
    .map(entry => ({ role: entry.role, color: allColors.find(c => c.id === entry.ids[starterKitCompany]) }))
    .filter(entry => entry.color);
}

function renderStarterKit() {
  const el = document.getElementById('starter-kit-list');
  const entries = starterKitColors();
  const owned = getOwned();
  el.innerHTML = entries.map(({ role, color }) => `
    <div class="starter-role">
      <div class="starter-role-label">${role}</div>
      <div class="guide-chips">
        <span class="guide-chip${owned.has(color.id) ? ' guide-chip-owned' : ''}" title="${color.company} · ${color.brand}">
          <span class="swatch" style="background:${color.hex}"></span>
          <span class="guide-paint-name">${color.name}</span>
          <span class="guide-paint-meta">${color.company} · ${color.brand}</span>
          ${owned.has(color.id) ? '<span class="guide-owned-badge">✓ Owned</span>' : ''}
        </span>
      </div>
    </div>
  `).join('');
}

document.getElementById('btn-starter-add-all').addEventListener('click', () => {
  const entries = starterKitColors();
  if (!entries.length) { showToast('No starter kit paints found for this company.', true); return; }
  const cart = getCart();
  entries.forEach(({ color }) => cart.add(color.id));
  saveCart(cart);
  updateBadges();
  if (activeTab === 'shopping') renderShoppingList();
  showToast(`Added ${entries.length} starter paints to your shopping list.`);
});

function renderLearn() {
  renderPaintTypeGlossary();
  renderTechniqueGlossary();
  renderStarterKitPills();
  renderStarterKit();
}

/* ── Collection stats dashboard ──────────────────────────── */
function computeStats() {
  const owned = getOwned();
  const ownedColors = allColors.filter(c => owned.has(c.id));
  const mixCount = getMixes().length;

  const byBrand = {};
  ownedColors.forEach(c => {
    const key = `${c.company} · ${c.brand}`;
    byBrand[key] = (byBrand[key] || 0) + 1;
  });

  const byFamily = {};
  ownedColors.forEach(c => {
    const f = getColorFamily(c.hex);
    byFamily[f] = (byFamily[f] || 0) + 1;
  });

  const totalInCatalog = allColors.length;
  const completionPct = totalInCatalog ? Math.round((ownedColors.length / totalInCatalog) * 100) : 0;

  let totalValue = 0, pricedCount = 0;
  ownedColors.forEach(c => {
    const p = getPrice(c.id);
    if (p !== null) { totalValue += p; pricedCount++; }
  });

  const tagCounts = {};
  Object.values(getNotes()).forEach(n => (n.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 8);

  return {
    ownedCount: ownedColors.length,
    mixCount,
    totalInCatalog,
    completionPct,
    byBrand: Object.entries(byBrand).sort(([, a], [, b]) => b - a),
    byFamily: FAMILIES.map(f => [f.label, byFamily[f.name] || 0]).filter(([, n]) => n > 0),
    totalValue,
    pricedCount,
    hasPriceData: pricedCount > 0,
    topTags,
  };
}

function buildStatBar(label, count, max) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const row = document.createElement('div');
  row.className = 'stat-bar-row';
  row.innerHTML = `
    <span class="stat-bar-label" title="${label}">${label}</span>
    <span class="stat-bar-track"><span class="stat-bar-fill" style="width:${pct}%"></span></span>
    <span class="stat-bar-count">${count}</span>
  `;
  return row;
}

function renderStats() {
  const stats = computeStats();
  const tilesEl = document.getElementById('stats-tiles');
  const tiles = [
    { label: 'Owned Colors', value: stats.ownedCount },
    { label: 'Custom Mixes', value: stats.mixCount },
    { label: 'Collection Completion', value: `${stats.completionPct}%`, sub: `${stats.ownedCount} of ${stats.totalInCatalog}` },
  ];
  if (stats.hasPriceData) {
    tiles.push({ label: 'Estimated Value', value: `$${stats.totalValue.toFixed(2)}`, sub: `${stats.pricedCount} priced` });
  }
  tilesEl.innerHTML = tiles.map(t => `
    <div class="stat-tile">
      <div class="stat-tile-value">${t.value}</div>
      <div class="stat-tile-label">${t.label}</div>
      ${t.sub ? `<div class="stat-tile-sub">${t.sub}</div>` : ''}
    </div>
  `).join('');

  const brandEl = document.getElementById('stats-brand-breakdown');
  brandEl.innerHTML = '';
  if (stats.byBrand.length === 0) {
    brandEl.innerHTML = '<p class="empty-msg-small">No owned colors yet.</p>';
  } else {
    const max = Math.max(...stats.byBrand.map(([, n]) => n));
    stats.byBrand.forEach(([label, count]) => brandEl.appendChild(buildStatBar(label, count, max)));
  }

  const familyEl = document.getElementById('stats-family-breakdown');
  familyEl.innerHTML = '';
  if (stats.byFamily.length === 0) {
    familyEl.innerHTML = '<p class="empty-msg-small">No owned colors yet.</p>';
  } else {
    const max = Math.max(...stats.byFamily.map(([, n]) => n));
    stats.byFamily.forEach(([label, count]) => familyEl.appendChild(buildStatBar(label, count, max)));
  }

  const tagsPanel = document.getElementById('stats-tags-panel');
  const tagsEl = document.getElementById('stats-top-tags');
  if (stats.topTags.length === 0) {
    tagsPanel.hidden = true;
  } else {
    tagsPanel.hidden = false;
    tagsEl.innerHTML = stats.topTags.map(([tag, count]) =>
      `<span class="suggestion-chip">${tag} <strong>${count}</strong></span>`
    ).join('');
  }
}

function getColorFamily(hex) {
  const { h, s, l } = hexToHsl(hex);
  // Lightness extremes — require low saturation for Black so very dark green/blue stay colored
  if (l < 15 && s < 30)   return 'Black';
  if (l > 88 && s < 30)   return 'White';
  // Very desaturated or dark+desaturated → neutral territory
  if (s < 12)              return 'Grey';
  if (l < 30 && s < 22)   return 'Grey';    // dark neutrals like Rhinox Hide
  // Hue-based — red/dark-red vs brown
  if (h >= 345 || h < 15) return l < 32 ? 'Brown' : 'Red';
  // Orange/brown hue range
  if (h >= 15 && h < 50)  return (l < 44 || s < 42) ? 'Brown' : 'Orange';
  // Yellow — dark/muted yellows read as brown (Agrax Earthshade, olive washes)
  if (h >= 50 && h < 70)  return (l < 44 || s < 28) ? 'Brown' : 'Yellow';
  if (h >= 70 && h < 150) return 'Green';
  if (h >= 150 && h < 200) return 'Teal';
  if (h >= 200 && h < 255) return 'Blue';
  if (h >= 255 && h < 315) return 'Purple';
  return 'Pink';  // 315–345
}

// Sort key for within-family ordering: hue, then lightness light→dark
function colorSortKey(color) {
  const { h, l } = hexToHsl(color.hex);
  return h * 1000 + l;
}

/* ── DOM refs ─────────────────────────────────────────────── */
const listAll            = document.getElementById('list-all');
const listMine           = document.getElementById('list-mine');
const listShopping       = document.getElementById('list-shopping');
const paletteList        = document.getElementById('palette-list');
const paletteAnalysis    = document.getElementById('palette-analysis');
const missingList        = document.getElementById('missing-list');
const emptySearch        = document.getElementById('empty-search');
const emptyMine          = document.getElementById('empty-mine');
const emptyShopping      = document.getElementById('empty-shopping');
const mineToolbar        = document.getElementById('mine-toolbar');
const countAll           = document.getElementById('count-all');
const countMine          = document.getElementById('count-mine');
const countPalettes      = document.getElementById('count-palettes');
const countCart          = document.getElementById('count-cart');
const resultCount        = document.getElementById('result-count');
const shoppingCountLabel = document.getElementById('shopping-count-label');
const toolbarAll         = document.getElementById('toolbar-all');
const searchInput        = document.getElementById('search');
const themeSelect        = document.getElementById('theme-select');
const noteModalHarmony   = document.getElementById('note-modal-harmony');
const harmonyComplementary = document.getElementById('harmony-complementary');
const harmonyAnalogous   = document.getElementById('harmony-analogous');
const harmonyTriadic     = document.getElementById('harmony-triadic');

const filterToggleBtn = document.getElementById('btn-toggle-filters');
const filterPanel     = document.getElementById('filter-panel');
if (filterToggleBtn && filterPanel) {
  filterToggleBtn.addEventListener('click', () => {
    const isOpen = filterPanel.classList.toggle('open');
    filterToggleBtn.classList.toggle('active', isOpen);
    filterToggleBtn.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ── Card builder ─────────────────────────────────────────── */
const CART_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;
const LOW_SVG  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

function buildCard(color, owned, opts = {}) {
  const isMix     = !!color.isMix;
  const isOwned   = isMix || owned.has(color.id);
  const inCart    = getCart().has(color.id);
  const isLow     = !isMix && getLow().has(color.id);
  const isStale   = !isMix && isOwned && isDryingOut(color.id);
  const coSlug    = color.company.replace(' ', '-');
  const card      = document.createElement('div');
  const isSelected = selectedIds.has(color.id);
  card.className  = `color-card${isOwned ? ' owned' : ''}${isLow ? ' low-stock' : ''}${isStale ? ' stale' : ''}${isMix ? ' is-mix' : ''}${isSelected ? ' selected' : ''}`;
  card.dataset.id = color.id;

  const substitute = !isOwned ? suggestSubstitute(color) : null;
  const substituteHtml = substitute
    ? `<div class="color-substitute" title="Closest color you already own">
         <span class="swatch" style="background:${substitute.hex}"></span>
         Have: ${substitute.name}
       </div>`
    : '';

  const noteData = getNote(color.id);
  const hasNote  = !!(noteData.note || (noteData.tags && noteData.tags.length));
  const tagsHtml = noteData.tags && noteData.tags.length
    ? `<div class="color-tags">${noteData.tags.map(t => `<span class="color-tag-chip">${t}</span>`).join('')}</div>`
    : '';

  const price = getPrice(color.id);
  const priceHtml = opts.showPrice
    ? `<div class="color-price"><span>$</span><input type="number" class="price-input" min="0" step="0.01" placeholder="0.00" value="${price !== null ? price : ''}"></div>`
    : '';

  const matchHtml = hexMatchTarget
    ? `<div class="color-match">${Math.max(0, Math.round(100 - (colorDistance(color.hex, hexMatchTarget) / 441.7) * 100))}% match to ${hexMatchTarget}</div>`
    : '';

  const openedEntry = getOpenedDates()[color.id];
  const freshnessHtml = opts.showFreshness && isOwned && !isMix
    ? `<div class="color-freshness${isStale ? ' is-stale' : ''}">
         ${isStale ? '<span class="freshness-warning">⏳ May be drying out</span>' : ''}
         <label>Opened <input type="date" class="opened-date-input" value="${openedEntry?.openedDate || ''}"></label>
         ${isStale ? '<button type="button" class="freshness-snooze-btn">Snooze</button>' : ''}
       </div>`
    : '';

  card.innerHTML = `
    <div class="color-circle${hasNote ? ' has-note' : ''}" style="background-color:${color.hex}" title="Click to add a note or tags"></div>
    <div class="color-info">
      <div class="color-meta">
        <span class="badge badge-co ${coSlug}">${isMix ? '🧪 Mix' : color.company}</span>
        <span class="badge badge-brand">${color.brand}</span>
      </div>
      <div class="color-name" title="${color.name}">${color.name}</div>
      ${substituteHtml}
      ${tagsHtml}
      ${priceHtml}
      ${matchHtml}
      ${freshnessHtml}
    </div>
    <button class="cart-btn${inCart ? ' in-cart' : ''}"
            aria-label="${inCart ? 'Remove from shopping list' : 'Add to shopping list'}">
      ${CART_SVG}
    </button>
    <button class="low-btn${isLow ? ' is-low' : ''}"${isOwned && !isMix ? '' : ' disabled'}
            aria-label="${isLow ? 'Mark as fully stocked' : 'Mark as low stock'}">
      ${LOW_SVG}
    </button>
    <button class="toggle-btn${isOwned ? ' owned' : ''}"
            aria-label="${isMix ? 'Delete mix' : (isOwned ? 'Remove from collection' : 'Add to collection')}">
      ${isMix ? '🗑' : (isOwned ? '✓' : '+')}
    </button>
  `;

  card.querySelector('.color-circle').addEventListener('click', () => {
    if (selectMode) return;
    openNoteModal(color);
  });

  card.addEventListener('click', e => {
    if (!selectMode || e.target.closest('button')) return;
    toggleCardSelection(color.id, card);
  });

  if (opts.showPrice) {
    card.querySelector('.price-input').addEventListener('input', e => {
      const val = e.target.value === '' ? null : parseFloat(e.target.value);
      setPrice(color.id, val);
      updateShoppingTotal();
    });
  }

  if (opts.showFreshness && isOwned && !isMix) {
    card.querySelector('.opened-date-input').addEventListener('change', e => {
      setOpenedDate(color.id, e.target.value || null);
      renderMine();
    });
    card.querySelector('.freshness-snooze-btn')?.addEventListener('click', () => {
      snoozeFreshness(color.id);
      renderMine();
    });
  }

  card.querySelector('.cart-btn').addEventListener('click', () => {
    const nowInCart = toggleCart(color.id);
    const btn = card.querySelector('.cart-btn');
    btn.classList.toggle('in-cart', nowInCart);
    btn.setAttribute('aria-label', nowInCart ? 'Remove from shopping list' : 'Add to shopping list');
    updateBadges();

    if (activeTab === 'shopping' && !nowInCart) {
      const grid = card.parentElement;
      card.remove();
      if (grid && grid.classList.contains('color-list') && grid.children.length === 0) {
        grid.previousElementSibling?.remove();
        grid.remove();
      }
      toggleShoppingEmpty();
    }
  });

  card.querySelector('.low-btn').addEventListener('click', () => {
    const nowLow = toggleLow(color.id);
    card.classList.toggle('low-stock', nowLow);
    const btn = card.querySelector('.low-btn');
    btn.classList.toggle('is-low', nowLow);
    btn.setAttribute('aria-label', nowLow ? 'Mark as fully stocked' : 'Mark as low stock');

    const cartBtn   = card.querySelector('.cart-btn');
    const inCartNow = getCart().has(color.id);
    cartBtn.classList.toggle('in-cart', inCartNow);
    cartBtn.setAttribute('aria-label', inCartNow ? 'Remove from shopping list' : 'Add to shopping list');
    updateBadges();

    if (activeTab === 'mine' && mineFilterLow && !nowLow) {
      const grid = card.parentElement;
      card.remove();
      if (grid && grid.classList.contains('color-list') && grid.children.length === 0) {
        grid.previousElementSibling?.remove();
        grid.remove();
      }
      toggleMineEmpty();
    }
  });

  card.querySelector('.toggle-btn').addEventListener('click', () => {
    if (isMix) {
      const mixSnapshot  = getMixes().find(m => m.id === color.id);
      const wasInCart    = getCart().has(color.id);
      deleteMix(color.id);
      updateBadges();
      if (activeTab === 'mine') renderMine();
      showToast(`Mix "${color.name}" deleted.`, {
        actionLabel: 'Undo',
        onAction: () => {
          if (!mixSnapshot) return;
          const mixes = getMixes();
          mixes.push(mixSnapshot);
          saveMixes(mixes);
          if (wasInCart) { const cart = getCart(); cart.add(color.id); saveCart(cart); }
          updateBadges();
          if (activeTab === 'mine') renderMine();
        },
      });
      return;
    }

    const nowOwned = toggleOwned(color.id);
    card.classList.toggle('owned', nowOwned);
    const btn = card.querySelector('.toggle-btn');
    btn.classList.toggle('owned', nowOwned);
    btn.textContent = nowOwned ? '✓' : '+';
    btn.setAttribute('aria-label', nowOwned ? 'Remove from collection' : 'Add to collection');

    const lowBtn = card.querySelector('.low-btn');
    lowBtn.disabled = !nowOwned;
    if (!nowOwned) {
      card.classList.remove('low-stock');
      lowBtn.classList.remove('is-low');
      lowBtn.setAttribute('aria-label', 'Mark as low stock');
    }
    updateBadges();

    if (activeTab === 'mine' && !nowOwned) {
      const grid = card.parentElement;
      card.remove();
      if (grid && grid.classList.contains('color-list') && grid.children.length === 0) {
        grid.previousElementSibling?.remove();
        grid.remove();
      }
      toggleMineEmpty();
    }
  });

  return card;
}

function deleteMix(id) {
  saveMixes(getMixes().filter(m => m.id !== id));
  const cart = getCart();
  if (cart.delete(id)) saveCart(cart);
}

/* ── Group header builder ─────────────────────────────────── */
function buildGroupHeader(label, swatch, count) {
  const h = document.createElement('div');
  h.className = 'group-header';
  h.innerHTML = `
    <span class="group-swatch" style="background:${swatch}"></span>
    <span class="group-label">${label}</span>
    <span class="group-count">${count}</span>
  `;
  return h;
}

/* ── Brand pills ──────────────────────────────────────────── */
function buildBrandPills(company) {
  const brandRow   = document.getElementById('brand-row');
  const brandPills = document.getElementById('brand-pills');
  activeBrand = 'all';

  if (company === 'all') {
    brandRow.hidden = true;
    return;
  }

  const brands = [...new Set(
    allColors.filter(c => c.company === company).map(c => c.brand)
  )];

  brandPills.innerHTML = '';
  ['all', ...brands].forEach(brand => {
    const btn = document.createElement('button');
    btn.className = `pill${brand === 'all' ? ' active' : ''}`;
    btn.dataset.brand = brand;
    btn.textContent = brand === 'all' ? 'All' : brand;
    btn.addEventListener('click', () => {
      brandPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      activeBrand = brand;
      renderAll();
    });
    brandPills.appendChild(btn);
  });

  brandRow.hidden = false;
}

/* ── Render All Colors ────────────────────────────────────── */
function filteredColors() {
  const q = searchQuery.toLowerCase();
  return allColors.filter(c => {
    if (activeCompany !== 'all' && c.company !== activeCompany) return false;
    if (activeBrand   !== 'all' && c.brand   !== activeBrand)   return false;
    if (activeTag     !== 'all' && !(getNote(c.id).tags || []).includes(activeTag)) return false;
    if (q && !hexMatchTarget) {
      const hit = c.name.toLowerCase().includes(q)
               || c.brand.toLowerCase().includes(q)
               || c.company.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  });
}

function renderAll() {
  const owned  = getOwned();
  let colors   = filteredColors();
  listAll.innerHTML = '';
  emptySearch.hidden = colors.length > 0;
  resultCount.textContent = colors.length < allColors.length
    ? `${colors.length} of ${allColors.length} colors` : '';

  if (hexMatchTarget) {
    colors = [...colors].sort((a, b) => colorDistance(a.hex, hexMatchTarget) - colorDistance(b.hex, hexMatchTarget));
    const grid = document.createElement('div');
    grid.className = 'color-list';
    colors.forEach(c => grid.appendChild(buildCard(c, owned)));
    listAll.appendChild(grid);
    return;
  }

  if (allSort === 'color') {
    renderAllByColor(colors, owned);
  } else {
    const grid = document.createElement('div');
    grid.className = 'color-list';
    colors.forEach(c => grid.appendChild(buildCard(c, owned)));
    listAll.appendChild(grid);
  }
}

function renderAllByColor(colors, owned) {
  const groups = {};
  colors.forEach(c => {
    const f = getColorFamily(c.hex);
    if (!groups[f]) groups[f] = [];
    groups[f].push(c);
  });
  Object.values(groups).forEach(arr => arr.sort((a, b) => colorSortKey(a) - colorSortKey(b)));

  const frag = document.createDocumentFragment();
  FAMILIES.forEach(({ name, label }) => {
    const arr = groups[name];
    if (!arr || arr.length === 0) return;
    const swatch = arr[Math.floor(arr.length / 2)].hex;
    frag.appendChild(buildGroupHeader(label, swatch, arr.length));
    const grid = document.createElement('div');
    grid.className = 'color-list';
    arr.forEach(c => grid.appendChild(buildCard(c, owned)));
    frag.appendChild(grid);
  });
  listAll.appendChild(frag);
}

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function colorDistance(aHex, bHex) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function findNearestColor(hex, colorList) {
  let best = null;
  let minDist = Infinity;
  colorList.forEach(color => {
    const dist = colorDistance(hex, color.hex);
    if (dist < minDist) {
      minDist = dist;
      best = color;
    }
  });
  return { color: best, distance: minDist };
}

function parseColorInput(str) {
  const s = str.trim();
  let m = s.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  m = s.match(/^#?([0-9a-f]{6})$/i);
  if (m) return `#${m[1].toUpperCase()}`;
  m = s.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (m) {
    const toHex = v => Math.min(255, parseInt(v, 10)).toString(16).padStart(2, '0');
    return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`.toUpperCase();
  }
  return null;
}

function findNearestOwnedColor(hex) {
  const ownedIds = getOwned();
  const ownedColors = allColors.filter(c => ownedIds.has(c.id)).concat(getMixColors());
  return ownedColors.length ? findNearestColor(hex, ownedColors) : null;
}

/* ── Substitution suggestions ─────────────────────────────── */
const SUBSTITUTE_THRESHOLD = 80;
function suggestSubstitute(color) {
  const match = findNearestOwnedColor(color.hex);
  if (!match || !match.color || match.color.id === color.id) return null;
  if (match.distance >= SUBSTITUTE_THRESHOLD) return null;
  return match.color;
}

function renderPalettes() {
  paletteList.innerHTML = '';
  const byCategory = {};
  PALETTE_TEMPLATES.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });
  Object.entries(byCategory).forEach(([cat, palettes]) => {
    const heading = document.createElement('h3');
    heading.className = 'palette-category-heading';
    heading.textContent = cat;
    paletteList.appendChild(heading);
    const grid = document.createElement('div');
    grid.className = 'palette-grid-inner';
    palettes.forEach(p => grid.appendChild(buildPaletteCard(p)));
    paletteList.appendChild(grid);
  });
  renderPaletteAnalysis();
}

function buildPaletteCard(palette) {
  const card = document.createElement('div');
  card.className = 'palette-card';

  const guide = PAINT_GUIDES[palette.id] || [];
  let guideHtml = '';
  if (guide.length > 0) {
    const owned = getOwned();
    const rows = guide.map(entry => {
      const paints = entry.ids.map(id => allColors.find(c => c.id === id)).filter(Boolean);
      if (!paints.length) return '';
      const chips = paints.map(p => {
        const have = owned.has(p.id);
        return `<span class="guide-chip${have ? ' guide-chip-owned' : ''}" title="${p.company} · ${p.brand}${have ? ' — in your collection' : ''}">
          <span class="swatch" style="background:${p.hex}"></span>
          <span class="guide-paint-name">${p.name}</span>
          <span class="guide-paint-meta">${p.company} · ${p.brand}</span>
          ${have ? '<span class="guide-owned-badge">✓ Owned</span>' : ''}
        </span>`;
      }).join('');
      return `<div class="guide-row"><span class="guide-role">${entry.role}</span><div class="guide-chips">${chips}</div></div>`;
    }).join('');
    guideHtml = `
      <details class="paint-guide">
        <summary class="paint-guide-toggle">Paint suggestions</summary>
        <div class="paint-guide-body">${rows}</div>
      </details>`;
  }

  card.innerHTML = `
    <h3>${palette.title}</h3>
    <p>${palette.description}</p>
    <div class="palette-sample">
      ${palette.sample.map(s => `<span class="palette-swatch" title="${s.name}" style="background:${s.hex}"></span>`).join('')}
    </div>
    ${guideHtml}
  `;
  return card;
}

function renderPaletteAnalysis() {
  const ownedIds = getOwned();
  const suggestions = PALETTE_TEMPLATES.map(palette => {
    const sampleMatch = palette.sample.map(s => {
      const match = findNearestOwnedColor(s.hex);
      const ownedMatch = match && match.distance < 80;
      return { sample: s, ownedMatch, match, owned: ownedMatch };
    });
    const count = sampleMatch.filter(m => m.owned).length;
    const missing = sampleMatch.filter(m => !m.owned);
    return { palette, count, missing, sampleMatch };
  }).sort((a, b) => b.count - a.count || a.palette.title.localeCompare(b.palette.title));

  paletteAnalysis.innerHTML = '';
  suggestions.slice(0, 3).forEach(item => {
    const card = document.createElement('div');
    card.className = 'suggestion-card';
    card.innerHTML = `
      <div class="suggestion-meta">
        <div class="suggestion-title">${item.palette.title}</div>
        <div class="suggestion-detail">${item.count} of ${item.palette.sample.length} palette colors matched in your collection</div>
      </div>
      <div class="suggestion-detail">${item.palette.description}</div>
      <div class="suggestion-colors">
        ${item.palette.sample.map(s => {
          const owned = item.sampleMatch.find(m => m.sample === s).owned;
          return `<span class="suggestion-chip"><span class="swatch" style="background:${s.hex}"></span>${s.name}${owned ? ' ✓' : ''}</span>`;
        }).join('')}
      </div>
    `;
    paletteAnalysis.appendChild(card);
  });

  const missing = suggestions.flatMap(item => item.missing.map(m => ({ palette: item.palette, sample: m.sample, nearest: findNearestColor(m.sample.hex, allColors) })));
  missingList.innerHTML = '';
  if (missing.length === 0) {
    missingList.innerHTML = '<p class="empty-msg">Your owned colors already cover the recommended palette swatches nicely.</p>';
    return;
  }

  missing.slice(0, 6).forEach(item => {
    const card = document.createElement('div');
    card.className = 'missing-card';
    const nearest = item.nearest.color;
    card.innerHTML = `
      <div class="missing-meta">
        <div class="missing-title">Missing ${item.sample.name} for ${item.palette.title}</div>
        <div class="missing-detail">Closest available paint: ${nearest.name}</div>
      </div>
      <div class="missing-colors">
        <span class="missing-chip"><span class="swatch" style="background:${item.sample.hex}"></span>${item.sample.name}</span>
        <span class="missing-chip"><span class="swatch" style="background:${nearest.hex}"></span>${nearest.name}</span>
      </div>
    `;
    missingList.appendChild(card);
  });
}

/* ── Render My Colors ─────────────────────────────────────── */
function renderMine() {
  const owned  = getOwned();
  const low    = getLow();
  let colors = allColors.filter(c => owned.has(c.id));
  if (mineFilterLow) {
    colors = colors.filter(c => low.has(c.id));
  } else if (mineFilterStale) {
    colors = colors.filter(c => isDryingOut(c.id));
  } else {
    colors = colors.concat(getMixColors());
  }
  listMine.innerHTML = '';

  if (colors.length === 0) {
    toggleMineEmpty();
    return;
  }

  if (mineSort === 'company') {
    renderMineByCompany(colors, owned);
  } else {
    renderMineByColor(colors, owned);
  }
  toggleMineEmpty();
}

function renderMineByCompany(colors, owned) {
  // Keep natural JSON order (already grouped by company/brand)
  const grid = document.createElement('div');
  grid.className = 'color-list';
  colors.forEach(c => grid.appendChild(buildCard(c, owned, { showFreshness: true })));
  listMine.appendChild(grid);
}

function renderMineByColor(colors, owned) {
  // Group by family, sort within each family by hue
  const groups = {};
  colors.forEach(c => {
    const f = getColorFamily(c.hex);
    if (!groups[f]) groups[f] = [];
    groups[f].push(c);
  });

  // Sort each family's colors by hue then lightness
  Object.values(groups).forEach(arr => arr.sort((a, b) => colorSortKey(a) - colorSortKey(b)));

  // Render in defined family order
  const frag = document.createDocumentFragment();
  FAMILIES.forEach(({ name, label }) => {
    const arr = groups[name];
    if (!arr || arr.length === 0) return;

    // Pick a representative swatch from the middle of the group
    const swatch = arr[Math.floor(arr.length / 2)].hex;
    frag.appendChild(buildGroupHeader(label, swatch, arr.length));

    const grid = document.createElement('div');
    grid.className = 'color-list';
    arr.forEach(c => grid.appendChild(buildCard(c, owned, { showFreshness: true })));
    frag.appendChild(grid);
  });

  listMine.appendChild(frag);
}

function toggleMineEmpty() {
  const hasCards = listMine.querySelector('.color-card') !== null;
  emptyMine.style.display = hasCards ? 'none' : 'block';
  emptyMine.innerHTML = mineFilterLow
    ? `<div class="empty-icon">⚠</div><p>No low-stock paints.</p><p class="empty-hint">Click the <strong>warning</strong> icon on an owned paint to flag it as running low.</p>`
    : mineFilterStale
    ? `<div class="empty-icon">⏳</div><p>No paints are drying out.</p><p class="empty-hint">Set an <strong>opened date</strong> on an owned paint to track its freshness.</p>`
    : `<div class="empty-icon">🎨</div><p>Your collection is empty.</p><p class="empty-hint">Switch to <strong>All Colors</strong> and click <strong>+</strong> to add paints.</p>`;
  // toolbar always visible so import works on an empty collection
  document.getElementById('mine-sort-pills').style.opacity = hasCards ? '1' : '0.4';
}

/* ── Render Shopping List ─────────────────────────────────── */
function renderShoppingList() {
  const cart = getCart();
  const colors = allColors.filter(c => cart.has(c.id)).concat(getMixColors().filter(c => cart.has(c.id)));
  listShopping.innerHTML = '';

  const count = colors.length;
  shoppingCountLabel.textContent = count === 0 ? '0 items' : `${count} item${count !== 1 ? 's' : ''}`;

  if (count === 0) { toggleShoppingEmpty(); updateShoppingTotal(); return; }

  const groups = {};
  colors.forEach(c => {
    if (!groups[c.company]) groups[c.company] = [];
    groups[c.company].push(c);
  });

  const owned = getOwned();
  const frag = document.createDocumentFragment();
  Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([company, list]) => {
      const coSlug = company.replace(' ', '-');
      const header = document.createElement('div');
      header.className = 'group-header';
      header.innerHTML = `
        <span class="badge badge-co ${coSlug}">${company}</span>
        <span class="group-count">${list.length}</span>
      `;
      frag.appendChild(header);
      const grid = document.createElement('div');
      grid.className = 'color-list';
      list.forEach(c => grid.appendChild(buildCard(c, owned, { showPrice: true })));
      frag.appendChild(grid);
    });
  listShopping.appendChild(frag);
  toggleShoppingEmpty();
  updateShoppingTotal();
}

function updateShoppingTotal() {
  const cart = getCart();
  let total = 0, priced = 0, unpriced = 0;
  cart.forEach(id => {
    const price = getPrice(id);
    if (price !== null) { total += price; priced++; }
    else { unpriced++; }
  });
  const totalLabel = document.getElementById('shopping-total-label');
  if (cart.size === 0) { totalLabel.textContent = ''; return; }
  totalLabel.textContent = `$${total.toFixed(2)}` + (unpriced > 0 ? ` (${unpriced} without a price)` : '');
}

function toggleShoppingEmpty() {
  const hasCards = listShopping.querySelector('.color-card') !== null;
  emptyShopping.style.display = hasCards ? 'none' : 'block';
}

/* ── Count badges ─────────────────────────────────────────── */
function updateBadges() {
  const size     = getOwned().size + getMixes().length;
  const cartSize = getCart().size;
  countAll.textContent      = allColors.length;
  countMine.textContent     = size;
  countPalettes.textContent = PALETTE_TEMPLATES.length;
  countCart.textContent     = cartSize;
  if (countProjects) countProjects.textContent = getProjects().length;
  countMine.classList.toggle('owned', size > 0);
  countCart.classList.toggle('has-items', cartSize > 0);
}

/* ── Tab switching ────────────────────────────────────────── */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === activeTab) return;
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${activeTab}`).classList.add('active');
    toolbarAll.hidden = activeTab !== 'all';
    if (activeTab !== 'all' && selectMode) exitSelectMode();
    if (activeTab === 'mine') renderMine();
    if (activeTab === 'palettes') renderPalettes();
    if (activeTab === 'shopping') renderShoppingList();
    if (activeTab === 'gradient') { initGradientPickers(); initBlendPickers(); blendResultEl.innerHTML = ''; }
    if (activeTab === 'projects') renderProjects();
    if (activeTab === 'learn') renderLearn();
    if (activeTab === 'stats') renderStats();
  });
});

/* ── All Colors sort pills ────────────────────────────────── */
document.querySelectorAll('#all-sort-pills .sort-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.allsort === allSort) return;
    document.querySelectorAll('#all-sort-pills .sort-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    allSort = btn.dataset.allsort;
    renderAll();
  });
});

/* ── Mine sort pills ──────────────────────────────────────── */
document.querySelectorAll('#mine-sort-pills .sort-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.sort === mineSort) return;
    document.querySelectorAll('#mine-sort-pills .sort-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mineSort = btn.dataset.sort;
    renderMine();
  });
});

/* ── Mine low-stock / freshness filters ───────────────────── */
document.getElementById('btn-filter-low').addEventListener('click', function () {
  mineFilterLow = !mineFilterLow;
  if (mineFilterLow) { mineFilterStale = false; document.getElementById('btn-filter-stale').classList.remove('active'); }
  this.classList.toggle('active', mineFilterLow);
  renderMine();
});
document.getElementById('btn-filter-stale').addEventListener('click', function () {
  mineFilterStale = !mineFilterStale;
  if (mineFilterStale) { mineFilterLow = false; document.getElementById('btn-filter-low').classList.remove('active'); }
  this.classList.toggle('active', mineFilterStale);
  renderMine();
});

/* ── Search ───────────────────────────────────────────────── */
searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
  hexMatchTarget = parseColorInput(searchQuery);
  renderAll();
});

const colorPicker = document.getElementById('color-picker');
colorPicker.addEventListener('input', e => {
  searchInput.value = e.target.value;
  searchQuery = e.target.value;
  hexMatchTarget = parseColorInput(searchQuery);
  renderAll();
});

/* ── Company filter pills ─────────────────────────────────── */
document.querySelectorAll('.company-pills .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.company-pills .pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCompany = btn.dataset.company;
    buildBrandPills(activeCompany);
    renderAll();
  });
});

if (themeSelect) {
  themeSelect.addEventListener('change', e => applyTheme(e.target.value));
}
initTheme();

document.getElementById('a11y-pattern-toggle').addEventListener('change', e => {
  const settings = getA11ySettings();
  settings.patternMode = e.target.checked;
  saveA11ySettings(settings);
  applyA11ySettings(settings);
});
document.getElementById('a11y-simulate-select').addEventListener('change', e => {
  const settings = getA11ySettings();
  settings.simulate = e.target.value;
  saveA11ySettings(settings);
  applyA11ySettings(settings);
});
initA11y();

/* ── Toast ────────────────────────────────────────────────── */
function showToast(msg, opts = {}) {
  if (typeof opts === 'boolean') opts = { isError: opts };
  const { isError = false, actionLabel, onAction } = opts;

  document.getElementById('toast')?.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = isError ? 'toast toast-error' : 'toast';

  const msgSpan = document.createElement('span');
  msgSpan.textContent = msg;
  t.appendChild(msgSpan);

  if (actionLabel && onAction) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-action';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => {
      onAction();
      t.remove();
    });
    t.appendChild(btn);
  }

  document.body.appendChild(t);
  setTimeout(() => { if (document.getElementById('toast') === t) t.remove(); }, actionLabel ? 6000 : 3200);
}

/* ── Export ───────────────────────────────────────────────── */
document.getElementById('btn-export').addEventListener('click', () => {
  const owned = getOwned();
  if (owned.size === 0) { showToast('Nothing to export yet.', true); return; }
  const payload = {
    version: 1,
    exported: new Date().toISOString(),
    count: owned.size,
    colors: [...owned],
    low: [...getLow()],
    mixes: getMixes(),
    prices: getPrices(),
    opened: getOpenedDates(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `colors-of-mini-${new Date().toISOString().slice(0, 10)}.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Exported ${owned.size} color${owned.size !== 1 ? 's' : ''}.`);
});

/* ── Import ───────────────────────────────────────────────── */
document.getElementById('import-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const raw  = JSON.parse(ev.target.result);
      const ids  = Array.isArray(raw) ? raw : (Array.isArray(raw.colors) ? raw.colors : null);
      if (!ids) throw new Error('Unrecognised file format.');

      const owned  = getOwned();
      const before = owned.size;
      ids.forEach(id => { if (typeof id === 'string') owned.add(id); });
      saveOwned(owned);

      if (Array.isArray(raw.low)) {
        const low = getLow();
        raw.low.forEach(id => { if (typeof id === 'string' && owned.has(id)) low.add(id); });
        saveLow(low);
      }

      if (Array.isArray(raw.mixes)) {
        const mixes = getMixes();
        const existingIds = new Set(mixes.map(m => m.id));
        raw.mixes.forEach(m => {
          if (m && typeof m.id === 'string' && typeof m.hex === 'string' && !existingIds.has(m.id)) {
            mixes.push(m);
            existingIds.add(m.id);
          }
        });
        saveMixes(mixes);
      }

      if (raw.prices && typeof raw.prices === 'object') {
        const prices = getPrices();
        Object.entries(raw.prices).forEach(([id, val]) => {
          if (typeof val === 'number') prices[id] = val;
        });
        savePrices(prices);
      }

      if (raw.opened && typeof raw.opened === 'object') {
        const opened = getOpenedDates();
        Object.entries(raw.opened).forEach(([id, entry]) => {
          if (owned.has(id) && entry && typeof entry.openedDate === 'string') {
            opened[id] = { openedDate: entry.openedDate, snoozedUntil: entry.snoozedUntil || null };
          }
        });
        saveOpenedDates(opened);
      }

      const added = owned.size - before;
      updateBadges();
      if (activeTab === 'mine') renderMine();
      showToast(`Imported ${added} new color${added !== 1 ? 's' : ''} — ${owned.size} total.`);
    } catch (err) {
      showToast('Import failed: ' + err.message, true);
    }
    e.target.value = ''; // allow re-importing the same file
  };
  reader.readAsText(file);
});

/* ── Clear all ────────────────────────────────────────────── */
document.getElementById('btn-clear').addEventListener('click', () => {
  const owned = getOwned();
  if (owned.size === 0) { showToast('Collection is already empty.', true); return; }
  const ownedSnapshot = new Set(owned);
  const lowSnapshot   = new Set(getLow());
  saveOwned(new Set());
  saveLow(new Set());
  updateBadges();
  if (activeTab === 'mine') renderMine();
  showToast(`Collection cleared (${ownedSnapshot.size} colors).`, {
    actionLabel: 'Undo',
    onAction: () => {
      saveOwned(ownedSnapshot);
      saveLow(lowSnapshot);
      updateBadges();
      if (activeTab === 'mine') renderMine();
    },
  });
});

/* ── Shopping list actions ────────────────────────────────── */
document.getElementById('btn-print-cart').addEventListener('click', () => {
  window.print();
});

document.getElementById('btn-clear-cart').addEventListener('click', () => {
  const cart = getCart();
  if (cart.size === 0) { showToast('Shopping list is already empty.', true); return; }
  const cartSnapshot = new Set(cart);
  saveCart(new Set());
  updateBadges();
  if (activeTab === 'shopping') renderShoppingList();
  showToast(`Shopping list cleared (${cartSnapshot.size} items).`, {
    actionLabel: 'Undo',
    onAction: () => {
      saveCart(cartSnapshot);
      updateBadges();
      if (activeTab === 'shopping') renderShoppingList();
    },
  });
});

/* ── Custom paint mixes ───────────────────────────────────── */
const mixPanel        = document.getElementById('mix-panel');
const mixIngredients  = document.getElementById('mix-ingredients');
const mixNameInput    = document.getElementById('mix-name');
const mixPreviewSwatch = document.getElementById('mix-preview-swatch');
const mixPreviewLabel  = document.getElementById('mix-preview-label');
const MAX_MIX_INGREDIENTS = 5;

function buildMixIngredientOptions(selectedId) {
  return allColors.map(c =>
    `<option value="${c.id}"${c.id === selectedId ? ' selected' : ''}>${c.name} — ${c.company} ${c.brand}</option>`
  ).join('');
}

function addMixIngredientRow(colorId) {
  if (mixIngredients.children.length >= MAX_MIX_INGREDIENTS) return;
  const row = document.createElement('div');
  row.className = 'mix-ingredient-row';
  row.innerHTML = `
    <select class="mix-ingredient-color">${buildMixIngredientOptions(colorId)}</select>
    <input type="number" class="mix-ingredient-ratio" min="0" max="100" step="5" value="50">
    <span>%</span>
    <button type="button" class="mix-ingredient-remove" aria-label="Remove color">✕</button>
  `;
  row.querySelector('.mix-ingredient-color').addEventListener('change', updateMixPreview);
  row.querySelector('.mix-ingredient-ratio').addEventListener('input', updateMixPreview);
  row.querySelector('.mix-ingredient-remove').addEventListener('click', () => {
    row.remove();
    updateMixPreview();
  });
  mixIngredients.appendChild(row);
}

function readMixIngredients() {
  return [...mixIngredients.querySelectorAll('.mix-ingredient-row')].map(row => {
    const colorId = row.querySelector('.mix-ingredient-color').value;
    const ratio   = parseFloat(row.querySelector('.mix-ingredient-ratio').value) || 0;
    const color   = allColors.find(c => c.id === colorId);
    return color ? { color, ratio } : null;
  }).filter(Boolean);
}

function updateMixPreview() {
  const ingredients = readMixIngredients().filter(i => i.ratio > 0);
  if (ingredients.length < 2) {
    mixPreviewSwatch.style.background = 'transparent';
    mixPreviewLabel.textContent = 'Pick at least 2 colors with a ratio to preview.';
    return;
  }
  const hex = mixHex(ingredients);
  mixPreviewSwatch.style.background = hex;
  mixPreviewLabel.textContent = ingredients.map(i => `${i.color.name} (${i.ratio}%)`).join(' + ');
}

function openMixPanel() {
  mixNameInput.value = '';
  mixIngredients.innerHTML = '';
  addMixIngredientRow();
  addMixIngredientRow();
  updateMixPreview();
  mixPanel.hidden = false;
}

document.getElementById('btn-new-mix').addEventListener('click', openMixPanel);
document.getElementById('btn-add-ingredient').addEventListener('click', () => addMixIngredientRow());
document.getElementById('btn-cancel-mix').addEventListener('click', () => { mixPanel.hidden = true; });

document.getElementById('btn-save-mix').addEventListener('click', () => {
  const ingredients = readMixIngredients().filter(i => i.ratio > 0);
  const distinctColors = new Set(ingredients.map(i => i.color.id));
  if (ingredients.length < 2 || distinctColors.size < 2) {
    showToast('Pick at least 2 different colors with a ratio above 0.', true);
    return;
  }
  const hex  = mixHex(ingredients);
  const name = mixNameInput.value.trim() || ingredients.map(i => i.color.name).join(' + ');
  const mix = {
    id: `mix-${Date.now()}`,
    name,
    hex,
    ingredients: ingredients.map(i => ({ colorId: i.color.id, ratio: i.ratio })),
  };
  const mixes = getMixes();
  mixes.push(mix);
  saveMixes(mixes);

  mixPanel.hidden = true;
  updateBadges();
  if (activeTab === 'mine') renderMine();
  showToast(`Mix "${name}" saved.`);
});

/* ── Gradient / OSL recipe builder ───────────────────────── */
const GRADIENTS_KEY = 'colors-of-mini-ramps-v1';
function getGradients() {
  try { return JSON.parse(localStorage.getItem(GRADIENTS_KEY) || '[]'); }
  catch { return []; }
}
function saveGradients(list) {
  localStorage.setItem(GRADIENTS_KEY, JSON.stringify(list));
}

const gradShadow    = document.getElementById('grad-shadow');
const gradBase      = document.getElementById('grad-base');
const gradHighlight = document.getElementById('grad-highlight');
const gradSteps     = document.getElementById('grad-steps');
const gradStepsLabel = document.getElementById('grad-steps-label');
const gradientRampEl = document.getElementById('gradient-ramp');
const blendFrom      = document.getElementById('blend-from');
const blendTo        = document.getElementById('blend-to');
const blendResultEl  = document.getElementById('blend-result');
const gradientSavedList = document.getElementById('gradient-saved-list');

function populateColorSelect(select, colorList, defaultIndex) {
  select.innerHTML = colorList.map((c, i) =>
    `<option value="${c.id}"${i === defaultIndex ? ' selected' : ''}>${c.name} — ${c.company}</option>`
  ).join('');
}

function initGradientPickers() {
  if (!allColors.length) return;
  populateColorSelect(gradShadow, allColors, 0);
  populateColorSelect(gradBase, allColors, Math.floor(allColors.length / 2));
  populateColorSelect(gradHighlight, allColors, allColors.length - 1);
  renderGradientRamp();
  renderGradientSaved();
}

function buildGradientStepCard(hex) {
  const nearest = findNearestColor(hex, allColors);
  const paint   = nearest.color;
  const owned   = getOwned().has(paint.id) || getMixColors().some(m => m.id === paint.id);
  const inCart  = getCart().has(paint.id);
  const el = document.createElement('div');
  el.className = `gradient-step${owned ? '' : ' not-owned'}`;
  el.innerHTML = `
    <div class="color-circle" style="background:${hex}"></div>
    <div class="gradient-step-name" title="${paint.name}">${paint.name}</div>
    <div class="gradient-step-meta">${owned ? 'Owned' : 'Not owned'}</div>
    ${owned ? '' : `<button type="button" class="gradient-step-addcart${inCart ? ' added' : ''}">${inCart ? '✓ On list' : '+ Shopping list'}</button>`}
  `;
  if (!owned) {
    el.querySelector('.gradient-step-addcart').addEventListener('click', e => {
      const nowInCart = toggleCart(paint.id);
      e.target.classList.toggle('added', nowInCart);
      e.target.textContent = nowInCart ? '✓ On list' : '+ Shopping list';
      updateBadges();
    });
  }
  return { el, paint };
}

function currentRampHexes() {
  const shadow    = allColors.find(c => c.id === gradShadow.value);
  const base      = allColors.find(c => c.id === gradBase.value);
  const highlight = allColors.find(c => c.id === gradHighlight.value);
  if (!shadow || !base || !highlight) return null;
  const steps = parseInt(gradSteps.value, 10);
  return buildRampHexes(shadow.hex, base.hex, highlight.hex, steps);
}

function renderGradientRamp() {
  gradStepsLabel.textContent = gradSteps.value;
  const hexes = currentRampHexes();
  gradientRampEl.innerHTML = '';
  if (!hexes) return;
  hexes.forEach(hex => gradientRampEl.appendChild(buildGradientStepCard(hex).el));
}

[gradShadow, gradBase, gradHighlight, gradSteps].forEach(el => {
  el.addEventListener('input', renderGradientRamp);
  el.addEventListener('change', renderGradientRamp);
});

document.getElementById('btn-save-ramp').addEventListener('click', () => {
  const hexes = currentRampHexes();
  if (!hexes) { showToast('Pick shadow, base and highlight colors first.', true); return; }
  const stepIds = hexes.map(hex => findNearestColor(hex, allColors).color.id);
  const nameInput = document.getElementById('grad-recipe-name');
  const name = nameInput.value.trim() || `${allColors.find(c => c.id === gradShadow.value).name} → ${allColors.find(c => c.id === gradHighlight.value).name}`;
  const recipes = getGradients();
  recipes.push({ id: `ramp-${Date.now()}`, name, steps: stepIds, createdAt: new Date().toISOString() });
  saveGradients(recipes);
  nameInput.value = '';
  renderGradientSaved();
  showToast(`Recipe "${name}" saved.`);
});

function renderGradientSaved() {
  const recipes = getGradients();
  gradientSavedList.innerHTML = '';
  if (recipes.length === 0) {
    gradientSavedList.innerHTML = '<p class="empty-msg">No saved recipes yet.</p>';
    return;
  }
  recipes.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'gradient-recipe-card';
    const swatches = recipe.steps
      .map(id => allColors.find(c => c.id === id) || getMixColors().find(c => c.id === id))
      .filter(Boolean)
      .map(c => `<span class="swatch" style="background:${c.hex}" title="${c.name}"></span>`)
      .join('');
    card.innerHTML = `
      <div class="gradient-recipe-swatches">${swatches}</div>
      <div class="gradient-recipe-name">${recipe.name}</div>
      <button class="action-btn danger" data-id="${recipe.id}">✕ Delete</button>
    `;
    card.querySelector('button').addEventListener('click', () => {
      saveGradients(getGradients().filter(r => r.id !== recipe.id));
      renderGradientSaved();
    });
    gradientSavedList.appendChild(card);
  });
}

/* ── Complete-the-gradient (owned-only blend finder) ─────── */
function ownedColorList() {
  const owned = getOwned();
  return allColors.filter(c => owned.has(c.id)).concat(getMixColors());
}

function initBlendPickers() {
  const owned = ownedColorList();
  populateColorSelect(blendFrom, owned, 0);
  populateColorSelect(blendTo, owned, owned.length - 1);
}

document.getElementById('btn-find-blend').addEventListener('click', () => {
  const owned = ownedColorList();
  const from  = owned.find(c => c.id === blendFrom.value);
  const to    = owned.find(c => c.id === blendTo.value);
  blendResultEl.innerHTML = '';
  if (!from || !to || owned.length < 2) {
    blendResultEl.innerHTML = '<p class="empty-msg">Own at least two colors to find a blend.</p>';
    return;
  }
  if (from.id === to.id) {
    blendResultEl.innerHTML = '<p class="empty-msg">Pick two different owned colors.</p>';
    return;
  }
  const midHex = interpolateHexRange(from.hex, to.hex, 3)[1];
  const candidates = owned.filter(c => c.id !== from.id && c.id !== to.id);
  const nearest = candidates.length ? findNearestColor(midHex, candidates) : null;

  const frag = document.createDocumentFragment();
  const fromCard = document.createElement('div');
  fromCard.className = 'gradient-step';
  fromCard.innerHTML = `<div class="color-circle" style="background:${from.hex}"></div><div class="gradient-step-name">${from.name}</div><div class="gradient-step-meta">Owned</div>`;
  frag.appendChild(fromCard);

  if (nearest && nearest.distance < 60) {
    const midCard = document.createElement('div');
    midCard.className = 'gradient-step';
    midCard.innerHTML = `<div class="color-circle" style="background:${nearest.color.hex}"></div><div class="gradient-step-name">${nearest.color.name}</div><div class="gradient-step-meta">Owned — good bridge</div>`;
    frag.appendChild(midCard);
  } else {
    const buy = findNearestColor(midHex, allColors);
    const gapCard = document.createElement('div');
    gapCard.className = 'gradient-step not-owned';
    gapCard.innerHTML = `<div class="color-circle" style="background:${midHex}"></div><div class="gradient-step-name">${buy.color.name}</div><div class="gradient-step-meta">Nothing owned fits — consider buying</div>`;
    frag.appendChild(gapCard);
  }

  const toCard = document.createElement('div');
  toCard.className = 'gradient-step';
  toCard.innerHTML = `<div class="color-circle" style="background:${to.hex}"></div><div class="gradient-step-name">${to.name}</div><div class="gradient-step-meta">Owned</div>`;
  frag.appendChild(toCard);

  blendResultEl.appendChild(frag);
});

/* ── Projects / Armies grouping ──────────────────────────── */
const PROJECTS_KEY = 'colors-of-mini-projects-v1';
let activeProjectId = null;

function getProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]'); }
  catch { return []; }
}
function saveProjects(list) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
}

const projectsListView   = document.getElementById('projects-list-view');
const projectDetailView  = document.getElementById('project-detail-view');
const projectsGrid       = document.getElementById('projects-grid');
const emptyProjects      = document.getElementById('empty-projects');
const projectDetailName  = document.getElementById('project-detail-name');
const projectChecklist   = document.getElementById('project-color-checklist');
const btnProjectPublish  = document.getElementById('btn-project-publish');
const communityGrid      = document.getElementById('community-grid');
const emptyCommunity     = document.getElementById('empty-community');
const countProjects      = document.getElementById('count-projects');
const countCommunity     = document.getElementById('count-community');

function renderProjects() {
  activeProjectId = null;
  projectsListView.hidden = false;
  projectDetailView.hidden = true;

  const projects = getProjects();
  projectsGrid.innerHTML = '';
  emptyProjects.hidden = projects.length > 0;

  projects.forEach(project => {
    const colors = allColors.filter(c => project.colorIds.includes(c.id)).concat(getMixColors().filter(c => project.colorIds.includes(c.id)));
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <h3>${project.name}</h3>
      <div class="project-card-count">${colors.length} color${colors.length !== 1 ? 's' : ''}</div>
      <div class="project-card-swatches">
        ${colors.slice(0, 12).map(c => `<span class="swatch" style="background:${c.hex}" title="${c.name}"></span>`).join('')}
      </div>
    `;
    card.addEventListener('click', () => openProject(project.id));
    projectsGrid.appendChild(card);
  });

  updateBadges();
}

function openProject(id) {
  activeProjectId = id;
  projectsListView.hidden = true;
  projectDetailView.hidden = false;
  renderProjectDetail();
}

function renderProjectDetail() {
  const project = getProjects().find(p => p.id === activeProjectId);
  if (!project) { renderProjects(); return; }
  projectDetailName.textContent = project.name;

  const owned = getOwned();
  const ownedColors = allColors.filter(c => owned.has(c.id)).concat(getMixColors());
  projectChecklist.innerHTML = '';
  if (ownedColors.length === 0) {
    projectChecklist.innerHTML = '<p class="empty-msg">You don\'t own any colors yet — add some in All Colors first.</p>';
    return;
  }
  ownedColors.forEach(c => {
    const inProject = project.colorIds.includes(c.id);
    const item = document.createElement('label');
    item.className = 'project-checklist-item';
    item.innerHTML = `
      <input type="checkbox" ${inProject ? 'checked' : ''}>
      <span class="swatch" style="background:${c.hex}"></span>
      <span class="name">${c.name}</span>
    `;
    item.querySelector('input').addEventListener('change', e => {
      const projects = getProjects();
      const p = projects.find(pr => pr.id === activeProjectId);
      if (!p) return;
      if (e.target.checked) {
        if (!p.colorIds.includes(c.id)) p.colorIds.push(c.id);
      } else {
        p.colorIds = p.colorIds.filter(id => id !== c.id);
      }
      saveProjects(projects);
    });
    projectChecklist.appendChild(item);
  });
}

document.getElementById('btn-new-project').addEventListener('click', () => {
  const input = document.getElementById('new-project-name');
  const name = input.value.trim();
  if (!name) { showToast('Enter a project name.', true); return; }
  const projects = getProjects();
  projects.push({ id: `project-${Date.now()}`, name, colorIds: [], createdAt: new Date().toISOString() });
  saveProjects(projects);
  input.value = '';
  renderProjects();
  showToast(`Project "${name}" created.`);
});

/* ── "Surprise Me" random palette generator ──────────────── */
let lastSurpriseColors = [];

function generatePalette({ count = 5, ownedOnly = false, mode = 'random' } = {}) {
  const pool = ownedOnly ? ownedColorList() : allColors.concat(getMixColors());
  if (pool.length === 0) return [];
  count = Math.min(count, pool.length);

  if (mode === 'harmony') {
    const seed = pool[Math.floor(Math.random() * pool.length)];
    const { h, s, l } = hexToHsl(seed.hex);
    const hueOffsets = [0, 180, -30, 30, -120, 120, 60, -60, 150, -150];
    const result = [];
    const usedIds = new Set();
    for (const offset of hueOffsets) {
      if (result.length >= count) break;
      const match = findNearestColor(hslToHex(h + offset, s, l), pool);
      if (match.color && !usedIds.has(match.color.id)) {
        usedIds.add(match.color.id);
        result.push(match.color);
      }
    }
    const shuffledRest = [...pool].sort(() => Math.random() - 0.5);
    for (const c of shuffledRest) {
      if (result.length >= count) break;
      if (!usedIds.has(c.id)) { usedIds.add(c.id); result.push(c); }
    }
    return result;
  }

  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

function renderSurpriseResult(colors) {
  lastSurpriseColors = colors;
  const el = document.getElementById('surprise-result');
  if (!colors.length) {
    el.innerHTML = '<p class="empty-msg-small">Not enough colors to generate a palette. Try turning "Owned only" off, or own more paints first.</p>';
    return;
  }
  el.innerHTML = `
    <div class="palette-sample surprise-sample">
      ${colors.map(c => `<span class="palette-swatch" title="${c.name}" style="background:${c.hex}"></span>`).join('')}
    </div>
    <div class="suggestion-colors">
      ${colors.map(c => `<span class="suggestion-chip"><span class="swatch" style="background:${c.hex}"></span>${c.name}</span>`).join('')}
    </div>
    <div class="surprise-save-row">
      <input type="text" id="surprise-project-name" class="search-input" placeholder="Project name…">
      <button class="action-btn" id="btn-surprise-save">Save as Project</button>
      <button class="action-btn" id="btn-surprise-regenerate">↻ Regenerate</button>
    </div>
  `;
  document.getElementById('btn-surprise-save').addEventListener('click', () => {
    const nameInput = document.getElementById('surprise-project-name');
    const name = nameInput.value.trim() || `Surprise Palette ${new Date().toLocaleDateString()}`;
    const projects = getProjects();
    projects.push({ id: `project-${Date.now()}`, name, colorIds: lastSurpriseColors.map(c => c.id), createdAt: new Date().toISOString() });
    saveProjects(projects);
    updateBadges();
    showToast(`Saved as project "${name}".`);
  });
  document.getElementById('btn-surprise-regenerate').addEventListener('click', runSurpriseGenerate);
}

function runSurpriseGenerate() {
  const count = Math.max(3, Math.min(8, parseInt(document.getElementById('surprise-count').value, 10) || 5));
  const ownedOnly = document.getElementById('surprise-owned-only').checked;
  const mode = document.getElementById('surprise-mode').value;
  if (ownedOnly && ownedColorList().length === 0) {
    showToast('You need to own at least one color first.', true);
    renderSurpriseResult([]);
    return;
  }
  renderSurpriseResult(generatePalette({ count, ownedOnly, mode }));
}

document.getElementById('btn-surprise-generate').addEventListener('click', runSurpriseGenerate);

document.getElementById('btn-project-back').addEventListener('click', renderProjects);

document.getElementById('btn-project-delete').addEventListener('click', () => {
  const project = getProjects().find(p => p.id === activeProjectId);
  if (!project) return;
  saveProjects(getProjects().filter(p => p.id !== activeProjectId));
  renderProjects();
  showToast(`Project "${project.name}" deleted.`, {
    actionLabel: 'Undo',
    onAction: () => {
      const projects = getProjects();
      projects.push(project);
      saveProjects(projects);
      renderProjects();
    },
  });
});

document.getElementById('btn-project-duplicate').addEventListener('click', () => {
  const project = getProjects().find(p => p.id === activeProjectId);
  if (!project) return;
  const projects = getProjects();
  const copy = { id: `project-${Date.now()}`, name: `${project.name} (copy)`, colorIds: [...project.colorIds], createdAt: new Date().toISOString() };
  projects.push(copy);
  saveProjects(projects);
  openProject(copy.id);
  showToast(`Duplicated as "${copy.name}".`);
});

/* ── Notes & tags modal ───────────────────────────────────── */
const noteModal      = document.getElementById('note-modal');
const noteModalTitle = document.getElementById('note-modal-title');
const noteModalText  = document.getElementById('note-modal-text');
const noteModalTags  = document.getElementById('note-modal-tags');
const tagFilterRow   = document.getElementById('tag-filter-row');
const tagFilterPills = document.getElementById('tag-filter-pills');

function getHarmonyColors(hex) {
  const { h, s, l } = hexToHsl(hex);
  return {
    complementary: [hslToHex(h + 180, s, l)],
    analogous: [hslToHex(h - 30, s, l), hslToHex(h + 30, s, l)],
    triadic: [hslToHex(h - 120, s, l), hslToHex(h + 120, s, l)],
  };
}

function renderHarmonySuggestions(color) {
  const ownedColors = ownedColorList();
  if (ownedColors.length < 2) {
    noteModalHarmony.hidden = true;
    return;
  }
  noteModalHarmony.hidden = false;

  const harmonies = getHarmonyColors(color.hex);

  const renderChips = (targetEl, hexes) => {
    targetEl.innerHTML = '';
    const uniqueMatches = new Set();
    hexes.forEach(hex => {
      const match = findNearestColor(hex, ownedColors);
      if (match.color.id === color.id || uniqueMatches.has(match.color.id)) return;
      uniqueMatches.add(match.color.id);

      const chip = document.createElement('span');
      chip.className = 'suggestion-chip';
      chip.innerHTML = `<span class="swatch" style="background:${match.color.hex}"></span>${match.color.name}`;
      chip.title = `${match.color.company} · ${match.color.brand}`;
      targetEl.appendChild(chip);
    });
    if (targetEl.children.length === 0) {
      targetEl.innerHTML = `<span class="empty-msg-small">No close matches in your collection.</span>`;
    }
  };

  renderChips(harmonyComplementary, harmonies.complementary);
  renderChips(harmonyAnalogous, harmonies.analogous);
  renderChips(harmonyTriadic, harmonies.triadic);
}

/* ── Cross-brand equivalents lookup ───────────────────────── */
function crossBrandEquivalents(color) {
  const companies = [...new Set(allColors.filter(c => c.company !== color.company).map(c => c.company))];
  return companies
    .map(company => {
      const candidates = allColors.filter(c => c.company === company);
      const match = findNearestColor(color.hex, candidates);
      return match.color ? { company, color: match.color, distance: match.distance } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
}
function equivalentConfidence(distance) {
  if (distance < 30) return { label: 'very close', cls: 'high' };
  if (distance < 70) return { label: 'similar', cls: 'mid' };
  return { label: 'loose match', cls: 'low' };
}
let equivalentsBrandFilter = 'all';
function renderEquivalents(color) {
  equivalentsBrandFilter = 'all';
  const panel = document.getElementById('note-modal-equivalents');
  const pillsEl = document.getElementById('equivalents-brand-pills');
  const listEl = document.getElementById('equivalents-list');
  const matches = crossBrandEquivalents(color);

  if (matches.length === 0) { panel.hidden = true; return; }
  panel.hidden = false;
  const companies = [...new Set(matches.map(m => m.company))];

  const renderList = () => {
    const filtered = equivalentsBrandFilter === 'all' ? matches : matches.filter(m => m.company === equivalentsBrandFilter);
    listEl.innerHTML = filtered.map(m => {
      const inCart = getCart().has(m.color.id);
      const conf = equivalentConfidence(m.distance);
      return `
        <div class="equivalent-row" data-id="${m.color.id}">
          <span class="swatch" style="background:${m.color.hex}"></span>
          <span class="equivalent-name" title="${m.color.company} · ${m.color.brand}">${m.color.name}</span>
          <span class="equivalent-meta">${m.company}</span>
          <span class="equivalent-confidence conf-${conf.cls}">${conf.label}</span>
          <button class="equivalent-cart-btn${inCart ? ' in-cart' : ''}" aria-label="${inCart ? 'Remove from shopping list' : 'Add to shopping list'}">${CART_SVG}</button>
        </div>`;
    }).join('');
    listEl.querySelectorAll('.equivalent-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.equivalent-row').dataset.id;
        const nowInCart = toggleCart(id);
        btn.classList.toggle('in-cart', nowInCart);
        btn.setAttribute('aria-label', nowInCart ? 'Remove from shopping list' : 'Add to shopping list');
        updateBadges();
        if (activeTab === 'shopping') renderShoppingList();
      });
    });
  };

  pillsEl.innerHTML = `<button class="sort-pill active" data-co="all">All</button>` +
    companies.map(co => `<button class="sort-pill" data-co="${co}">${co}</button>`).join('');
  pillsEl.querySelectorAll('.sort-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      equivalentsBrandFilter = btn.dataset.co;
      pillsEl.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderList();
    });
  });
  renderList();
}

function openNoteModal(color) {
  noteModalColorId = color.id;
  noteModalTitle.textContent = `Notes & tags — ${color.name}`;
  const data = getNote(color.id);
  noteModalText.value = data.note || '';
  noteModalTags.value = (data.tags || []).join(', ');
  renderHarmonySuggestions(color);
  renderEquivalents(color);
  noteModal.hidden = false;
}
function closeNoteModal() { noteModal.hidden = true; noteModalColorId = null; }

document.getElementById('btn-note-cancel').addEventListener('click', closeNoteModal);
noteModal.addEventListener('click', e => { if (e.target === noteModal) closeNoteModal(); });

document.getElementById('btn-note-save').addEventListener('click', () => {
  if (!noteModalColorId) return;
  const tags = noteModalTags.value.split(',').map(t => t.trim()).filter(Boolean);
  setNote(noteModalColorId, { note: noteModalText.value, tags });
  closeNoteModal();
  renderTagFilterPills();
  if (activeTab === 'all') renderAll();
  if (activeTab === 'mine') renderMine();
  if (activeTab === 'shopping') renderShoppingList();
  showToast('Note saved.');
});

function renderTagFilterPills() {
  const tags = allUsedTags();
  if (tags.length === 0) {
    tagFilterRow.hidden = true;
    activeTag = 'all';
    return;
  }
  tagFilterRow.hidden = false;
  tagFilterPills.innerHTML = `<button class="sort-pill${activeTag === 'all' ? ' active' : ''}" data-tag="all">All</button>` +
    tags.map(t => `<button class="sort-pill${activeTag === t ? ' active' : ''}" data-tag="${t}">${t}</button>`).join('');
  tagFilterPills.querySelectorAll('.sort-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = btn.dataset.tag;
      renderTagFilterPills();
      renderAll();
    });
  });
}

/* ── Share as image ───────────────────────────────────────── */
function shareAsImage(title, items) {
  if (!items || items.length === 0) { showToast('Nothing to share yet.', true); return; }
  const width = 520;
  const rowH = 54;
  const paddingTop = 70;
  const height = paddingTop + items.length * rowH + 40;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#14142a';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(title, 24, 40);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.moveTo(24, 54); ctx.lineTo(width - 24, 54); ctx.stroke();

  items.forEach((item, i) => {
    const y = paddingTop + i * rowH;
    ctx.fillStyle = item.hex;
    ctx.beginPath();
    ctx.arc(44, y + 22, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '600 15px sans-serif';
    ctx.fillText(item.name, 76, y + 18);

    if (item.brand) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '12px sans-serif';
      ctx.fillText(item.brand, 76, y + 36);
    }
  });

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px sans-serif';
  ctx.fillText('Colors of Mini', 24, height - 16);

  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
    });
    a.click();
    URL.revokeObjectURL(url);
  });
}

document.getElementById('btn-share-cart').addEventListener('click', () => {
  const cart = getCart();
  const items = allColors.filter(c => cart.has(c.id)).concat(getMixColors().filter(c => cart.has(c.id)))
    .map(c => ({ hex: c.hex, name: c.name, brand: `${c.company} · ${c.brand}` }));
  shareAsImage('Shopping List', items);
});

document.getElementById('btn-share-ramp').addEventListener('click', () => {
  const hexes = currentRampHexes();
  if (!hexes) { showToast('Pick shadow, base and highlight colors first.', true); return; }
  const items = hexes.map(hex => {
    const nearest = findNearestColor(hex, allColors).color;
    return { hex, name: nearest.name, brand: `${nearest.company} · ${nearest.brand}` };
  });
  shareAsImage('Gradient Recipe', items);
});

/* ── Bulk / multi-select actions ─────────────────────────── */
const selectionBar   = document.getElementById('selection-bar');
const selectionCount = document.getElementById('selection-count');
const btnSelectMode  = document.getElementById('btn-select-mode');

function toggleCardSelection(id, card) {
  if (selectedIds.has(id)) { selectedIds.delete(id); card.classList.remove('selected'); }
  else { selectedIds.add(id); card.classList.add('selected'); }
  updateSelectionBar();
}

function updateSelectionBar() {
  selectionBar.hidden = selectedIds.size === 0;
  selectionCount.textContent = `${selectedIds.size} selected`;
}

function exitSelectMode() {
  selectMode = false;
  selectedIds.clear();
  btnSelectMode.classList.remove('active');
  btnSelectMode.textContent = '☑ Select';
  listAll.classList.remove('select-mode');
  updateSelectionBar();
}

btnSelectMode.addEventListener('click', () => {
  selectMode = !selectMode;
  btnSelectMode.classList.toggle('active', selectMode);
  btnSelectMode.textContent = selectMode ? '✕ Cancel select' : '☑ Select';
  listAll.classList.toggle('select-mode', selectMode);
  if (!selectMode) { selectedIds.clear(); updateSelectionBar(); }
});

document.getElementById('btn-select-add-owned').addEventListener('click', () => {
  const owned = getOwned();
  selectedIds.forEach(id => owned.add(id));
  saveOwned(owned);
  updateBadges();
  showToast(`Added ${selectedIds.size} color${selectedIds.size !== 1 ? 's' : ''} to your collection.`);
  selectedIds.clear();
  updateSelectionBar();
  renderAll();
});

document.getElementById('btn-select-add-cart').addEventListener('click', () => {
  const cart = getCart();
  selectedIds.forEach(id => cart.add(id));
  saveCart(cart);
  updateBadges();
  showToast(`Added ${selectedIds.size} color${selectedIds.size !== 1 ? 's' : ''} to your shopping list.`);
  selectedIds.clear();
  updateSelectionBar();
  renderAll();
});

document.getElementById('btn-select-clear').addEventListener('click', () => {
  selectedIds.clear();
  updateSelectionBar();
  renderAll();
});

/* ── Onboarding checklist ─────────────────────────────────── */
const ONBOARDING_KEY = 'colors-of-mini-onboarding-dismissed';
const onboardingBanner = document.getElementById('onboarding-banner');

function showOnboarding() { onboardingBanner.hidden = false; }
function hideOnboarding() { onboardingBanner.hidden = true; }

document.getElementById('btn-close-onboarding').addEventListener('click', () => {
  localStorage.setItem(ONBOARDING_KEY, '1');
  hideOnboarding();
});

document.getElementById('btn-show-onboarding').addEventListener('click', showOnboarding);

document.querySelectorAll('#onboarding-checklist li').forEach(li => {
  li.addEventListener('click', () => {
    document.querySelector(`.tab-btn[data-tab="${li.dataset.tab}"]`)?.click();
  });
});

if (!localStorage.getItem(ONBOARDING_KEY)) showOnboarding();

/* ── Init ─────────────────────────────────────────────────── */
fetch('colors.json')
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(data => {
    allColors = data;
    renderAll();
    updateBadges();
    toggleMineEmpty();
    renderGradientSaved();
    renderTagFilterPills();
  })
  .catch(err => {
    listAll.innerHTML = `
      <p class="empty-msg">
        Could not load colors.json (${err.message}).<br>
        Make sure the site is served from a web server, not opened as a local file.
      </p>`;
  });
