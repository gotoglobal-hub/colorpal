/* ── State ────────────────────────────────────────────────── */
const STORAGE_KEY = 'colors-of-mini-v1';
let allColors     = [];
let activeTab     = 'all';
let activeCompany = 'all';
let activeBrand   = 'all';
let searchQuery   = '';
let mineSort      = 'company'; // 'company' | 'color'

/* ── LocalStorage helpers ─────────────────────────────────── */
function getOwned() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveOwned(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
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
  {
    id: 'complementary',
    title: 'Complementary',
    description: 'Two colors directly opposite each other for high visual contrast.',
    sample: [
      { name: 'Blue', hex: '#3B82F6' },
      { name: 'Orange', hex: '#F59E0B' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'analogous',
    title: 'Analogous',
    description: 'Three colors sitting next to each other for a natural unified palette.',
    sample: [
      { name: 'Green', hex: '#22C55E' },
      { name: 'Lime', hex: '#84CC16' },
      { name: 'Yellow', hex: '#EAB308' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'triadic',
    title: 'Triadic',
    description: 'Three evenly spaced colors for vibrant, high-energy contrast.',
    sample: [
      { name: 'Purple', hex: '#8B5CF6' },
      { name: 'Orange', hex: '#F97316' },
      { name: 'Green', hex: '#22C55E' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'split-complementary',
    title: 'Split Complementary',
    description: 'A base color with the two colors adjacent to its opposite for easier balance.',
    sample: [
      { name: 'Blue', hex: '#2563EB' },
      { name: 'Red-Orange', hex: '#F97316' },
      { name: 'Yellow-Orange', hex: '#F59E0B' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'monochromatic',
    title: 'Monochromatic',
    description: 'Shades and tints of a single base color for a clean, cohesive look.',
    sample: [
      { name: 'Dark Blue', hex: '#1D4ED8' },
      { name: 'Blue', hex: '#3B82F6' },
      { name: 'Light Blue', hex: '#93C5FD' },
    ],
    category: 'Color Theory',
  },
  {
    id: 'high-fantasy',
    title: 'High Fantasy',
    description: 'Saturated primaries, bright purples, magentas, golds, and glowing teals.',
    sample: [
      { name: 'Royal Blue', hex: '#4F46E5' },
      { name: 'Vivid Purple', hex: '#DB2777' },
      { name: 'Gold', hex: '#F59E0B' },
      { name: 'Teal', hex: '#14B8A6' },
    ],
    category: 'Genre',
  },
  {
    id: 'grimdark',
    title: 'Grimdark / Low Fantasy',
    description: 'Desaturated olive drabs, grimy browns, sepia tones, and rusted iron.',
    sample: [
      { name: 'Olive', hex: '#6B7280' },
      { name: 'Brown', hex: '#92400E' },
      { name: 'Rust', hex: '#B45309' },
      { name: 'Dirty Green', hex: '#4B6F44' },
    ],
    category: 'Genre',
  },
  {
    id: 'sci-fi',
    title: 'Sci-Fi / Cyberpunk',
    description: 'Dark greys and blacks paired with neon pinks, cyans, and lime greens.',
    sample: [
      { name: 'Matte Black', hex: '#111827' },
      { name: 'Neon Cyan', hex: '#06B6D4' },
      { name: 'Neon Pink', hex: '#EC4899' },
      { name: 'Lime', hex: '#84CC16' },
    ],
    category: 'Genre',
  },
  {
    id: 'historical-military',
    title: 'Historical Military',
    description: 'Field grey, olive drab, khaki, desert yellow, and realistic leather browns.',
    sample: [
      { name: 'Olive Drab', hex: '#4B5320' },
      { name: 'Khaki', hex: '#A78B56' },
      { name: 'Desert Yellow', hex: '#D4B15F' },
      { name: 'Leather Brown', hex: '#7C4A2F' },
    ],
    category: 'Genre',
  },
];

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
const listAll       = document.getElementById('list-all');
const listMine      = document.getElementById('list-mine');
const paletteList   = document.getElementById('palette-list');
const paletteAnalysis = document.getElementById('palette-analysis');
const missingList   = document.getElementById('missing-list');
const emptySearch   = document.getElementById('empty-search');
const emptyMine     = document.getElementById('empty-mine');
const mineToolbar   = document.getElementById('mine-toolbar');
const countAll      = document.getElementById('count-all');
const countMine     = document.getElementById('count-mine');
const countPalettes = document.getElementById('count-palettes');
const resultCount   = document.getElementById('result-count');
const toolbarAll    = document.getElementById('toolbar-all');
const searchInput   = document.getElementById('search');

/* ── Card builder ─────────────────────────────────────────── */
function buildCard(color, owned) {
  const isOwned   = owned.has(color.id);
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
    <button class="toggle-btn${isOwned ? ' owned' : ''}"
            aria-label="${isOwned ? 'Remove from collection' : 'Add to collection'}">
      ${isOwned ? '✓' : '+'}
    </button>
  `;

  card.querySelector('.toggle-btn').addEventListener('click', () => {
    const nowOwned = toggleOwned(color.id);
    card.classList.toggle('owned', nowOwned);
    const btn = card.querySelector('.toggle-btn');
    btn.classList.toggle('owned', nowOwned);
    btn.textContent = nowOwned ? '✓' : '+';
    btn.setAttribute('aria-label', nowOwned ? 'Remove from collection' : 'Add to collection');
    updateBadges();

    if (activeTab === 'mine' && !nowOwned) {
      card.remove();
      // Remove group header if it has no more cards
      const grid = card.parentElement;
      if (grid && grid.classList.contains('color-list') && grid.children.length === 0) {
        grid.previousElementSibling?.remove(); // remove the h3 header
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
  const frag   = document.createDocumentFragment();
  colors.forEach(c => frag.appendChild(buildCard(c, owned)));
  listAll.innerHTML = '';
  listAll.appendChild(frag);
  emptySearch.hidden = colors.length > 0;
  resultCount.textContent = colors.length < allColors.length
    ? `${colors.length} of ${allColors.length} colors` : '';
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
  PALETTE_TEMPLATES.forEach(palette => paletteList.appendChild(buildPaletteCard(palette)));
  renderPaletteAnalysis();
}

function buildPaletteCard(palette) {
  const card = document.createElement('div');
  card.className = 'palette-card';
  card.innerHTML = `
    <h3>${palette.title}</h3>
    <p>${palette.description}</p>
    <div class="palette-sample">
      ${palette.sample.map(s => `<span class="palette-swatch" title="${s.name}" style="background:${s.hex}"></span>`).join('')}
    </div>
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

/* ── Count badges ─────────────────────────────────────────── */
function updateBadges() {
  const size = getOwned().size;
  countAll.textContent    = allColors.length;
  countMine.textContent   = size;
  countPalettes.textContent = PALETTE_TEMPLATES.length;
  countMine.classList.toggle('owned', size > 0);
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
  });
});

/* ── Mine sort pills ──────────────────────────────────────── */
document.querySelectorAll('.sort-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.sort === mineSort) return;
    document.querySelectorAll('.sort-pill').forEach(b => b.classList.remove('active'));
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
