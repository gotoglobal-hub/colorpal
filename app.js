/* ── State ────────────────────────────────────────────────── */
const STORAGE_KEY = 'colors-of-mini-v1';
let allColors     = [];
let activeTab     = 'all';
let activeCompany = 'all';
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
const listAll     = document.getElementById('list-all');
const listMine    = document.getElementById('list-mine');
const emptySearch = document.getElementById('empty-search');
const emptyMine   = document.getElementById('empty-mine');
const mineToolbar = document.getElementById('mine-toolbar');
const countAll    = document.getElementById('count-all');
const countMine   = document.getElementById('count-mine');
const resultCount = document.getElementById('result-count');
const toolbarAll  = document.getElementById('toolbar-all');
const searchInput = document.getElementById('search');

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

/* ── Render All Colors ────────────────────────────────────── */
function filteredColors() {
  const q = searchQuery.toLowerCase();
  return allColors.filter(c => {
    if (activeCompany !== 'all' && c.company !== activeCompany) return false;
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
  emptyMine.style.display   = hasCards ? 'none'  : 'block';
  mineToolbar.style.display = hasCards ? ''      : 'none';
}

/* ── Count badges ─────────────────────────────────────────── */
function updateBadges() {
  const size = getOwned().size;
  countAll.textContent  = allColors.length;
  countMine.textContent = size;
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
document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCompany = btn.dataset.company;
    renderAll();
  });
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
