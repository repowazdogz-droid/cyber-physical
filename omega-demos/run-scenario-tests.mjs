#!/usr/bin/env node
/**
 * Run omega-demos scenario test runner in a headless browser and print results.
 * Usage: from repo root: node omega-demos/run-scenario-tests.mjs
 * Requires: playwright (root)
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import path from 'path';
import http from 'http';
import fs from 'fs';

const require = createRequire(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(ROOT, '.playwright-browsers');
}
const DEMOS_DIR = __dirname;
const PORT = 3751;
const BASE = `http://127.0.0.1:${PORT}`;

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function createStaticServer(dir) {
  return http.createServer((req, res) => {
    const url = req.url === '/' ? '/test-scenarios.html' : req.url;
    const file = path.join(dir, url.split('?')[0]);
    if (!file.startsWith(dir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(err.code === 'ENOENT' ? 404 : 500);
        res.end();
        return;
      }
      const ext = path.extname(file);
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      res.writeHead(200);
      res.end(data);
    });
  });
}

function waitForPort(ms = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(BASE + '/test-scenarios.html', (r) => {
        r.resume();
        if (r.statusCode === 200) return resolve();
        if (Date.now() - start > ms) return reject(new Error('timeout'));
        setTimeout(tick, 200);
      }).on('error', () => {
        if (Date.now() - start > ms) return reject(new Error('timeout'));
        setTimeout(tick, 200);
      });
    };
    tick();
  });
}

async function main() {
  const server = createStaticServer(DEMOS_DIR);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve();
    });
  });
  let serverClosed = false;
  const closeServer = () => {
    if (serverClosed) return;
    serverClosed = true;
    server.close();
  };

  server.on('error', (err) => {
    console.error('Server error:', err);
    closeServer();
    process.exit(1);
  });

  try {
    await waitForPort();
  } catch (e) {
    console.error('Server did not become ready:', e.message);
    closeServer();
    process.exit(1);
  }

  let exitCode = 0;
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(BASE + '/test-scenarios.html', { waitUntil: 'networkidle' });

    const runBtn = page.locator('#btnRun');
    await runBtn.click();

    await page.waitForFunction(
      () => {
        const btn = document.getElementById('btnRun');
        const summary = document.getElementById('summary');
        return btn && !btn.disabled && summary && summary.style.display !== 'none';
      },
      { timeout: 120000 }
    );

    const results = await page.evaluate(() => {
      const rows = document.querySelectorAll('#resultsBody tr');
      const summary = document.getElementById('summary');
      return {
        rows: Array.from(rows).map((tr) => ({
          demo: tr.cells[0]?.textContent?.trim() ?? '',
          scenario: tr.cells[1]?.textContent?.trim() ?? '',
          check: tr.cells[2]?.textContent?.trim() ?? '',
          expected: tr.cells[3]?.textContent?.trim() ?? '',
          result: tr.cells[4]?.querySelector('.pass-badge, .fail-badge')?.textContent?.trim() ?? '',
          detail: tr.cells[4]?.querySelector('.detail')?.textContent?.trim() ?? '',
          pass: tr.classList.contains('pass'),
        })),
        summaryText: summary?.textContent?.trim() ?? '',
        summaryClass: summary?.className ?? '',
      };
    });

    await browser.close();

    console.log('\n--- OMEGA Demos — Scenario test results ---\n');
    console.log('Demo | Scenario | Check | Expected | Result');
    console.log('-'.repeat(80));
    for (const r of results.rows) {
      const status = r.pass ? 'PASS' : 'FAIL';
      const detail = r.detail ? ` — ${r.detail}` : '';
      console.log(`${r.demo} | ${r.scenario} | ${r.check} | ${r.expected} | ${status}${detail}`);
      if (!r.pass) exitCode = 1;
    }
    console.log('-'.repeat(80));
    console.log('\n' + results.summaryText + '\n');
    if (exitCode !== 0) {
      const failed = results.rows.filter((r) => !r.pass);
      failed.forEach((r) => console.log('  FAIL:', r.demo, r.scenario, r.check, r.detail || r.expected));
    }
  } catch (err) {
    console.error('Playwright error:', err);
    exitCode = 1;
  } finally {
    closeServer();
  }
  process.exit(exitCode);
}

main();
