export async function resolveContact(name: string, accessToken: string): Promise<string> {
  console.log(`[resolveContact] resolving contact for "${name}"`);
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=1000',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`People API failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const connections: any[] = data.connections ?? [];
  console.log(`[resolveContact] query="${name}" total_contacts=${connections.length}`);

  const query = name.toLowerCase();

  const match = connections.find((person) => {
    const names: any[] = person.names ?? [];
    return names.some(
      (n) =>
        n.displayName?.toLowerCase().includes(query) ||
        n.givenName?.toLowerCase().includes(query) ||
        n.familyName?.toLowerCase().includes(query)
    );
  });

  if (!match) {
    console.log(`[resolveContact] no match found for "${name}"`);
    throw new Error(`No contact found for "${name}"`);
  }

  const email = match?.emailAddresses?.[0]?.value;
  const displayName = match?.names?.[0]?.displayName;
  console.log(`[resolveContact] matched "${displayName}" → ${email}`);

  if (!email) {
    console.log(`[resolveContact] contact "${displayName}" has no email address`);
    throw new Error(`Contact "${displayName}" has no email address`);
  }

  return email;
}
