#!/usr/bin/env node

/**
 * Render PDFs from HTML print sources using Playwright
 * Generates: omega.pdf, omega-a.pdf in public/pdfs/
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const pdfsDir = join(rootDir, 'public', 'pdfs');

const pdfs = [
  { source: 'omega-print.html', output: 'omega.pdf' },
  { source: 'omega-a-print.html', output: 'omega-a.pdf' },
];

async function renderPDF(sourceFile, outputFile) {
  const sourcePath = join(pdfsDir, sourceFile);
  const outputPath = join(pdfsDir, outputFile);

  if (!existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`Rendering ${sourceFile} -> ${outputFile}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load HTML file directly (file:// protocol)
  const fileUrl = pathToFileURL(sourcePath).href;
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 10000 });

  // Generate PDF
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm',
    },
  });

  await browser.close();
  console.log(`✓ Generated ${outputFile}`);
}

async function main() {
  console.log('Generating PDFs from print sources...\n');

  for (const { source, output } of pdfs) {
    try {
      await renderPDF(source, output);
    } catch (error) {
      console.error(`Error rendering ${source}:`, error);
      process.exit(1);
    }
  }

  console.log('\n✓ All PDFs generated successfully');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

