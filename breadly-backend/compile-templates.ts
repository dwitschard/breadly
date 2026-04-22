import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import mjml2html from 'mjml';

const currentDir = dirname(fileURLToPath(import.meta.url));
const templatesDir = resolve(currentDir, 'config', 'templates');
const outputDir = resolve(currentDir, 'dist', 'templates');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const files = readdirSync(templatesDir).filter((f) => f.endsWith('.mjml'));

for (const file of files) {
  const inputPath = resolve(templatesDir, file);
  const outputPath = resolve(outputDir, file.replace('.mjml', '.html'));
  const mjmlContent = readFileSync(inputPath, 'utf-8');
  const result = await mjml2html(mjmlContent);

  if (result.errors && result.errors.length > 0) {
    console.error(`MJML errors in ${file}:`, result.errors);
    process.exit(1);
  }

  writeFileSync(outputPath, result.html, 'utf-8');
  console.log(`Compiled: ${file} -> ${basename(outputPath)}`);
}

console.log(`Done. ${files.length} templates compiled.`);
