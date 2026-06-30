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
const AVAILABLE_THEMES = ['dark', 'light'];
let allSort       = 'default'; // 'default' | 'color'

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

/* ── Card builder ─────────────────────────────────────────── */
const CART_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

function buildCard(color, owned) {
  const isOwned   = owned.has(color.id);
  const inCart    = getCart().has(color.id);
  const coSlug    = color.company.replace(' ', '-');
  const card      = document.createElement('div');
  card.className  = `color-card${isOwned ? ' owned' : ''}`;
  card.dataset.id = color.id;

  card.innerHTML = `
    <div class="color-circle" style="background-color:${color.hex}"></div>
    <div class="color-info">
      <div class="color-meta">
        <span class="badge badge-co ${coSlug}">${color.company}</span>
        <span class="badge badge-brand">${color.brand}</span>
      </div>
      <div class="color-name" title="${color.name}">${color.name}</div>
    </div>
    <button class="cart-btn${inCart ? ' in-cart' : ''}"
            aria-label="${inCart ? 'Remove from shopping list' : 'Add to shopping list'}">
      ${CART_SVG}
    </button>
    <button class="toggle-btn${isOwned ? ' owned' : ''}"
            aria-label="${isOwned ? 'Remove from collection' : 'Add to collection'}">
      ${isOwned ? '✓' : '+'}
    </button>
  `;

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

  card.querySelector('.toggle-btn').addEventListener('click', () => {
    const nowOwned = toggleOwned(color.id);
    card.classList.toggle('owned', nowOwned);
    const btn = card.querySelector('.toggle-btn');
    btn.classList.toggle('owned', nowOwned);
    btn.textContent = nowOwned ? '✓' : '+';
    btn.setAttribute('aria-label', nowOwned ? 'Remove from collection' : 'Add to collection');
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
    if (q) {
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
  const colors = filteredColors();
  listAll.innerHTML = '';
  emptySearch.hidden = colors.length > 0;
  resultCount.textContent = colors.length < allColors.length
    ? `${colors.length} of ${allColors.length} colors` : '';

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

function findNearestOwnedColor(hex) {
  const ownedIds = getOwned();
  const ownedColors = allColors.filter(c => ownedIds.has(c.id));
  return ownedColors.length ? findNearestColor(hex, ownedColors) : null;
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
  const colors = allColors.filter(c => owned.has(c.id));
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
  colors.forEach(c => grid.appendChild(buildCard(c, owned)));
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
    arr.forEach(c => grid.appendChild(buildCard(c, owned)));
    frag.appendChild(grid);
  });

  listMine.appendChild(frag);
}

function toggleMineEmpty() {
  const hasCards = listMine.querySelector('.color-card') !== null;
  emptyMine.style.display = hasCards ? 'none' : 'block';
  // toolbar always visible so import works on an empty collection
  document.querySelector('.sort-pills').style.opacity = hasCards ? '1' : '0.4';
}

/* ── Render Shopping List ─────────────────────────────────── */
function renderShoppingList() {
  const cart = getCart();
  const colors = allColors.filter(c => cart.has(c.id));
  listShopping.innerHTML = '';

  const count = colors.length;
  shoppingCountLabel.textContent = count === 0 ? '0 items' : `${count} item${count !== 1 ? 's' : ''}`;

  if (count === 0) { toggleShoppingEmpty(); return; }

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
      list.forEach(c => grid.appendChild(buildCard(c, owned)));
      frag.appendChild(grid);
    });
  listShopping.appendChild(frag);
  toggleShoppingEmpty();
}

function toggleShoppingEmpty() {
  const hasCards = listShopping.querySelector('.color-card') !== null;
  emptyShopping.style.display = hasCards ? 'none' : 'block';
}

/* ── Count badges ─────────────────────────────────────────── */
function updateBadges() {
  const size     = getOwned().size;
  const cartSize = getCart().size;
  countAll.textContent      = allColors.length;
  countMine.textContent     = size;
  countPalettes.textContent = PALETTE_TEMPLATES.length;
  countCart.textContent     = cartSize;
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
    if (activeTab === 'mine') renderMine();
    if (activeTab === 'palettes') renderPalettes();
    if (activeTab === 'shopping') renderShoppingList();
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
document.querySelectorAll('#mine-toolbar .sort-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.sort === mineSort) return;
    document.querySelectorAll('#mine-toolbar .sort-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    mineSort = btn.dataset.sort;
    renderMine();
  });
});

/* ── Search ───────────────────────────────────────────────── */
searchInput.addEventListener('input', e => {
  searchQuery = e.target.value;
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

/* ── Toast ────────────────────────────────────────────────── */
function showToast(msg, isError = false) {
  document.getElementById('toast')?.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = isError ? 'toast toast-error' : 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
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
  if (!confirm(`Remove all ${owned.size} colors from your collection?`)) return;
  saveOwned(new Set());
  updateBadges();
  if (activeTab === 'mine') renderMine();
  showToast('Collection cleared.');
});

/* ── Shopping list actions ────────────────────────────────── */
document.getElementById('btn-print-cart').addEventListener('click', () => {
  window.print();
});

document.getElementById('btn-clear-cart').addEventListener('click', () => {
  const cart = getCart();
  if (cart.size === 0) { showToast('Shopping list is already empty.', true); return; }
  if (!confirm(`Remove all ${cart.size} color${cart.size !== 1 ? 's' : ''} from your shopping list?`)) return;
  saveCart(new Set());
  updateBadges();
  if (activeTab === 'shopping') renderShoppingList();
  showToast('Shopping list cleared.');
});

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
  })
  .catch(err => {
    listAll.innerHTML = `
      <p class="empty-msg">
        Could not load colors.json (${err.message}).<br>
        Make sure the site is served from a web server, not opened as a local file.
      </p>`;
  });
