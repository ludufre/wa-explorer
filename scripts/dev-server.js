#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const processes = [];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  angular: '\x1b[36m', // Cyan
  electron: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
};

function prefixOutput(prefix, color) {
  return (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${prefix}]${colors.reset} ${line}`);
      }
    });
  };
}

function killAll() {
  console.log('\n🛑 Stopping all processes...');
  processes.forEach((proc) => {
    if (proc && !proc.killed) {
      try {
        // Kill the process group to ensure child processes are also terminated
        process.kill(-proc.pid, 'SIGTERM');
      } catch (e) {
        // If killing process group fails, try killing just the process
        proc.kill('SIGTERM');
      }
    }
  });

  setTimeout(() => {
    processes.forEach((proc) => {
      if (proc && !proc.killed) {
        try {
          process.kill(-proc.pid, 'SIGKILL');
        } catch (e) {
          proc.kill('SIGKILL');
        }
      }
    });
    process.exit(0);
  }, 1000);
}

// Handle termination signals
process.on('SIGTERM', killAll);
process.on('SIGINT', killAll);
process.on('exit', killAll);

console.log('🚀 Starting development servers...\n');

// Start Angular
console.log('📦 Starting Angular serve...');
const angularProcess = spawn('pnpm', ['run', 'ng:serve'], {
  cwd: path.resolve(__dirname, '..'),
  shell: true,
  detached: true,
  env: { ...process.env, FORCE_COLOR: '1' }
});

angularProcess.stdout.on('data', prefixOutput('Angular', colors.angular));
angularProcess.stderr.on('data', prefixOutput('Angular', colors.angular));

angularProcess.on('error', (err) => {
  console.error(`${colors.error}❌ Angular process error:${colors.reset}`, err);
});

angularProcess.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.log(`${colors.angular}[Angular]${colors.reset} Process exited with code ${code}`);
  }
});

processes.push(angularProcess);

// Start Electron after a short delay to ensure Angular starts first
setTimeout(() => {
  console.log('⚡ Starting Electron serve...');
  const electronProcess = spawn('pnpm', ['run', 'electron:serve'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    detached: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  electronProcess.stdout.on('data', prefixOutput('Electron', colors.electron));
  electronProcess.stderr.on('data', prefixOutput('Electron', colors.electron));

  electronProcess.on('error', (err) => {
    console.error(`${colors.error}❌ Electron process error:${colors.reset}`, err);
  });

  electronProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.log(`${colors.electron}[Electron]${colors.reset} Process exited with code ${code}`);
    }
  });

  processes.push(electronProcess);
}, 1000);

// Keep the process alive
process.stdin.resume();
