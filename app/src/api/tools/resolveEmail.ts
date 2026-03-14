// resolves the email of a contact
import { ResolveContactResult } from '../../../../types/Agent';

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

export async function resolveEmail(name: string, accessToken: string): Promise<ResolveContactResult | null> {
  await warmupCache(accessToken);
  return null;
}
