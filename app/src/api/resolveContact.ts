import { ResolvedContact, ResolveContactResult } from '../../../types/Agent';

const PEOPLE_BASE = 'https://people.googleapis.com/v1';
const READ_MASK = 'names,emailAddresses';

// ─── Thresholds ──────────────────────────────────────────────────────────────
const HIGH_CONFIDENCE = 0.82;
const LOW_CONFIDENCE = 0.55;
const GAP_THRESHOLD = 0.08;
const RESCUE_HIGH = 0.72;
const RESCUE_PLAUSIBLE = 0.45;

// ─── Normalisation helpers ────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(Boolean);
}

// Levenshtein edit distance
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function editSimilarity(a: string, b: string): number {
  if (!a && !b) return 1;
  const dist = editDistance(a, b);
  return 1 - dist / Math.max(a.length, b.length, 1);
}

// Token overlap ratio (Jaccard)
function tokenOverlap(queryTokens: string[], nameTokens: string[]): number {
  if (queryTokens.length === 0 && nameTokens.length === 0) return 1;
  const q = new Set(queryTokens);
  const n = new Set(nameTokens);
  let intersection = 0;
  for (const t of q) if (n.has(t)) intersection++;
  const union = new Set([...q, ...n]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Rescue-phase helpers ─────────────────────────────────────────────────────

/** Strip all vowels to get a consonant skeleton: "yaying" -> "yng" */
function consonantSkeleton(str: string): string {
  return normalize(str).replace(/[aeiou]/g, '');
}

/**
 * Simplistic Soundex implementation.
 * Groups consonants by phonetic similarity so "Yeyong" and "Yaying" share a code.
 */
function soundex(str: string): string {
  const s = normalize(str).replace(/\s/g, '');
  if (!s) return '';
  const map: Record<string, string> = {
    b: '1', f: '1', p: '1', v: '1',
    c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
    d: '3', t: '3',
    l: '4',
    m: '5', n: '5',
    r: '6',
  };
  const first = s[0].toUpperCase();
  let code = first;
  let prev = map[s[0]] ?? '0';
  for (let i = 1; i < s.length && code.length < 4; i++) {
    const c = map[s[i]] ?? '0';
    if (c !== '0' && c !== prev) code += c;
    prev = c;
  }
  return code.padEnd(4, '0');
}

function phoneticSimilarity(a: string, b: string): number {
  // Compare each token in the query against each token in the candidate name
  const qTokens = tokenize(a);
  const nTokens = tokenize(b);
  if (qTokens.length === 0 || nTokens.length === 0) return 0;
  let totalScore = 0;
  for (const qt of qTokens) {
    let best = 0;
    const qCode = soundex(qt);
    const qSkel = consonantSkeleton(qt);
    for (const nt of nTokens) {
      const nCode = soundex(nt);
      const nSkel = consonantSkeleton(nt);
      const codeMatch = qCode === nCode ? 1 : 0;
      const skelSim = editSimilarity(qSkel, nSkel);
      best = Math.max(best, codeMatch * 0.6 + skelSim * 0.4);
    }
    totalScore += best;
  }
  return totalScore / qTokens.length;
}

// ─── Primary scoring ─────────────────────────────────────────────────────────

function scorePrimary(query: string, candidate: ResolvedContact): number {
  const normQuery = normalize(query);
  const normName = normalize(candidate.name);
  const emailLocal = normalize(candidate.email.split('@')[0]);
  const qTokens = tokenize(query);
  const nTokens = tokenize(candidate.name);

  let score = 0;

  // Exact name match
  if (normQuery === normName) return 1;

  // Prefix match (whole query is a prefix of name or vice versa)
  if (normName.startsWith(normQuery) || normQuery.startsWith(normName)) {
    score = Math.max(score, 0.85);
  }

  // Token overlap (Jaccard)
  score = Math.max(score, tokenOverlap(qTokens, nTokens) * 0.8);

  // Edit distance similarity on full normalized strings
  score = Math.max(score, editSimilarity(normQuery, normName) * 0.75);

  // Best token-level edit similarity (e.g. single token query vs each name token)
  for (const qt of qTokens) {
    for (const nt of nTokens) {
      score = Math.max(score, editSimilarity(qt, nt) * 0.7);
    }
  }

  // Email local-part as weak fallback
  score = Math.max(score, editSimilarity(normQuery, emailLocal) * 0.5);

  return score;
}

function scoreRescue(query: string, candidate: ResolvedContact): number {
  let score = 0;

  // Phonetic / skeleton signals
  score = Math.max(score, phoneticSimilarity(query, candidate.name));

  // Relaxed edit distance on consonant skeletons
  const qSkel = consonantSkeleton(query);
  const nSkel = consonantSkeleton(candidate.name);
  if (qSkel.length > 0 && nSkel.length > 0) {
    score = Math.max(score, editSimilarity(qSkel, nSkel) * 0.9);
  }

  // Also allow the primary signals at a lower weight as a floor
  score = Math.max(score, scorePrimary(query, candidate) * 0.9);

  return score;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function warmupCache(accessToken: string): Promise<void> {
  // Required by the People API before any searchContacts call to ensure cache freshness
  await fetch(`${PEOPLE_BASE}/people:searchContacts?query=&readMask=${READ_MASK}&pageSize=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await fetch(`${PEOPLE_BASE}/otherContacts:search?query=&readMask=${READ_MASK}&pageSize=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function searchContacts(accessToken: string, query: string): Promise<any[]> {
  const url = `${PEOPLE_BASE}/people:searchContacts?query=${encodeURIComponent(query)}&readMask=${READ_MASK}&pageSize=30`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`searchContacts failed: ${res.status} ${err}`);
  }
  const data = await res.json() as any;
  return (data.results ?? []).map((r: any) => r.person);
}

async function searchOtherContacts(accessToken: string, query: string): Promise<any[]> {
  const url = `${PEOPLE_BASE}/otherContacts:search?query=${encodeURIComponent(query)}&readMask=${READ_MASK}&pageSize=30`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.text();
    console.log(`[resolveContact] otherContacts search failed (non-fatal): ${res.status} ${err}`);
    return [];
  }
  const data = await res.json() as any;
  return (data.results ?? []).map((r: any) => r.person);
}

// ─── Rank helpers ─────────────────────────────────────────────────────────────

function rankCandidates(
  query: string,
  candidates: ResolvedContact[],
  scoreFn: (q: string, c: ResolvedContact) => number
): Array<ResolvedContact & { score: number }> {
  return candidates
    .map(c => ({ ...c, score: scoreFn(query, c) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function resolveContact(name: string, accessToken: string): Promise<ResolveContactResult> {
  const query = name.trim();
  console.log(`[resolveContact] resolving contact for "${query}"`);

  await warmupCache(accessToken);

  const [myContacts, otherContacts] = await Promise.all([
    searchContacts(accessToken, query),
    searchOtherContacts(accessToken, query),
  ]);

  console.log(`[resolveContact] myContacts=${myContacts.length}  otherContacts=${otherContacts.length}`);

  // Merge, deduplicate by email
  const seen = new Set<string>();
  const candidates: ResolvedContact[] = [];
  for (const person of [...myContacts, ...otherContacts]) {
    const email = person.emailAddresses?.[0]?.value;
    const displayName = person.names?.[0]?.displayName ?? '(no name)';
    if (email && !seen.has(email)) {
      seen.add(email);
      candidates.push({ name: displayName, email });
    }
  }

  console.log(`[resolveContact] total deduplicated candidates: ${candidates.length}`);

  // ── Primary pass ─────────────────────────────────────────────────────────
  const ranked = rankCandidates(query, candidates, scorePrimary);

  for (const c of ranked) {
    console.log(`[resolveContact] primary score=${c.score.toFixed(3)}  name="${c.name}"  email=${c.email}`);
  }

  const top = ranked[0];
  const second = ranked[1];
  const suggestions = ranked.slice(0, 3).map(({ name: n, email, score }) => ({ name: n, email, score }));

  if (top && top.score >= HIGH_CONFIDENCE) {
    const gap = top.score - (second?.score ?? 0);
    if (gap >= GAP_THRESHOLD) {
      console.log(`[resolveContact] resolved (primary): "${top.name}" score=${top.score.toFixed(3)} gap=${gap.toFixed(3)}`);
      return {
        status: 'resolved',
        resolvedEmail: top.email,
        allMatches: ranked.map(({ name: n, email, score }) => ({ name: n, email, score })),
        suggestions,
        reason: 'resolved_via_primary',
      };
    }
    console.log(`[resolveContact] ambiguous (primary): top score sufficient but gap too small`);
    return {
      status: 'ambiguous',
      allMatches: ranked.map(({ name: n, email, score }) => ({ name: n, email, score })),
      suggestions,
      reason: 'ambiguous_primary_close_scores',
    };
  }

  // ── Rescue pass (triggered when primary pass is empty or low confidence) ──
  if (candidates.length > 0) {
    console.log(`[resolveContact] primary confidence low (top=${top?.score.toFixed(3) ?? 'none'}), running rescue pass`);
    const rescueRanked = rankCandidates(query, candidates, scoreRescue);

    for (const c of rescueRanked) {
      console.log(`[resolveContact] rescue score=${c.score.toFixed(3)}  name="${c.name}"  email=${c.email}`);
    }

    const rTop = rescueRanked[0];
    const rSecond = rescueRanked[1];
    const rescueSuggestions = rescueRanked.slice(0, 3).map(({ name: n, email, score }) => ({ name: n, email, score }));
    const allMatchesRescue = rescueRanked.map(({ name: n, email, score }) => ({ name: n, email, score }));

    if (rTop.score >= RESCUE_HIGH) {
      const gap = rTop.score - (rSecond?.score ?? 0);
      if (gap >= GAP_THRESHOLD) {
        console.log(`[resolveContact] resolved (rescue): "${rTop.name}" score=${rTop.score.toFixed(3)}`);
        return {
          status: 'resolved',
          resolvedEmail: rTop.email,
          allMatches: allMatchesRescue,
          suggestions: rescueSuggestions,
          reason: 'resolved_via_rescue_phonetic',
        };
      }
    }

    if (rTop.score >= RESCUE_PLAUSIBLE) {
      console.log(`[resolveContact] ambiguous (rescue): top="${rTop.name}" score=${rTop.score.toFixed(3)}`);
      return {
        status: 'ambiguous',
        allMatches: allMatchesRescue,
        suggestions: rescueSuggestions,
        reason: 'ambiguous_rescue_plausible',
      };
    }
  }

  console.log(`[resolveContact] no confident match after rescue for "${query}"`);
  return {
    status: 'no_match',
    allMatches: [],
    suggestions: [],
    reason: 'no_confident_match_after_rescue',
  };
}
