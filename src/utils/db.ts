export interface DbFile {
  name: string;
  path: string;
  description: string;
}

const dbRegistry: DbFile[] = [
  { name: 'students', path: '/db/students.json', description: 'Student records with personal info, enrollment, GPA, and status' },
];

/**
 * Returns the list of available database files.
 */
export function getDbList(): DbFile[] {
  return dbRegistry;
}

/**
 * Fetches and parses a JSON database file by name.
 */
export async function fetchDb(name: string): Promise<unknown[]> {
  const entry = dbRegistry.find((d) => d.name === name);
  if (!entry) {
    throw new Error(`Database "${name}" not found. Available: ${dbRegistry.map((d) => d.name).join(', ')}`);
  }
  const res = await fetch(entry.path);
  if (!res.ok) {
    throw new Error(`Failed to load ${entry.path} (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * Fetches all registered databases and returns a map of name → data.
 */
export async function fetchAllDbs(): Promise<Record<string, unknown[]>> {
  const results: Record<string, unknown[]> = {};
  for (const entry of dbRegistry) {
    try {
      results[entry.name] = await fetchDb(entry.name);
    } catch (err) {
      console.warn(`Could not load "${entry.name}" database:`, err);
      results[entry.name] = [];
    }
  }
  return results;
}