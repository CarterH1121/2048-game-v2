const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const puppeteer = require('puppeteer');

const playerRoot = path.resolve(__dirname, '..');
const adminRoot = path.resolve(process.env.ADMIN_REPO_PATH || path.join(playerRoot, '..', '2048-admin'));
const backendRoot = path.join(adminRoot, 'backend');
const frontendRoot = path.join(adminRoot, 'frontend');
const outputDir = path.join(playerRoot, 'output', 'playwright', 'real-local-v2');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitForUrl(url, child, label) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} exited with ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (_error) {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function start(command, args, options) {
  const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (data) => process.stdout.write(`[${options.label}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${options.label}] ${data}`));
  return child;
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

function waitForExit(child, timeoutMs) {
  if (!child || child.exitCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.removeListener('exit', exited);
      resolve(false);
    }, timeoutMs);
    const exited = () => {
      clearTimeout(timer);
      resolve(true);
    };
    child.once('exit', exited);
  });
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  if (await waitForExit(child, 5000)) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore', windowsHide: true });
  } else {
    child.kill('SIGKILL');
  }
  await waitForExit(child, 5000);
}

function responseCookies(response) {
  return typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
}

async function runProductionProcessProbe(commonEnv, adminUsername, adminPassword) {
  const port = await freePort();
  const allowedOrigin = 'https://admin.rehearsal.invalid';
  const playerOrigin = 'https://player.rehearsal.invalid';
  const processEnv = {
    ...commonEnv,
    NODE_ENV: 'production',
    PORT: String(port),
    HOST: '127.0.0.1',
    TRUST_PROXY_HOPS: '1',
    V2_SECURITY_MODE: 'true',
    V2_AUTO_MIGRATE: 'false',
    LOCAL_V2_MODE: 'false',
    SESSION_COOKIE_SECURE: 'true',
    CORS_ORIGINS: `${allowedOrigin},${playerOrigin}`
  };
  const child = start(process.execPath, ['server.js'], {
    cwd: backendRoot,
    env: processEnv,
    label: '生产进程门禁'
  });
  try {
    await waitForUrl(`http://127.0.0.1:${port}/api/local-v2/health`, child, 'production process');
    const login = await fetch(`http://127.0.0.1:${port}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: allowedOrigin },
      body: JSON.stringify({ username: adminUsername, password: adminPassword })
    });
    assert.equal(login.status, 200);
    const cookies = responseCookies(login);
    const sessionCookie = cookies.find((value) => value.startsWith('v2_admin_session='));
    const csrfCookie = cookies.find((value) => value.startsWith('v2_admin_csrf='));
    assert.match(sessionCookie, /HttpOnly/i);
    assert.match(sessionCookie, /;\s*Secure/i);
    assert.match(sessionCookie, /SameSite=Strict/i);
    assert.match(sessionCookie, /Path=\/api\/admin/i);
    assert.doesNotMatch(csrfCookie, /HttpOnly/i);
    assert.match(csrfCookie, /;\s*Secure/i);
    assert.match(csrfCookie, /SameSite=Strict/i);
    assert.equal(login.headers.get('access-control-allow-origin'), allowedOrigin);
    assert.equal(login.headers.get('access-control-allow-credentials'), 'true');
    assert.equal(login.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(login.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(login.headers.get('cross-origin-resource-policy'), 'same-site');
    assert.match(login.headers.get('referrer-policy') || '', /no-referrer/);
    await login.json();

    const denied = await fetch(`http://127.0.0.1:${port}/api/announcements`, {
      headers: { Origin: 'https://denied.rehearsal.invalid' }
    });
    assert.equal(denied.status, 403);
    return {
      loopbackProductionProcess: true,
      secureCookies: true,
      exactCors: true,
      securityHeaders: true,
      automaticMigrationDisabled: true
    };
  } finally {
    await stopChild(child);
  }
}

