#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

// Start the frontend
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname),
  stdio: 'inherit',
  shell: true
});

// Start the backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.resolve(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  frontend.kill();
  backend.kill();
  process.exit();
});
