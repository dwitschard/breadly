import fs from 'node:fs';

async function globalTeardown(): Promise<void> {
  const authDir = '.auth';
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
}

export default globalTeardown;