async function visibleUiText(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
    };
    const controls = [...document.querySelectorAll('input, textarea, button, [title], [aria-label]')]
      .filter(visible)
      .flatMap((element) => [
        element.getAttribute('placeholder'),
        element.getAttribute('title'),
        element.classList.contains('anticon') ? null : element.getAttribute('aria-label')
      ])
      .filter(Boolean);
    return `${document.body.innerText}\n${controls.join('\n')}`;
  });
}

async function setInputValue(page, selector, value) {
  await page.$eval(selector, (element, nextValue) => {
    element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

const forbiddenUiEnglish = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat|Today|Now|Cancel|Confirm|Submit|Loading|Error|Play|New|Operations|Dashboard)\b/i;

function assertChineseUi(text, label) {
  const match = text.match(forbiddenUiEnglish);
  assert.equal(match, null, `${label} contains visible English UI text: ${match?.[0]}`);
}

async function runAdminBrowser(browser, baseUrl, adminUsername, adminPassword, historicalUserId) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`); });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="用户名"]', adminUsername);
  await page.type('input[placeholder="密码"]', adminPassword);
  await Promise.all([
    page.waitForFunction(() => location.pathname === '/dashboard'),
    page.click('button[type="submit"]')
  ]);
  await page.waitForSelector('.dashboard');
  assertChineseUi(await visibleUiText(page), '管理端登录与看板');
  await page.screenshot({ path: path.join(outputDir, 'admin-dashboard-desktop.png'), fullPage: true });

  const routes = ['/users', '/games', '/ranking', '/feedback', '/operations'];
  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle2' });
    assertChineseUi(await visibleUiText(page), `管理端 ${route}`);
  }

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/operations`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => [...document.querySelectorAll('.ant-tabs-tab')].find((element) => element.textContent.includes('历史认领'))?.click());
  await page.waitForSelector('input[inputmode="numeric"]');
  await page.type('input[inputmode="numeric"]', String(historicalUserId));
  await page.evaluate(() => [...document.querySelectorAll('button')].find((element) => element.textContent.includes('生成一次性令牌'))?.click());
  await page.waitForSelector('.one-time-token code');
  const claimToken = await page.$eval('.one-time-token code', (element) => element.textContent.trim());
  assert.match(claimToken, /^[A-Za-z0-9_-]{40,60}$/);
  assertChineseUi(await visibleUiText(page), '管理端历史认领');
  await page.screenshot({ path: path.join(outputDir, 'admin-history-claim-desktop.png'), fullPage: true });

  await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle2' });
  await page.click('.ant-picker');
  await page.waitForSelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  await new Promise((resolve) => setTimeout(resolve, 500));
  const desktopPickerText = await page.$eval('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)', (element) => element.innerText);
  assertChineseUi(desktopPickerText, '桌面日期选择器');
  assert.match(desktopPickerText, /[一二三四五六日]/, 'desktop date picker should show Chinese weekday labels');
  assert.match(desktopPickerText, /\d{4}年/, 'desktop date picker should show a Chinese year label');
  await page.screenshot({ path: path.join(outputDir, 'admin-date-picker-desktop.png'), fullPage: true });
  await page.keyboard.press('Escape');

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle2' });
  await page.click('.ant-picker');
  await page.waitForSelector('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  await new Promise((resolve) => setTimeout(resolve, 500));
  const mobilePickerText = await page.$eval('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)', (element) => element.innerText);
  const mobilePickerLayout = await page.$eval('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)', (element) => ({
    width: element.getBoundingClientRect().width,
    right: element.getBoundingClientRect().right,
    visiblePanels: [...element.querySelectorAll('.ant-picker-panel')].filter((panel) => getComputedStyle(panel).display !== 'none').length
  }));
  assertChineseUi(mobilePickerText, '移动日期选择器');
  assert.match(mobilePickerText, /[一二三四五六日]/, 'mobile date picker should show Chinese weekday labels');
  assert.match(mobilePickerText, /\d{4}年/, 'mobile date picker should show a Chinese year label');
  assert.ok(mobilePickerLayout.width <= 374 && mobilePickerLayout.right <= 390, 'mobile date picker must fit inside the viewport');
  assert.equal(mobilePickerLayout.visiblePanels, 1, 'mobile date picker should present one usable month panel');
  await page.screenshot({ path: path.join(outputDir, 'admin-date-picker-mobile.png') });
  await page.keyboard.press('Escape');

  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
  await page.click('.user-info');
  await page.waitForSelector('.ant-dropdown:not(.ant-dropdown-hidden)');
  await page.evaluate(() => [...document.querySelectorAll('.ant-dropdown-menu-item')].find((element) => element.textContent.includes('退出登录'))?.click());
  await page.waitForFunction(() => location.pathname === '/login');
  await page.type('input[placeholder="用户名"]', adminUsername);
  await page.type('input[placeholder="密码"]', adminPassword);
  await Promise.all([
    page.waitForFunction(() => location.pathname === '/dashboard'),
    page.click('button[type="submit"]')
  ]);
  await page.waitForSelector('.dashboard');

  assert.deepEqual(consoleErrors, [], `admin console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(pageErrors, [], `admin page errors: ${pageErrors.join(' | ')}`);
  assert.deepEqual(serverErrors, [], `admin server errors: ${serverErrors.join(' | ')}`);
  await page.close();
  return { routes, desktopPickerText, mobilePickerText, mobilePickerLayout, claimToken, logoutRelogin: true };
}

async function runHistoricalClaimBrowser(browser, baseUrl, token, expectedUserId) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#historicalClaimBtn');
  await page.click('#historicalClaimBtn');
  await page.waitForSelector('#confirmHistoricalClaim');
  const username = `claim_${crypto.randomBytes(5).toString('hex')}`;
  const password = `Claim!9-${crypto.randomBytes(12).toString('base64url')}`;
  await setInputValue(page, '#historicalClaimToken', token);
  await setInputValue(page, '#historicalClaimUsername', username);
  await setInputValue(page, '#historicalClaimPassword', password);
  await setInputValue(page, '#historicalClaimPasswordConfirm', password);
  await page.click('#confirmHistoricalClaim');
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
  assert.equal(await page.evaluate(() => localStorage.getItem('api_userId')), String(expectedUserId));
  const replay = await page.evaluate(async ({ tokenValue, usernameValue, passwordValue }) => {
    const response = await fetch(`${location.origin}/api/user/claim-history`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenValue, username: usernameValue, password: passwordValue })
    });
    return { status: response.status, payload: await response.json() };
  }, { tokenValue: token, usernameValue: username, passwordValue: password });
  assert.equal(replay.status, 409);
  assert.equal(replay.payload.code, 'CLAIM_REPLAYED');
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#settingsBtn');
  const tutorialVisible = await page.$eval('#tutorialOverlay', (element) => element.classList.contains('active'));
  if (tutorialVisible) await page.click('#tutorialSkip');
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');
  await page.evaluate(() => document.getElementById('modalOverlay').click());
  assert.equal(await page.$('#historicalClaimBtn'), null, 'claimed player should restore the authenticated session');
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');
  assertChineseUi(await visibleUiText(page), '玩家端历史账号认领');
  await page.screenshot({ path: path.join(outputDir, 'player-history-claim-mobile.png'), fullPage: true });
  const [logoutResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/user/logout') && response.request().method() === 'POST'),
    page.$eval('#logoutPlayerBtn', (button) => button.click())
  ]);
  assert.equal(logoutResponse.status(), 200);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => {
      for (const key of ['api_userId', 'user_nickname', 'api_user_mode', 'api_guest_origin_id']) localStorage.removeItem(key);
      location.reload();
    })
  ]);
  await page.waitForSelector('#accountLoginBtn');
  await setInputValue(page, '#accountUsername', username);
  await setInputValue(page, '#accountPassword', password);
  const [historyLoginResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/user/login') && response.request().method() === 'POST'),
    page.click('#accountLoginBtn')
  ]);
  assert.equal(historyLoginResponse.status(), 200, JSON.stringify(await historyLoginResponse.json()));
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');
  assert.equal(await page.evaluate(() => localStorage.getItem('api_userId')), String(expectedUserId));
  assert.deepEqual(errors, []);
  await page.close();
  return { originalUserIdPreserved: true, replayRejected: true, replayTokenNotStored: true, logoutRelogin: true };
}

async function runPlayerBrowser(browser, baseUrl) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];
  let upgradeRequestMatched = false;
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`); });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    if (request.url().includes('/api/user/upgrade-guest') && request.method() === 'POST') {
      try {
        const payload = JSON.parse(request.postData() || '{}');
        upgradeRequestMatched = payload.username === username && payload.password === password && payload.nickname === nickname;
      } catch (_error) {
        upgradeRequestMatched = false;
      }
    }
    if (host !== '127.0.0.1' && host !== 'localhost') request.respond({ status: 204, body: '' });
    else request.continue();
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(baseUrl, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#confirmNameBtn');
  assertChineseUi(await visibleUiText(page), '玩家端身份入口');
  await page.click('#confirmNameBtn');
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
  await page.waitForSelector('.tile');
  const tutorialVisible = await page.$eval('#tutorialOverlay', (element) => element.classList.contains('active'));
  if (tutorialVisible) await page.click('#tutorialSkip');

  await page.click('#settingsBtn');
  try {
    await page.waitForSelector('#upgradeGuestBtn', { timeout: 5000 });
  } catch (error) {
    const modalText = await page.$eval('#modalContent', (element) => element.innerText);
    throw new Error(`Guest settings did not render. Modal: ${modalText}; page errors: ${pageErrors.join(' | ')}; console errors: ${consoleErrors.join(' | ')}`);
  }
  assertChineseUi(await visibleUiText(page), '玩家端游客设置');
  await page.click('#upgradeGuestBtn');
  await page.waitForSelector('#confirmGuestUpgrade');
  const username = `v2user_${crypto.randomBytes(5).toString('hex')}`;
  const nickname = `验收${crypto.randomBytes(4).toString('hex')}`;
  const password = `Safe!9-${crypto.randomBytes(12).toString('base64url')}`;
  await setInputValue(page, '#upgradeUsername', username);
  await setInputValue(page, '#upgradeNickname', nickname);
  await setInputValue(page, '#upgradePassword', password);
  await setInputValue(page, '#upgradePasswordConfirm', password);
  assert.equal(await page.$eval('#upgradeUsername', (element, expected) => element.value === expected, username), true, 'upgrade username input must be exact');
  assert.equal(await page.$eval('#upgradePassword', (element, expected) => element.value === expected, password), true, 'upgrade password input must be exact');
  await page.click('#confirmGuestUpgrade');
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
  assert.equal(upgradeRequestMatched, true, 'guest upgrade request must preserve the entered credentials');
  const credentialProbe = await page.evaluate(async ({ usernameValue, passwordValue }) => {
    const response = await fetch(`${location.origin}/api/user/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameValue, password: passwordValue })
    });
    return { status: response.status, payload: await response.json() };
  }, { usernameValue: username, passwordValue: password });
  assert.equal(credentialProbe.status, 200, JSON.stringify(credentialProbe.payload));

  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#settingsBtn');
  assert.equal(await page.$('#namingOverlay.active'), null, 'authenticated player session should restore after refresh');
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');
  assertChineseUi(await visibleUiText(page), '玩家端账号设置');
  await new Promise((resolve) => setTimeout(resolve, 2200));
  await page.screenshot({ path: path.join(outputDir, 'player-account-mobile.png'), fullPage: true });

  for (const selector of ['button[data-panel="leaderboard"]', 'button[data-panel="tasks"]', 'button[data-panel="skins"]', 'button[data-panel="share"]', 'button[data-panel="profile"]']) {
    await page.evaluate(() => document.getElementById('modalOverlay').click());
    await page.click(selector);
    await page.waitForSelector('#modalOverlay.active');
    assertChineseUi(await visibleUiText(page), `玩家端面板 ${selector}`);
  }

  await page.evaluate(() => document.getElementById('modalOverlay').click());
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');
  const [logoutResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/user/logout') && response.request().method() === 'POST'),
    page.$eval('#logoutPlayerBtn', (button) => button.click())
  ]);
  assert.equal(logoutResponse.status(), 200);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.evaluate(() => {
      for (const key of ['api_userId', 'user_nickname', 'api_user_mode', 'api_guest_origin_id']) localStorage.removeItem(key);
      location.reload();
    })
  ]);
  await page.waitForSelector('#accountLoginBtn');
  await setInputValue(page, '#accountUsername', username);
  await setInputValue(page, '#accountPassword', password);
  assert.equal(await page.$eval('#accountUsername', (element, expected) => element.value === expected, username), true, 'player username input must be exact');
  assert.equal(await page.$eval('#accountPassword', (element, expectedLength) => element.value.length === expectedLength, password.length), true, 'player password input length must be exact');
  const [playerLoginResponse] = await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/user/login') && response.request().method() === 'POST'),
    page.click('#accountLoginBtn')
  ]);
  assert.equal(playerLoginResponse.status(), 200, JSON.stringify(await playerLoginResponse.json()));
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.click('#settingsBtn');
  await page.waitForSelector('#logoutPlayerBtn');

  assert.deepEqual(consoleErrors, [], `player console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(pageErrors, [], `player page errors: ${pageErrors.join(' | ')}`);
  assert.deepEqual(serverErrors, [], `player server errors: ${serverErrors.join(' | ')}`);
  await page.close();
  await context.close();
  return { restoredSession: true, logoutRelogin: true, scannedPanels: 5 };
}

async function main() {
  for (const required of [path.join(backendRoot, 'server.js'), path.join(frontendRoot, 'vite.config.ts')]) {
    if (!fs.existsSync(required)) throw new Error(`Required sibling repository file is missing: ${required}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const snapshotRehearsal = process.env.PRODUCTION_SNAPSHOT_REHEARSAL === 'true';
  if (snapshotRehearsal && process.env.ALLOW_PRODUCTION_SNAPSHOT_REHEARSAL !== 'true') {
    throw new Error('Production snapshot rehearsal requires explicit isolated-rehearsal authorization');
  }
  const [apiPort, adminPort, playerPort] = await Promise.all([freePort(), freePort(), freePort()]);
  const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-11);
  const adminPassword = `${snapshotRehearsal ? 'Rehearsal' : 'Local'}-${crypto.randomBytes(18).toString('base64url')}!9a`;
  const adminNextPassword = `RehearsalNext-${crypto.randomBytes(16).toString('base64url')}!8b`;
  const databaseConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || '3310'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'game2048_v2_local'
  };
  if (snapshotRehearsal) {
    assert.ok(['127.0.0.1', 'localhost', '::1'].includes(databaseConfig.host), 'snapshot rehearsal database must be loopback-only');
    assert.match(databaseConfig.database, /(snapshot|rehearsal|restore)/i, 'snapshot rehearsal database name must make isolation explicit');
  }
  const commonBackendEnv = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(apiPort),
    HOST: '127.0.0.1',
    LOCAL_V2_MODE: snapshotRehearsal ? 'false' : 'true',
    V2_SECURITY_MODE: snapshotRehearsal ? 'true' : 'false',
    V2_AUTO_MIGRATE: snapshotRehearsal ? 'false' : 'true',
    SESSION_COOKIE_SECURE: 'false',
    LOCAL_V2_FAILPOINTS: snapshotRehearsal ? 'false' : 'true',
    LOCAL_V2_ADMIN_PASSWORD: snapshotRehearsal ? '' : adminPassword,
    LOCAL_V2_RESET_ADMIN_PASSWORD: snapshotRehearsal ? 'false' : 'true',
    CORS_ORIGINS: `http://127.0.0.1:${adminPort},http://127.0.0.1:${playerPort}`,
    DB_HOST: databaseConfig.host,
    DB_PORT: String(databaseConfig.port),
    DB_USER: databaseConfig.user,
    DB_PASSWORD: databaseConfig.password,
    DB_NAME: databaseConfig.database
  };
  const processes = [];
  let browser;
  let database;
  let historicalUserId;
  let removeSyntheticHistoricalUser = false;
  let adminUsername = 'local-v2-admin';
  let adminInitialization = { existingSuperAdmin: false };
  try {
    const mysql = require(path.join(backendRoot, 'node_modules', 'mysql2', 'promise'));
    database = await mysql.createConnection({ ...databaseConfig, charset: 'utf8mb4' });
    if (snapshotRehearsal) {
      const [migrationRows] = await database.query(`SELECT id FROM schema_migrations
        WHERE id IN ('001_v2_security', '002_production_compatibility') ORDER BY id`);
      assert.deepEqual(migrationRows.map((row) => row.id), ['001_v2_security', '002_production_compatibility']);
      const [administrators] = await database.query(`SELECT CAST(id AS CHAR) AS id, username, auth_version, password, password_hash
        FROM admins WHERE role = 'super_admin' AND status = 1 ORDER BY id`);
      assert.equal(administrators.length, 1, 'exactly one active existing super_admin is required');
      const administrator = administrators[0];
      adminUsername = administrator.username;
      const syntheticSessionToken = crypto.randomBytes(32).toString('hex');
      const syntheticCsrf = crypto.randomBytes(32).toString('hex');
      await database.query(`INSERT INTO auth_sessions
        (token_hash, actor_type, actor_id, auth_version, csrf_token_hash, expires_at, created_ip, user_agent)
        VALUES (?, 'admin', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), '127.0.0.1', 'isolated-rehearsal')`, [
        crypto.createHash('sha256').update(syntheticSessionToken).digest('hex'),
        administrator.id,
        administrator.auth_version,
        crypto.createHash('sha256').update(syntheticCsrf).digest('hex')
      ]);
      const { provisionAdministrator } = require(path.join(backendRoot, 'tools', 'set-admin-password.js'));
      const provisioned = await provisionAdministrator({
        database: databaseConfig.database,
        username: adminUsername,
        password: adminPassword,
        connectionOptions: {
          host: databaseConfig.host,
          port: databaseConfig.port,
          user: databaseConfig.user,
          password: databaseConfig.password
        }
      });
      const [[initialized]] = await database.query(`SELECT password, password_hash, auth_version,
        (SELECT COUNT(*) FROM auth_sessions WHERE actor_type = 'admin' AND actor_id = admins.id AND revoked_at IS NULL) AS active_sessions,
        (SELECT COUNT(*) FROM auth_sessions WHERE actor_type = 'admin' AND actor_id = admins.id AND revoked_reason = 'password_provisioned') AS provision_revocations,
        (SELECT COUNT(*) FROM security_audit_logs WHERE actor_type = 'admin' AND actor_id = admins.id AND event_type = 'admin_password_provisioned') AS provision_audits
        FROM admins WHERE id = ?`, [administrator.id]);
      assert.equal(initialized.password, null);
      assert.match(initialized.password_hash, /^\$2[aby]\$/);
      assert.equal(Number(initialized.auth_version), Number(administrator.auth_version) + 1);
      assert.equal(Number(initialized.active_sessions), 0);
      assert.ok(Number(initialized.provision_revocations) >= 1);
      assert.ok(Number(initialized.provision_audits) >= 1);
      assert.ok(provisioned.sessionsRevoked >= 1);
      adminInitialization = {
        existingSuperAdmin: true,
        plaintextRemoved: true,
        passwordHashCreated: true,
        authVersionIncremented: true,
        priorSessionsRevoked: true,
        auditRecorded: true
      };
    }

    processes.push(
      start(process.execPath, [snapshotRehearsal ? 'server.js' : 'tools/start-local-v2.js'], { cwd: backendRoot, env: commonBackendEnv, label: '后端' }),
      start(process.execPath, [path.join(frontendRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', String(adminPort), '--strictPort'], {
        cwd: frontendRoot,
        env: {
          ...process.env,
          VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
          VITE_ENVIRONMENT_BADGE: snapshotRehearsal ? 'V2.0 · 生产快照隔离彩排' : 'V2.0 · 本地集成',
          VITE_ENVIRONMENT_NOTICE_TITLE: snapshotRehearsal ? '生产快照隔离彩排' : '本地 V2.0 集成环境',
          VITE_ENVIRONMENT_NOTICE_DESCRIPTION: snapshotRehearsal
            ? '当前页面连接与生产完全隔离的加密快照克隆；所有写入仅用于迁移与恢复演练。'
            : '当前页面连接 127.0.0.1 的候选后端与隔离测试库。'
        },
        label: '管理端'
      }),
      start(process.execPath, ['tools/local-v2-server.js'], {
        cwd: playerRoot,
        env: { ...process.env, PLAYER_PORT: String(playerPort), LOCAL_V2_API_PORT: String(apiPort) },
        label: '玩家端'
      })
    );
    await Promise.all([
      waitForUrl(`http://127.0.0.1:${apiPort}/api/local-v2/health`, processes[0], 'backend'),
      waitForUrl(`http://127.0.0.1:${adminPort}/login`, processes[1], 'admin frontend'),
      waitForUrl(`http://127.0.0.1:${playerPort}/health`, processes[2], 'player frontend')
    ]);
    const executablePath = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      puppeteer.executablePath(),
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ].find((candidate) => candidate && fs.existsSync(candidate));
    assert.ok(executablePath, 'Chrome/Chromium executable is required for real local V2 browser acceptance');
    browser = await puppeteer.launch({ headless: true, executablePath, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    if (snapshotRehearsal) {
      const [historicalUsers] = await database.query(`SELECT id FROM users
        WHERE status = 1 AND (password_hash IS NULL OR TRIM(password_hash) = '')
          AND (username IS NULL OR TRIM(username) = '')
        ORDER BY id LIMIT 1`);
      assert.equal(historicalUsers.length, 1, 'snapshot clone must contain an unclaimed historical player for browser acceptance');
      historicalUserId = historicalUsers[0].id;
    } else {
      const [inserted] = await database.query("INSERT INTO users (openid, nickname, avatar, status) VALUES (?, ?, '', 1)", [`browser-history-${crypto.randomUUID()}`, `历史验收${crypto.randomBytes(2).toString('hex')}`]);
      historicalUserId = inserted.insertId;
      removeSyntheticHistoricalUser = true;
    }
    const acceptanceStartedAt = Date.now();
    const adminEvidence = await runAdminBrowser(browser, `http://127.0.0.1:${adminPort}`, adminUsername, adminPassword, historicalUserId);
    const claimEvidence = await runHistoricalClaimBrowser(browser, `http://127.0.0.1:${playerPort}`, adminEvidence.claimToken, historicalUserId);
    delete adminEvidence.claimToken;
    const playerEvidence = await runPlayerBrowser(browser, `http://127.0.0.1:${playerPort}`);
    const apiEvidencePath = path.join(outputDir, 'api-evidence.json');
    await run(process.execPath, ['--test', 'tests/local-v2-integration.test.js'], {
      cwd: backendRoot,
      env: {
        ...commonBackendEnv,
        LOCAL_V2_BASE_URL: `http://127.0.0.1:${apiPort}`,
        LOCAL_V2_ADMIN_USERNAME: adminUsername,
        LOCAL_V2_ADMIN_PASSWORD: adminPassword,
        LOCAL_V2_ADMIN_NEW_PASSWORD: adminNextPassword,
        PRODUCTION_SNAPSHOT_REHEARSAL: snapshotRehearsal ? 'true' : 'false',
        REHEARSAL_SUFFIX: runId,
        REHEARSAL_EVIDENCE_PATH: apiEvidencePath
      },
      stdio: 'inherit'
    });
    const apiEvidence = JSON.parse(fs.readFileSync(apiEvidencePath, 'utf8'));

    let productionProcessEvidence = { tested: false };
    if (snapshotRehearsal) {
      await stopChild(processes[0]);
      processes[0] = null;
      productionProcessEvidence = await runProductionProcessProbe(commonBackendEnv, adminUsername, adminNextPassword);
    }

    const [[businessMarker]] = await database.query(`SELECT
      (SELECT COUNT(*) FROM users WHERE username = ?) AS registered_players,
      (SELECT COUNT(*) FROM users WHERE username = ?) AS claimed_historical_players,
      (SELECT COUNT(*) FROM announcements WHERE title = ?) AS announcements,
      (SELECT COUNT(*) FROM feedback WHERE content = ?) AS feedback_rows,
      (SELECT COUNT(*) FROM guest_migrations WHERE migration_id = ?) AS guest_migrations,
      (SELECT COUNT(*) FROM task_reward_claims trc JOIN tasks t ON t.id = trc.task_id WHERE t.code = ?) AS task_claims,
      (SELECT COUNT(*) FROM item_grants WHERE reason = ?) AS item_grants
    `, [
      `p${runId}`,
      `h${runId}`,
      `真实联动公告 ${runId}`,
      `真实联动反馈 ${runId}`,
      `migration_${runId}_success`,
      `it_${runId}`,
      `rehearsal-${runId}`
    ]);
    const marker = Object.fromEntries(Object.entries(businessMarker).map(([key, value]) => [key, Number(value)]));
    assert.ok(Object.values(marker).every((value) => value >= 1), `controlled write marker is incomplete: ${JSON.stringify(marker)}`);
    const [[versionRow]] = await database.query('SELECT VERSION() AS version');
    const evidence = {
      mode: snapshotRehearsal ? 'isolated-production-snapshot-rehearsal' : 'isolated-local-v2',
      runId,
      realBackend: true,
      databaseClass: snapshotRehearsal ? 'encrypted-production-snapshot-clone' : 'synthetic-local',
      mysqlVersion: versionRow.version,
      applicationAcceptanceDurationMs: Date.now() - acceptanceStartedAt,
      adminInitialization,
      adminEvidence,
      claimEvidence,
      playerEvidence,
      apiEvidence,
      productionProcessEvidence,
      controlledPublicWriteMarker: marker
    };
    fs.writeFileSync(path.join(outputDir, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log(JSON.stringify(evidence, null, 2));
    console.log('real-local-v2: PASS');
  } finally {
    if (database && historicalUserId && removeSyntheticHistoricalUser) {
      await database.query('DELETE FROM auth_sessions WHERE actor_type = ? AND actor_id = ?', ['player', historicalUserId]);
      await database.query('DELETE FROM identity_claim_tokens WHERE user_id = ?', [historicalUserId]);
      await database.query('DELETE FROM users WHERE id = ?', [historicalUserId]);
    }
    if (browser) await browser.close();
    for (const child of processes) await stopChild(child);
    if (database) await database.end();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
