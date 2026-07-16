const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
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

const forbiddenUiEnglish = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat|Today|Now|Cancel|Confirm|Submit|Loading|Error|Play|New|Operations|Dashboard)\b/i;

function assertChineseUi(text, label) {
  const match = text.match(forbiddenUiEnglish);
  assert.equal(match, null, `${label} contains visible English UI text: ${match?.[0]}`);
}

async function runAdminBrowser(browser, baseUrl, adminPassword) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`); });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="用户名"]', 'local-v2-admin');
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

  assert.deepEqual(consoleErrors, [], `admin console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(pageErrors, [], `admin page errors: ${pageErrors.join(' | ')}`);
  assert.deepEqual(serverErrors, [], `admin server errors: ${serverErrors.join(' | ')}`);
  await page.close();
  return { routes, desktopPickerText, mobilePickerText, mobilePickerLayout };
}

async function runPlayerBrowser(browser, baseUrl) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const serverErrors = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`); });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
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
  await page.type('#upgradeUsername', username);
  await page.$eval('#upgradeNickname', (element) => { element.value = ''; });
  await page.type('#upgradeNickname', nickname);
  await page.type('#upgradePassword', password);
  await page.type('#upgradePasswordConfirm', password);
  await page.click('#confirmGuestUpgrade');
  await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));

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

  assert.deepEqual(consoleErrors, [], `player console errors: ${consoleErrors.join(' | ')}`);
  assert.deepEqual(pageErrors, [], `player page errors: ${pageErrors.join(' | ')}`);
  assert.deepEqual(serverErrors, [], `player server errors: ${serverErrors.join(' | ')}`);
  await page.close();
  return { restoredSession: true, scannedPanels: 5 };
}

async function main() {
  for (const required of [path.join(backendRoot, 'server.js'), path.join(frontendRoot, 'vite.config.ts')]) {
    if (!fs.existsSync(required)) throw new Error(`Required sibling repository file is missing: ${required}`);
  }
  fs.mkdirSync(outputDir, { recursive: true });
  const [apiPort, adminPort, playerPort] = await Promise.all([freePort(), freePort(), freePort()]);
  const adminPassword = `Local-${crypto.randomBytes(18).toString('base64url')}!9a`;
  const commonBackendEnv = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(apiPort),
    LOCAL_V2_MODE: 'true',
    LOCAL_V2_ADMIN_PASSWORD: adminPassword,
    LOCAL_V2_RESET_ADMIN_PASSWORD: 'true',
    CORS_ORIGINS: `http://127.0.0.1:${adminPort},http://127.0.0.1:${playerPort}`,
    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_PORT: process.env.DB_PORT || '3310',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'game2048_v2_local'
  };
  const processes = [
    start(process.execPath, ['tools/start-local-v2.js'], { cwd: backendRoot, env: commonBackendEnv, label: '后端' }),
    start(process.execPath, [path.join(frontendRoot, 'node_modules', 'vite', 'bin', 'vite.js'), '--host', '127.0.0.1', '--port', String(adminPort), '--strictPort'], {
      cwd: frontendRoot,
      env: { ...process.env, VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}` },
      label: '管理端'
    }),
    start(process.execPath, ['tools/local-v2-server.js'], {
      cwd: playerRoot,
      env: { ...process.env, PLAYER_PORT: String(playerPort), LOCAL_V2_API_PORT: String(apiPort) },
      label: '玩家端'
    })
  ];
  let browser;
  try {
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
    const adminEvidence = await runAdminBrowser(browser, `http://127.0.0.1:${adminPort}`, adminPassword);
    const playerEvidence = await runPlayerBrowser(browser, `http://127.0.0.1:${playerPort}`);
    const evidence = { realBackend: true, isolatedMySql: commonBackendEnv.DB_NAME, adminEvidence, playerEvidence };
    fs.writeFileSync(path.join(outputDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
    console.log('real-local-v2: PASS');
  } finally {
    if (browser) await browser.close();
    processes.forEach((child) => child.kill());
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
