import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VersionInfo } from '../../app/generated/api';

const DEV_FALLBACK: VersionInfo = { version: 'dev', releaseUrl: '' };

let cached: VersionInfo | undefined;

export async function getVersionInfo(filePath?: string): Promise<VersionInfo> {
  if (cached) {
    return cached;
  }

  const resolvedPath = filePath ?? resolve('dist', 'version.json');

  try {
    const raw = await readFile(resolvedPath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    if (
      typeof parsed === 'object' &&
        parsed !== null &&
        'version' in parsed &&
        'releaseUrl' in parsed
    ) {
      cached = parsed as VersionInfo;
      return cached;
    }

    cached = DEV_FALLBACK;
    return cached;
  } catch {
    cached = DEV_FALLBACK;
    return cached;
  }
}

export function resetVersionCache(): void {
  cached = undefined;
}
