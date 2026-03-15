import { ResolvedContact, ResolveContactResult } from '../../../types/Agent';

const PEOPLE_BASE = 'https://people.googleapis.com/v1';
const READ_MASK = 'names,emailAddresses';

const HIGH_CONFIDENCE = 0.82;
const LOW_CONFIDENCE = 0.55;
const GAP_THRESHOLD = 0.08;

// ─── Normalisation ───────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s@.]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(Boolean);
}

// ─── Distance / similarity primitives ────────────────────────────────────────

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
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
  return 1 - editDistance(a, b) / Math.max(a.length, b.length, 1);
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function consonantSkeleton(str: string): string {
  return normalize(str).replace(/[aeiou\s@.0-9]/g, '');
}

function soundex(str: string): string {
  const s = normalize(str).replace(/[\s@.]/g, '');
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
  const qTokens = tokenize(a);
  const nTokens = tokenize(b);
  if (qTokens.length === 0 || nTokens.length === 0) return 0;
  let total = 0;
  for (const qt of qTokens) {
    let best = 0;
    const qCode = soundex(qt);
    const qSkel = consonantSkeleton(qt);
    for (const nt of nTokens) {
      best = Math.max(
        best,
        (qCode === soundex(nt) ? 1 : 0) * 0.6 + editSimilarity(qSkel, consonantSkeleton(nt)) * 0.4,
      );
    }
    total += best;
  }
  return total / qTokens.length;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

function looksLikeEmail(value: string): boolean {
  return value.includes('@');
}

/**
 * Score a candidate when the query is a name.
 * Combines edit-distance, token overlap, phonetic, and skeleton signals
 * into a single pass (no separate "rescue" phase).
 */
function scoreName(query: string, candidate: ResolvedContact): number {
  const nq = normalize(query);
  const nc = normalize(candidate.name);
  const qTokens = tokenize(query);
  const nTokens = tokenize(candidate.name);

  if (nq === nc) return 1;

  let score = 0;

  // Prefix match
  if (nc.startsWith(nq) || nq.startsWith(nc)) {
    score = Math.max(score, 0.85);
  }

  // Token overlap (Jaccard)
  score = Math.max(score, tokenOverlap(qTokens, nTokens) * 0.8);

  // Full-string edit similarity
  score = Math.max(score, editSimilarity(nq, nc) * 0.75);

  // Best per-token edit similarity
  for (const qt of qTokens) {
    for (const nt of nTokens) {
      score = Math.max(score, editSimilarity(qt, nt) * 0.7);
    }
  }

  // Phonetic / consonant skeleton (replaces the old rescue pass)
  score = Math.max(score, phoneticSimilarity(query, candidate.name) * 0.7);
  const qSkel = consonantSkeleton(query);
  const nSkel = consonantSkeleton(candidate.name);
  if (qSkel.length > 0 && nSkel.length > 0) {
    score = Math.max(score, editSimilarity(qSkel, nSkel) * 0.65);
  }

  // Email local-part as weak fallback
  const emailLocal = normalize(candidate.email.split('@')[0]);
  score = Math.max(score, editSimilarity(nq, emailLocal) * 0.5);

  return score;
}

/**
 * Score a candidate when the query is an email (possibly misspelled from STT).
 * Heavily weights email-to-email similarity, with domain matching as a bonus.
 */
function scoreEmail(query: string, candidate: ResolvedContact): number {
  const nq = normalize(query);
  const nc = normalize(candidate.email);

  if (nq === nc) return 1;

  const [qLocal, qDomain] = nq.split('@');
  const [cLocal, cDomain] = nc.split('@');

  let score = 0;

  // Full email edit similarity
  score = Math.max(score, editSimilarity(nq, nc) * 0.9);

  // Local-part similarity with domain bonus
  const localSim = editSimilarity(qLocal, cLocal);
  const domainMatch = qDomain === cDomain;
  if (domainMatch) {
    score = Math.max(score, localSim * 0.95);
  } else {
    // Different domain — still possible (STT may mangle domain too),
    // but penalise more heavily
    const domainSim = editSimilarity(qDomain, cDomain);
    score = Math.max(score, localSim * 0.6 * domainSim);
  }

  // Consonant skeleton on local part (handles vowel-swapped STT errors)
  const qSkel = consonantSkeleton(qLocal);
  const cSkel = consonantSkeleton(cLocal);
  if (qSkel.length > 0 && cSkel.length > 0 && domainMatch) {
    score = Math.max(score, editSimilarity(qSkel, cSkel) * 0.85);
  }

  // Also try name scoring as a fallback — the user might have said "ace"
  // when they meant the email for someone named Ace
  score = Math.max(score, scoreName(qLocal, candidate) * 0.5);

  return score;
}

function scoreCandidate(query: string, candidate: ResolvedContact): number {
  return looksLikeEmail(query)
    ? scoreEmail(query, candidate)
    : scoreName(query, candidate);
}

// ─── People API helpers ──────────────────────────────────────────────────────

async function warmupCache(accessToken: string): Promise<void> {
  await Promise.all([
    fetch(`${PEOPLE_BASE}/people:searchContacts?query=&readMask=${READ_MASK}&pageSize=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${PEOPLE_BASE}/otherContacts:search?query=&readMask=${READ_MASK}&pageSize=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);
}

async function searchContacts(accessToken: string, query: string): Promise<any[]> {
  const url = `${PEOPLE_BASE}/people:searchContacts?query=${encodeURIComponent(query)}&readMask=${READ_MASK}&pageSize=30`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`searchContacts failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as any;
  return (data.results ?? []).map((r: any) => r.person);
}

async function searchOtherContacts(accessToken: string, query: string): Promise<any[]> {
  const url = `${PEOPLE_BASE}/otherContacts:search?query=${encodeURIComponent(query)}&readMask=${READ_MASK}&pageSize=30`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    console.log(`[resolveContact] otherContacts search failed (non-fatal): ${res.status}`);
    return [];
  }
  const data = (await res.json()) as any;
  return (data.results ?? []).map((r: any) => r.person);
}

// ─── Core ────────────────────────────────────────────────────────────────────

function deduplicatePeople(people: any[]): ResolvedContact[] {
  const seen = new Set<string>();
  const contacts: ResolvedContact[] = [];
  for (const person of people) {
    const email: string | undefined = person.emailAddresses?.[0]?.value;
    const name: string = person.names?.[0]?.displayName ?? '(no name)';
    if (email && !seen.has(email)) {
      seen.add(email);
      contacts.push({ name, email });
    }
  }
  return contacts;
}

function rankCandidates(
  query: string,
  candidates: ResolvedContact[],
): Array<ResolvedContact & { score: number }> {
  return candidates
    .map(c => ({ ...c, score: scoreCandidate(query, c) }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
}

export async function resolveContact(value: string, accessToken: string): Promise<ResolveContactResult> {
  const query = value.trim();
  console.log(`[resolveContact] resolving "${query}" (${looksLikeEmail(query) ? 'email' : 'name'} mode)`);

  await warmupCache(accessToken);

  const searchTerm = looksLikeEmail(query) ? query.split('@')[0] : query;

  const [myContacts, otherContacts] = await Promise.all([
    searchContacts(accessToken, searchTerm),
    searchOtherContacts(accessToken, searchTerm),
  ]);

  console.log(`[resolveContact] myContacts=${myContacts.length}  otherContacts=${otherContacts.length}`);

  const candidates = deduplicatePeople([...myContacts, ...otherContacts]);
  console.log(`[resolveContact] deduplicated candidates: ${candidates.length}`);

  if (candidates.length === 0) {
    return { status: 'no_match', allMatches: [], suggestions: [], reason: 'no_candidates_found' };
  }

  const ranked = rankCandidates(query, candidates);

  for (const c of ranked) {
    console.log(`[resolveContact]   score=${c.score.toFixed(3)}  name="${c.name}"  email=${c.email}`);
  }

  const top = ranked[0];
  const second = ranked[1];
  const allMatches = ranked.map(({ name, email, score }) => ({ name, email, score }));
  const suggestions = allMatches.slice(0, 3);

  if (top.score >= HIGH_CONFIDENCE) {
    const gap = top.score - (second?.score ?? 0);
    if (gap >= GAP_THRESHOLD) {
      console.log(`[resolveContact] resolved: "${top.name}" <${top.email}> score=${top.score.toFixed(3)} gap=${gap.toFixed(3)}`);
      return { status: 'resolved', resolvedEmail: top.email, allMatches, suggestions, reason: 'high_confidence' };
    }
    return { status: 'resolved', resolvedEmail: top.email, allMatches, suggestions, reason: 'multiple_close_matches' };
  }

  if (top.score >= LOW_CONFIDENCE) {
    return { status: 'resolved', resolvedEmail: top.email, allMatches, suggestions, reason: 'moderate_confidence' };
  }

  return { status: 'no_match', allMatches, suggestions, reason: 'low_confidence' };
}
