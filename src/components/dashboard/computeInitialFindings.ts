/**
 * computeInitialFindings — derives the 1–2 personalised "Findings" lines shown
 * on the locked ScoreSection right panel. The strip is the single highest-
 * leverage trust element on the dashboard; any drift in tone, precision, or
 * specificity here directly affects conversion. Hard discipline applies:
 *
 *   - Never render a number, percentage, decimal, or unit.
 *   - Never use disallowed appearance, certainty, or heredity terms.
 *   - Never use conversational verbs inside finding phrases.
 *   - Never start a phrase with automated-system branding.
 *   - All output strings come from a finite enumerated list — no template
 *     interpolation, no string concatenation with raw data.
 *   - Max 2 lines, max 38 characters per line.
 *
 * Tone target: aesthetic report notation.
 *
 * Input shape mirrors the live `result` object passed to ResultDashboard;
 * unknown / missing fields degrade silently — the helper always returns a
 * length-0..2 array.
 */

export type FindingTone = 'neutral' | 'refinement';

export interface InitialFinding {
  /** Short aesthetic phrase. ≤ 38 chars. */
  label: string;
  /** Cyan accent for "neutral" facts; amber for "refinement" notes. */
  tone: FindingTone;
}

interface FindingsInput {
  analysis?: { strengths?: string[]; weaknesses?: string[] };
  metrics?: Record<string, string | number> | null;
  breakdown?: Record<string, number | undefined> | null;
}

// ── Enumerated phrase tables ─────────────────────────────────────────────────
//
// Each entry has a regex matching the source string family and a short aesthetic
// phrase. Phrases are intentionally generic so the helper never leaks private
// numerical data into UI text.

const STRENGTH_PHRASES: Array<{ match: RegExp; label: string }> = [
  { match: /\bsymmetr/i, label: 'Bilateral symmetry within range' },
  { match: /\bjaw|mandib|gonial\b/i, label: 'Jaw structure within range' },
  { match: /\bcanthal\b/i, label: 'Canthal tilt within range' },
  { match: /\beye spacing|interocular|intercanthal\b/i, label: 'Eye spacing within range' },
  { match: /\beye(?!brow)/i, label: 'Periorbital balance within range' },
  { match: /\beyebrow|brow\b/i, label: 'Brow framing within range' },
  { match: /\bmidface\b/i, label: 'Midface proportion balanced' },
  { match: /\bfwhr|width-to-height/i, label: 'Width-to-height within range' },
  { match: /\bcheek|malar|zygomatic\b/i, label: 'Cheekbone projection balanced' },
  { match: /\bskin|complexion|texture\b/i, label: 'Skin texture within range' },
  { match: /\bnose|nasal\b/i, label: 'Nasal proportion balanced' },
  { match: /\blip|mouth\b/i, label: 'Lower-mouth balance within range' },
  { match: /\bchin|profile\b/i, label: 'Chin projection balanced' },
  { match: /\bforehead|upper third\b/i, label: 'Upper third within range' },
  { match: /\bgolden ratio|phi\b/i, label: 'Proportional adherence balanced' },
  { match: /\bthird/i, label: 'Facial thirds in balance' },
  { match: /\bharmony|composition|balance/i, label: 'Composition balance within range' }
];

