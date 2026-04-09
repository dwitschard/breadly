import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getVersionInfo, resetVersionCache } from './version.reader.js';

const testDir = join(tmpdir(), 'breadly-version-test');
const versionFilePath = join(testDir, 'version.json');

beforeEach(async () => {
  resetVersionCache();
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  resetVersionCache();
  await rm(versionFilePath, { force: true });
});

describe('getVersionInfo', () => {
  it('returns parsed content when version.json exists with valid JSON', async () => {
    const expected = {
      version: 'abc1234',
      releaseUrl: 'https://github.com/org/repo/releases/tag/backend-abc1234',
    };
    await writeFile(versionFilePath, JSON.stringify(expected));

    const result = await getVersionInfo(versionFilePath);

    expect(result).toEqual(expected);
  });

  it('returns dev fallback when version.json is missing', async () => {
    await rm(versionFilePath, { force: true });

    const result = await getVersionInfo(versionFilePath);

    expect(result).toEqual({ version: 'dev', releaseUrl: '' });
  });

  it('returns dev fallback when version.json contains malformed JSON', async () => {
    await writeFile(versionFilePath, 'not valid json {{{');

    const result = await getVersionInfo(versionFilePath);

    expect(result).toEqual({ version: 'dev', releaseUrl: '' });
  });

  it('returns dev fallback when version.json has wrong shape', async () => {
    await writeFile(versionFilePath, JSON.stringify({ unexpected: 'shape' }));

    const result = await getVersionInfo(versionFilePath);

    expect(result).toEqual({ version: 'dev', releaseUrl: '' });
  });

  it('caches the result across multiple calls', async () => {
    const expected = {
      version: 'def5678',
      releaseUrl: 'https://github.com/org/repo/releases/tag/backend-def5678',
    };
    await writeFile(versionFilePath, JSON.stringify(expected));

    const first = await getVersionInfo(versionFilePath);
    await rm(versionFilePath, { force: true });
    const second = await getVersionInfo(versionFilePath);

    expect(first).toEqual(expected);
    expect(second).toEqual(expected);
  });
});
