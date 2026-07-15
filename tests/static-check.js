const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const html = read('index.html');
const sw = read('sw.js');
const deploy = read('deploy.sh');

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
assert.ok(scripts.length >= 2, 'index.html should contain its inline scripts');
scripts.forEach((script, index) => {
    assert.doesNotThrow(() => new Function(script), `inline script ${index + 1} should parse`);
});

for (const marker of [
    'const GameCore',
    'const Renderer',
    'const InputController',
    'const PowerupSystem',
    'const Leaderboard',
    'const TaskSystem',
    'const AchievementSystem',
    'const API_BASE_URL'
]) {
    assert.ok(html.includes(marker), `missing core marker: ${marker}`);
}

assert.ok(html.includes('viewport-fit=cover'), 'safe-area viewport support is required');
assert.ok(html.includes('env(safe-area-inset-bottom)'), 'bottom safe-area support is required');
assert.ok(!html.includes('http://49.232.149.209:3001'), 'runtime code must not hard-code the production API host');
assert.ok(!/PASSWORD\s*=|sshpass\s+-p/.test(deploy), 'deploy.sh must not contain or consume a plaintext password');
assert.match(sw, /network-first/i, 'service worker should document its navigation update strategy');
assert.match(sw, /2048-v2-cache-\d{8}-\d+/, 'service worker cache must have an explicit release version');

for (const backup of [
    'index.html.md3_backup',
    'index_backup.html',
    'index.html.bak_20260429_051212',
    'index.html.bak_local_20260501_112117'
]) {
    assert.ok(fs.existsSync(path.join(root, backup)), `historical backup is missing: ${backup}`);
}

console.log('static-check: PASS');
