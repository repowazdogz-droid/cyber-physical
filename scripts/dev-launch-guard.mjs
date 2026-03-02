#!/usr/bin/env node
/**
 * Dev Launch Guard
 * 
 * Developer safety utility:
 * - Prevents running dev from wrong directory
 * - Prevents port collisions
 * - Makes app identity visually obvious
 * 
 * Dev-only utility, not part of production.
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// 1. PORT CLEANUP (pre-flight)
// ============================================================================

function killPortsInRange(startPort, endPort) {
  console.log(`\n🧹 Cleaning ports ${startPort}-${endPort}...`);
  
  for (let port = startPort; port <= endPort; port++) {
    try {
      // macOS/Linux: find process using port and kill it
      if (process.platform === 'darwin' || process.platform === 'linux') {
        // lsof -ti:PORT finds PID using port
        const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (pid) {
          console.log(`   Killing process ${pid} on port ${port}`);
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        }
      }
      // Windows: netstat + taskkill (not implemented, but structure is here)
      // else if (process.platform === 'win32') { ... }
    } catch (e) {
      // Port is unused or process already dead - fail silently
    }
  }
  
  console.log('✅ Port cleanup complete\n');
}

// ============================================================================
// 2. PROJECT VERIFICATION
// ============================================================================

function verifyProject() {
  const cwd = process.cwd();
  const packageJsonPath = join(cwd, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.error('\n❌ ERROR: No package.json found.');
    console.error('   You are not inside a runnable Omega app.');
    console.error(`   Current directory: ${cwd}\n`);
    process.exit(1);
  }
  
  return packageJsonPath;
}

// ============================================================================
// 3. APP IDENTITY BANNER
// ============================================================================

function printBanner(packageJsonPath, port) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const appName = packageJson.name || 'unknown';
  const cwd = process.cwd();
  
  console.log('\n' + '='.repeat(60));
  console.log('OMEGA DEV SERVER');
  console.log('='.repeat(60));
  console.log(`App:  ${appName}`);
  console.log(`Path: ${cwd}`);
  console.log(`Port: ${port}`);
  console.log('='.repeat(60) + '\n');
}

// ============================================================================
// 4. MAIN EXECUTION
// ============================================================================

async function main() {
  // Step 1: Clean ports 3000-3010
  killPortsInRange(3000, 3010);
  
  // Step 2: Verify we're in a project directory
  const packageJsonPath = verifyProject();
  
  // Step 3: Determine port (use existing logic or default)
  let port = 3001;
  try {
    // Try to use find-free-port.mjs if it exists
    const findPortScript = join(__dirname, 'find-free-port.mjs');
    if (existsSync(findPortScript)) {
      const { execFileSync } = await import('node:child_process');
      port = Number(execFileSync('node', [findPortScript], { encoding: 'utf8' }).trim());
    }
  } catch (e) {
    // Fall back to default port
    port = 3001;
  }
  
  // Step 4: Print banner
  printBanner(packageJsonPath, port);
  
  // Step 5: Run the actual dev command
  // Check if there's a "dev" script in package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const devScript = packageJson.scripts?.dev;
  
  if (!devScript) {
    console.error('❌ ERROR: No "dev" script found in package.json\n');
    process.exit(1);
  }
  
  // Execute the dev script
  const { spawn } = await import('node:child_process');
  
  // Parse the dev script command
  const [cmd, ...args] = devScript.split(/\s+/);
  
  console.log(`🚀 Starting dev server...\n`);
  
  const devProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: String(port),
    },
  });
  
  devProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    devProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    devProcess.kill('SIGTERM');
  });
}

main().catch((e) => {
  console.error('\n❌ Dev launch guard failed:', e.message);
  process.exit(1);
});






























