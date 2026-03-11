const PEOPLE_BASE = 'https://people.googleapis.com/v1';
const READ_MASK = 'names,emailAddresses';

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
  const data = await res.json();
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
  const data = await res.json();
  return (data.results ?? []).map((r: any) => r.person);
}

export type ResolvedContact = {
  name: string;
  email: string;
};

export type ResolveContactResult = {
  resolvedEmail: string;
  allMatches: ResolvedContact[];
};

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
  const allMatches: ResolvedContact[] = [];
  for (const person of [...myContacts, ...otherContacts]) {
    const email = person.emailAddresses?.[0]?.value;
    const displayName = person.names?.[0]?.displayName ?? '(no name)';
    if (email && !seen.has(email)) {
      seen.add(email);
      allMatches.push({ name: displayName, email });
    }
  }

  console.log(`[resolveContact] all candidates (${allMatches.length}):`);
  for (const c of allMatches) {
    console.log(`  name="${c.name}"  email=${c.email}`);
  }

  if (allMatches.length === 0) {
    console.log(`[resolveContact] no match found for "${query}"`);
    throw new Error(`No contact found for "${name}"`);
  }

  const best = allMatches[0];
  console.log(`[resolveContact] selected: "${best.name}" → ${best.email}`);

  return { resolvedEmail: best.email, allMatches };
}