const WEAKNESS_PHRASES: Array<{ match: RegExp; label: string }> = [
  { match: /\basymmetr/i, label: 'Slight left-side asymmetry' },
  { match: /\bsymmetr/i, label: 'Slight bilateral variance' },
  { match: /\bgonial|jaw angle|jaw-to-cheek|jawline\b/i, label: 'Jaw angle below mean range' },
  { match: /\bjaw|mandib/i, label: 'Jaw projection below range' },
  { match: /\bcanthal\b/i, label: 'Canthal tilt below range' },
  { match: /\beye spacing|interocular|intercanthal\b/i, label: 'Eye spacing outside range' },
  {
    match: /\bmidface elong|elongated mid|long mid|long nose bridge/i,
    label: 'Midface proportion extended'
  },
  { match: /\bmidface compress|compressed mid/i, label: 'Midface proportion compressed' },
  {
    match: /\blower face|lower facial third|lower third/i,
    label: 'Lower facial third slightly extended'
  },
  { match: /\bupper third|forehead/i, label: 'Upper third proportion extended' },
  { match: /\bfacial thirds|three thirds/i, label: 'Facial thirds slightly uneven' },
  { match: /\bfwhr|width-to-height/i, label: 'Width-to-height below range' },
  { match: /\bcheek|malar|zygomatic/i, label: 'Cheekbone projection below range' },
  { match: /\bphiltrum|philtral/i, label: 'Philtrum length above range' },
  { match: /\bnose|nasal/i, label: 'Nasal proportion outside range' },
  {
    match: /\blip thickness|lip fullness|upper-to-lower lip/i,
    label: 'Lip thickness outside range'
  },
  { match: /\blip|mouth/i, label: 'Mouth proportion outside range' },
  { match: /\bchin/i, label: 'Chin projection below range' },
  { match: /\bskin|texture|acne|complexion/i, label: 'Skin texture outside range' },
  { match: /\bdimorphism|masculin|feminin/i, label: 'Dimorphism signal below range' },
  { match: /\bgolden ratio|phi/i, label: 'Proportional adherence outside range' }
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_CHARS = 38;

function pickStrengthPhrase(source: string): string | null {
  for (const { match, label } of STRENGTH_PHRASES) {
    if (match.test(source) && label.length <= MAX_CHARS) return label;
  }
  return null;
}

function pickWeaknessPhrase(source: string): string | null {
  for (const { match, label } of WEAKNESS_PHRASES) {
    if (match.test(source) && label.length <= MAX_CHARS) return label;
  }
  return null;
}

// Sentinel fallback used only when nothing else matches — keeps the strip from
// rendering empty for incomplete scans, while still passing every guardrail.
const NEUTRAL_FALLBACK = 'Composition balance within range';
const REFINEMENT_FALLBACK = 'One area outside reference range';

// ── Main export ──────────────────────────────────────────────────────────────

export function computeInitialFindings(input: FindingsInput): InitialFinding[] {
  const out: InitialFinding[] = [];
  const used = new Set<string>();

  // 1) Try to derive a neutral finding from the user's strongest strength.
  const firstStrength = input.analysis?.strengths?.[0];
  if (typeof firstStrength === 'string' && firstStrength.length > 0) {
    const phrase = pickStrengthPhrase(firstStrength);
    if (phrase) {
      out.push({ label: phrase, tone: 'neutral' });
      used.add(phrase);
    }
  }

  // 2) Try to derive a refinement finding. Prefer asymmetry when the metric
  //    indicates it; otherwise fall back to the user's first weakness.
  let refinement: string | null = null;
  const sym = input.metrics?.facialSymmetry;
  const symNum =
    typeof sym === 'number'
      ? sym
      : typeof sym === 'string'
        ? parseFloat(sym.replace('%', ''))
        : NaN;
  // Symmetry comes through as either 0–1 or 0–100; normalise.
  const symPct = !isNaN(symNum) ? (symNum > 1 ? symNum : symNum * 100) : NaN;
  if (!isNaN(symPct) && symPct < 95) {
    refinement = 'Slight left-side asymmetry';
  }
  if (!refinement) {
    const firstWeakness = input.analysis?.weaknesses?.[0];
    if (typeof firstWeakness === 'string' && firstWeakness.length > 0) {
      refinement = pickWeaknessPhrase(firstWeakness);
    }
  }
  if (refinement && !used.has(refinement)) {
    out.push({ label: refinement, tone: 'refinement' });
    used.add(refinement);
  }

  // 3) Pad with sentinel fallbacks if we somehow ended up empty (incomplete
  //    scan data). At most one fallback per tone.
  if (out.length === 0) {
    out.push({ label: NEUTRAL_FALLBACK, tone: 'neutral' });
    out.push({ label: REFINEMENT_FALLBACK, tone: 'refinement' });
  } else if (out.length === 1 && out[0].tone === 'neutral') {
    out.push({ label: REFINEMENT_FALLBACK, tone: 'refinement' });
  }

  // Hard cap: 2 lines.
  return out.slice(0, 2);
}

/**
 * Deterministic 6-character report ID from any user-stable seed (uid + scan
 * timestamp). Used in the archival metadata row to give the report a unique-
 * but-stable identifier without needing a DB column.
 *
 * Avoids characters that read as digits or decimals (no 0/1/I/O) so the ID
 * never visually competes with the score numeral.
 */
const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function computeReportId(seed: string | number | undefined | null): string {
  const s = String(seed ?? '').trim();
  // Simple 32-bit FNV-1a — deterministic, no deps, plenty of entropy for a
  // 6-character non-cryptographic display ID.
  let h = 0x811c9dc5;
  if (s.length === 0) {
    // Fallback to a per-page-load random when no seed is available.
    h = h ^ (Math.floor(Math.random() * 0x7fffffff) | 0);
  } else {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  let n = h >>> 0;
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += ID_ALPHABET[n % ID_ALPHABET.length];
    n = Math.floor(n / ID_ALPHABET.length);
    if (n === 0) n = (h >>> ((i + 1) * 4)) & 0xff;
  }
  return id;
}
