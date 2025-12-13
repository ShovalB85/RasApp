#!/usr/bin/env node

/**
 * Helper script to start the server and ngrok tunnel together
 * Usage: node scripts/start-with-ngrok.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = join(__dirname, '..');

console.log('🚀 Starting RasApp server with ngrok...\n');

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

// Wait a bit for server to start, then start ngrok
setTimeout(() => {
  console.log('\n🌐 Starting ngrok tunnel...\n');
  const ngrok = spawn('ngrok', ['http', '3001'], {
    stdio: 'inherit',
    shell: true
  });

  ngrok.on('error', (err) => {
    console.error('❌ Error starting ngrok:', err.message);
    console.log('\n💡 Make sure ngrok is installed: https://ngrok.com/download');
    console.log('💡 Or run ngrok manually: ngrok http 3001\n');
  });

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down...');
    server.kill();
    ngrok.kill();
    process.exit(0);
  });
}, 3000);

process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down server...');
  server.kill();
  process.exit(0);
});


