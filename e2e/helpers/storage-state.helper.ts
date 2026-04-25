import fs from 'node:fs';
import path from 'node:path';

export interface StorageStateEntry {
  name: string;
  value: string;
}

export interface StorageState {
  cookies: never[];
  origins: { origin: string; localStorage: StorageStateEntry[] }[];
}

export function writeStorageState(
  storageState: StorageState,
  filePath: string,
): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(storageState, null, 2));
}
