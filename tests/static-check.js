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
assert.ok(html.includes("if ('serviceWorker' in navigator)"), 'service worker registration must degrade safely when unsupported');
assert.ok(!html.includes('PWA原生应用体验'), 'player-facing metadata must not promise unavailable offline capability');
assert.ok(!html.includes('http://49.232.149.209:3001'), 'runtime code must not hard-code the production API host');
assert.ok(!/PASSWORD\s*=|sshpass\s+-p/.test(deploy), 'deploy.sh must not contain or consume a plaintext password');
assert.match(deploy, /index\.html[\s\S]*sw\.js|sw\.js[\s\S]*index\.html/, 'deploy.sh must publish index.html and sw.js as one release unit');
assert.match(deploy, /rollback_release/, 'deploy.sh must implement paired rollback');
assert.match(deploy, /DEPLOY_REMOTE_PATH:\?/, 'deploy.sh must require an explicitly authorized remote path');
assert.ok(!deploy.includes('DEPLOY_REMOTE_PATH:-/'), 'deploy.sh must not guess a production remote path');
assert.ok(!html.includes('data-tab="daily"'), 'daily leaderboard must not be shown without a backend contract');
assert.ok(!html.includes('class="mode-btn'), 'mode leaderboard controls must not be shown while the backend ignores mode');
assert.ok(!/leaderboard\/global\?mode=/.test(html), 'leaderboard requests must not send an ignored mode filter');
assert.ok(!html.includes('data-mode="extreme"'), 'unimplemented extreme mode must not be offered as a playable mode');
assert.ok(!html.includes('option value="extreme"'), 'unimplemented extreme mode must not be offered as a default mode');
assert.ok(!html.includes('id="syncDataBtn"'), 'settings must not expose a fake full-progress cloud sync action');
assert.ok(!/submitGame\([^\n]*['"]sync['"]/.test(html), 'game record submission must not masquerade as cloud sync');
assert.ok(!html.includes('SeasonSystem.init();'), 'local-only season rewards must stay disabled without a backend contract');
assert.ok(!/completeTask[\s\S]{0,500}PowerupSystem\.addItem/.test(html), 'local tasks must not mint account inventory without a reward contract');
assert.match(html, /if \(!await API\.useItem\('undo'\)\) return false/, 'account item use must be confirmed before applying undo');
assert.match(html, /if \(!await API\.useItem\('bomb'\)\) return false/, 'account item use must be confirmed before applying destructive board effects');
assert.match(html, /supportedThemes: \['classic', 'neon', 'sakura', 'tech', 'nature', 'minimal'\]/, 'all supported themes must share one validated boundary');
assert.match(html, /getComputedStyle\(document\.body\)\.getPropertyValue\(token\)/, 'tile rendering must consume theme tokens instead of a second hard-coded palette');
assert.ok(html.includes('/tasks/user/${this.userId}'), 'logged-in task UI must consume the persisted server contract');
assert.ok(html.includes('/tasks/${taskId}/claim'), 'logged-in task UI must use the persisted claim contract');
assert.ok(html.includes('alreadyClaimed'), 'task UI must disclose idempotent repeated claims');
assert.ok(html.includes('游客目标只保存在本机'), 'guest task UI must disclose its local-only boundary');
assert.ok(html.includes('timedDeadlineAt'), 'timed mode must persist an absolute deadline');
assert.ok(html.includes('visibilitychange'), 'timed mode must reconcile the deadline after backgrounding');
assert.ok(html.includes('/user/upgrade-guest'), 'guest upgrade must use the local V2 migration endpoint');
assert.ok(html.includes('/user/local-session'), 'upgraded local accounts must restore through a server session check');
assert.ok(html.includes('navigator.clipboard?.writeText'), 'share copy must detect unsupported clipboard environments');
assert.ok(html.includes('复制失败，请手动选择分享文案'), 'share copy must not claim success after a failed clipboard write');
assert.ok(html.includes("(t/10000) + '万'"), 'challenge target labels must convert scores to ten-thousands correctly');
assert.ok(html.includes('targetScore: 10000'), 'challenge mode must have a valid default target before the first selection');
assert.ok(html.includes("window.addEventListener('resize', this.resizeHandler"), 'renderer must recalculate tile geometry after viewport changes');
assert.match(sw, /network-first/i, 'service worker should document its navigation update strategy');
assert.match(sw, /2048-v2-cache-\d{8}-\d+/, 'service worker cache must have an explicit release version');
assert.match(sw, /cacheName\.startsWith\(CACHE_PREFIX\)/, 'service worker must only delete this app cache namespace');

for (const backup of [
    'index.html.md3_backup',
    'index_backup.html',
    'index.html.bak_20260429_051212',
    'index.html.bak_local_20260501_112117'
]) {
    assert.ok(fs.existsSync(path.join(root, backup)), `historical backup is missing: ${backup}`);
}

console.log('static-check: PASS');
