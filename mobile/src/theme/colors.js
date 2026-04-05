// FLOWRIZ — Black × Green × Gold Palette
export const C = {
  // ── Backgrounds ─────────────────────────────
  bgDeep:   '#080808',   // Deep Black
  bgCard:   '#111111',   // Card Black
  bgCard2:  '#1A1A1A',   // Input Black

  // ── Primary Colors ───────────────────────────
  green:    '#00C853',   // Emerald Green  ★ primary
  greenDark:'#00952E',   // Dark Green
  greenGlow:'#00C85344', // Green glow
  gold:     '#FFB800',   // Premium Gold   ★ accent
  goldDark: '#CC9200',   // Dark Gold
  goldGlow: '#FFB80044', // Gold glow

  // ── Neutrals ────────────────────────────────
  white:    '#FFFFFF',
  textMain: '#F0F0F0',
  textMuted:'#6B7280',
  textDim:  '#374151',
  red:      '#EF4444',

  // ── Borders ─────────────────────────────────
  borderGreen: '#00C85333',
  borderGold:  '#FFB80033',
  borderCard:  '#1F1F1F',
  borderInput: '#2A2A2A',

  // ── Gradients (use as array for LinearGradient) ──
  gradGreen:  ['#00C853', '#00952E'],
  gradGold:   ['#FFD700', '#FFB800'],
  gradDark:   ['#1A1A1A', '#111111'],
};

export const roleColors = {
  buyer:    C.green,
  supplier: C.gold,
  investor: '#60A5FA',
  admin:    C.green,
  owner:    C.gold,
};

export const roleLabels = {
  buyer:    'مشترٍ',
  supplier: 'مورد',
  investor: 'مستثمر',
  admin:    'مدير النظام',
  owner:    'مالك المنصة',
};
