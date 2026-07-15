const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'output', 'playwright', 'acceptance');
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml'
};

function json(res, body, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
}

function handleApi(req, res, pathname) {
    if (pathname === '/api/user/login') return json(res, { user: { id: 2048, nickname: '测试玩家' } });
    if (pathname.startsWith('/api/items/user/')) {
        return json(res, { items: { undo: 1, hint: 3, shuffle: 2, bomb: 1, upgrade: 1, double: 1 } });
    }
    if (pathname === '/api/announcements') {
        return json(res, {
            announcements: [{ id: 1, type: 'update', title: '<img src=x onerror=alert(1)>', content: '<script>bad()</script>', created_at: '2026-07-15' }]
        });
    }
    if (pathname === '/api/leaderboard/global') {
        return json(res, { leaderboard: [{ user_id: 99, nickname: '<img src=x onerror=alert(1)>', score: 4096, max_tile: 512 }] });
    }
    if (pathname === '/api/sign/status') return json(res, { signedToday: false, continuousDays: 2, totalDays: 8 });
    if (pathname === '/api/sign/do') return json(res, { success: true, continuousDays: 3 });
    return json(res, { success: true });
}

function createServer() {
    return http.createServer((req, res) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        if (url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname);

        const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
        const file = path.resolve(root, relative);
        if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
            res.writeHead(403).end('Forbidden');
            return;
        }
        fs.readFile(file, (error, data) => {
            if (error) {
                res.writeHead(404).end('Not found');
                return;
            }
            res.writeHead(200, {
                'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream',
                'Cache-Control': 'no-store'
            });
            res.end(data);
        });
    });
}

async function configurePage(page) {
    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
            request.respond({ status: 204, body: '' });
        } else {
            request.continue();
        }
    });
}

async function closeModal(page) {
    await page.evaluate(() => document.getElementById('modalOverlay').click());
}

async function setGridAndMove(page, direction, cells) {
    return page.evaluate(({ direction, cells }) => {
        const game = eval('GameCore');
        game.grid = Array.from({ length: 4 }, () => Array(4).fill(null));
        game.score = 0;
        game.moveCount = 0;
        game.maxTile = 0;
        game.gameOver = false;
        game.won = false;
        game.history = [];
        for (const [row, col, value] of cells) {
            game.grid[row][col] = { id: ++game.tileIdCounter, value, row, col, isNew: false, mergedFrom: null };
            game.maxTile = Math.max(game.maxTile, value);
        }
        game.updateDisplay();
        const moved = game.move(direction);
        return {
            moved,
            score: game.score,
            moveCount: game.moveCount,
            tiles: game.grid.flat().filter(Boolean).map(({ row, col, value }) => ({ row, col, value }))
        };
    }, { direction, cells });
}

async function main() {
    fs.mkdirSync(outputDir, { recursive: true });
    const server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}`;
    const executablePath = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        puppeteer.executablePath(),
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ].find((candidate) => candidate && fs.existsSync(candidate));
    assert.ok(executablePath, 'Chrome/Chromium executable is required for browser acceptance');
    const browser = await puppeteer.launch({ headless: true, executablePath });
    const pageErrors = [];

    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(15000);
        await configurePage(page);
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await page.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        await page.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
        console.log('acceptance: initial page loaded');

        assert.equal(await page.$eval('#modalOverlay', (el) => el.classList.contains('active')), true, 'first load should ask for a nickname');
        await page.$eval('#nicknameInput', (input) => { input.value = '测试玩家'; });
        await page.click('#confirmNameBtn');
        await page.waitForFunction(() => (
            document.querySelectorAll('.grid-cell').length === 16
            && document.querySelectorAll('.tile').length === 2
            && !document.getElementById('modalOverlay').classList.contains('active')
        ));
        if (await page.$eval('#tutorialOverlay', (el) => el.classList.contains('active'))) await page.click('#tutorialSkip');

        assert.equal(await page.$$eval('.grid-cell', (els) => els.length), 16, 'board should contain 16 cells');
        assert.equal(await page.$$eval('.tile', (els) => els.length), 2, 'new game should start with two tiles');
        assert.equal(await page.evaluate(() => localStorage.getItem('api_user_mode')), 'account', 'successful login should persist account mode');
        console.log('acceptance: login and initial game passed');

        const moveCases = [
            ['left', [[0, 0, 2], [0, 1, 2]], [0, 0]],
            ['right', [[0, 2, 2], [0, 3, 2]], [0, 3]],
            ['up', [[0, 0, 2], [1, 0, 2]], [0, 0]],
            ['down', [[2, 0, 2], [3, 0, 2]], [3, 0]]
        ];
        for (const [direction, cells, expected] of moveCases) {
            const result = await setGridAndMove(page, direction, cells);
            assert.equal(result.moved, true, `${direction} should move`);
            assert.equal(result.score, 4, `${direction} should merge and score`);
            assert.ok(result.tiles.some((tile) => tile.row === expected[0] && tile.col === expected[1] && tile.value === 4), `${direction} should place merged tile correctly`);
        }
        console.log('acceptance: four-direction movement passed');

        const board = await page.$('.grid-container');
        const box = await board.boundingBox();
        for (let i = 0; i < 12; i++) {
            await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2, { steps: 2 });
            await page.mouse.up();
        }

        await setGridAndMove(page, 'right', [[0, 0, 2]]);
        await page.evaluate(() => { const p = eval('PowerupSystem'); p.undo = 1; p.updateDisplay(); });
        const undoState = await page.evaluate(() => {
            document.getElementById('undoBtn').click();
            const game = eval('GameCore');
            const powerups = eval('PowerupSystem');
            return { moveCount: game.moveCount, remaining: powerups.undo, history: game.history.length };
        });
        assert.deepEqual(undoState, { moveCount: 0, remaining: 0, history: 0 }, 'undo should restore the previous move and consume one item');

        await page.evaluate(() => { const p = eval('PowerupSystem'); p.hint = 1; p.shuffle = 1; p.updateDisplay(); });
        await page.click('#hintBtn');
        await page.click('#shuffleBtn');
        assert.deepEqual(await page.evaluate(() => { const p = eval('PowerupSystem'); return [p.hint, p.shuffle]; }), [0, 0], 'hint and shuffle should consume one item');

        await page.evaluate(() => { const p = eval('PowerupSystem'); p.double = 1; p.updateDisplay(); });
        await page.click('#doubleBtn');
        const doubled = await setGridAndMove(page, 'left', [[0, 0, 2], [0, 1, 2]]);
        assert.equal(doubled.score, 8, 'double item should double the next merge score');

        await page.evaluate(() => {
            const game = eval('GameCore');
            game.grid = Array.from({ length: 4 }, () => Array(4).fill(null));
            game.score = 0;
            game.gameOver = false;
            game.won = false;
            game.grid[0][0] = { id: ++game.tileIdCounter, value: 1024, row: 0, col: 0, isNew: false, mergedFrom: null };
            game.grid[0][1] = { id: ++game.tileIdCounter, value: 1024, row: 0, col: 1, isNew: false, mergedFrom: null };
            game.updateDisplay();
            game.move('left');
        });
        await page.waitForSelector('#gameOverOverlay.active');
        assert.equal(await page.$eval('#gameOverTitle', (el) => el.textContent), '恭喜通关!', '2048 merge should show victory state');
        await page.click('#restartBtn');

        await page.evaluate(() => {
            const game = eval('GameCore');
            const values = [[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]];
            game.grid = values.map((row, r) => row.map((value, c) => ({ id: ++game.tileIdCounter, value, row: r, col: c, isNew: false, mergedFrom: null })));
            game.gameOver = false;
            game.won = false;
            game.updateDisplay();
            game.move('left');
        });
        await page.waitForSelector('#gameOverOverlay.active');
        assert.equal(await page.$eval('#gameOverTitle', (el) => el.textContent), '游戏结束!', 'blocked grid should show failure state');
        await page.click('#restartBtn');
        console.log('acceptance: powerups and end states passed');

        const panels = [
            ['button[data-panel="leaderboard"]', '排行榜'],
            ['button[data-panel="achievements"]', '成就殿堂'],
            ['button[data-panel="tasks"]', '每日任务'],
            ['button[onclick*="showSkinPanel"]', '皮肤中心'],
            ['button[data-panel="share"]', '分享成绩'],
            ['button[data-panel="profile"]', '游戏数据统计']
        ];
        for (const [selector, title] of panels) {
            await page.click(selector);
            await page.waitForFunction((text) => document.getElementById('modalContent').textContent.includes(text), {}, title);
            await closeModal(page);
        }

        await page.click('button[data-panel="leaderboard"]');
        await page.waitForFunction(() => document.getElementById('leaderboardList').textContent.includes('<img'));
        assert.equal(await page.$('#leaderboardList img'), null, 'leaderboard data should be rendered as text, not executable HTML');
        await closeModal(page);
        await page.click('#announcementBtn');
        await page.waitForFunction(() => document.getElementById('modalContent').textContent.includes('<script>'));
        assert.equal(await page.$('#modalContent img'), null, 'announcement data should be rendered as text, not executable HTML');
        await closeModal(page);

        await page.click('#signinBtn');
        await page.waitForFunction(() => document.getElementById('modalContent').textContent.includes('每日签到'));
        await page.click('#modalContent button[onclick="UI.doSignin()"]');
        await page.waitForFunction(() => !document.getElementById('modalOverlay').classList.contains('active'));
        await new Promise((resolve) => setTimeout(resolve, 700));
        if (await page.$eval('#modalOverlay', (el) => el.classList.contains('active'))) await closeModal(page);

        await page.click('#settingsBtn');
        assert.ok((await page.$eval('#modalContent', (el) => el.textContent)).includes('已连接'), 'settings should show account connection state');
        await closeModal(page);
        console.log('acceptance: panels and API rendering passed');

        const viewports = [[360,800],[375,812],[390,844],[430,932]];
        const viewportResults = [];
        await page.evaluate(() => { document.getElementById('confettiContainer').innerHTML = ''; });
        for (const [width, height] of viewports) {
            await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
            await new Promise((resolve) => setTimeout(resolve, 80));
            const metrics = await page.evaluate(() => {
                const boardRect = document.querySelector('.grid-container').getBoundingClientRect();
                const navRect = document.querySelector('.bottom-nav').getBoundingClientRect();
                const powerRect = document.querySelector('.powerup-bar').getBoundingClientRect();
                const toggleRect = document.getElementById('powerupToggle').getBoundingClientRect();
                const newGameRect = document.getElementById('newGameBtn').getBoundingClientRect();
                const headerButtons = [...document.querySelectorAll('.icon-btn')].map((el) => el.getBoundingClientRect());
                return {
                    overflowX: document.documentElement.scrollWidth > innerWidth,
                    boardWidth: Math.round(boardRect.width),
                    boardBottom: Math.round(boardRect.bottom),
                    powerBottom: Math.round(powerRect.bottom),
                    navTop: Math.round(navRect.top),
                    powerControlsVisible: toggleRect.left >= 0 && newGameRect.right <= innerWidth,
                    minHeaderTouch: Math.min(...headerButtons.map((rect) => Math.min(rect.width, rect.height)))
                };
            });
            assert.equal(metrics.overflowX, false, `${width}x${height} should not overflow horizontally`);
            assert.ok(metrics.boardBottom < metrics.navTop && metrics.powerBottom <= metrics.navTop, `${width}x${height} board and powerups should not be covered by navigation`);
            assert.equal(metrics.powerControlsVisible, true, `${width}x${height} powerup toggle and new-game controls should stay in view`);
            assert.ok(metrics.minHeaderTouch >= 44, `${width}x${height} header touch targets should be at least 44px`);
            viewportResults.push({ viewport: `${width}x${height}`, ...metrics });
            await page.screenshot({ path: path.join(outputDir, `${width}x${height}.png`) });
        }
        console.log('acceptance: portrait viewports passed');

        await page.setViewport({ width: 800, height: 360, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        await new Promise((resolve) => setTimeout(resolve, 80));
        const landscape = await page.evaluate(() => {
            const board = document.querySelector('.grid-container').getBoundingClientRect();
            const nav = document.querySelector('.bottom-nav').getBoundingClientRect();
            const power = document.querySelector('.powerup-bar').getBoundingClientRect();
            return { board: { top: board.top, bottom: board.bottom }, power: { top: power.top, bottom: power.bottom }, navTop: nav.top };
        });
        assert.ok(landscape.board.bottom <= landscape.navTop, 'landscape board should be fully visible');
        assert.ok(landscape.power.bottom <= landscape.navTop, 'landscape powerups should be fully visible');
        await page.screenshot({ path: path.join(outputDir, '800x360-landscape.png') });
        console.log('acceptance: landscape passed');

        await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
        await page.keyboard.press('ArrowLeft');
        const savedState = await page.evaluate(() => JSON.parse(localStorage.getItem('2048-game-state')));
        await page.reload({ waitUntil: 'domcontentloaded' });
        const restoredState = await page.evaluate(() => JSON.parse(localStorage.getItem('2048-game-state')));
        for (const key of ['grid', 'score', 'moveCount', 'maxTile', 'gameSessionId', 'mode']) {
            assert.deepEqual(restoredState[key], savedState[key], `refresh should preserve game state field: ${key}`);
        }
        console.log('acceptance: refresh restore passed');

        await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration())?.active));
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
        const cacheNames = await page.evaluate(() => caches.keys());
        assert.ok(cacheNames.some((name) => /^2048-v2-cache-\d{8}-\d+$/.test(name)), 'versioned app-shell cache should be installed');
        await page.setOfflineMode(true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        assert.equal(await page.$$eval('.grid-cell', (els) => els.length), 16, 'service worker should restore the game shell offline');
        await page.setOfflineMode(false);
        console.log('acceptance: service worker offline restore passed');

        const guestContext = await browser.createBrowserContext();
        const guestPage = await guestContext.newPage();
        await configurePage(guestPage);
        guestPage.setDefaultTimeout(10000);
        guestPage.setDefaultNavigationTimeout(15000);
        await guestPage.setViewport({ width: 360, height: 800, isMobile: true, hasTouch: true });
        await guestPage.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
        await guestPage.setOfflineMode(true);
        await guestPage.click('#confirmNameBtn');
        await guestPage.waitForFunction(() => localStorage.getItem('api_user_mode') === 'guest');
        assert.equal(await guestPage.$$eval('.grid-cell', (els) => els.length), 16, 'API failure should still enter a playable guest mode');
        await guestPage.setOfflineMode(false);
        await guestContext.close();
        console.log('acceptance: offline guest fallback passed');

        assert.deepEqual(pageErrors, [], `browser should not emit page errors: ${pageErrors.join('; ')}`);
        const performance = await page.evaluate(() => ({
            domInteractive: Math.round(performance.getEntriesByType('navigation')[0]?.domInteractive || 0),
            resources: performance.getEntriesByType('resource').length
        }));
        console.log(JSON.stringify({ viewports: viewportResults, landscape, cacheNames, performance }, null, 2));
        console.log('acceptance: PASS');
    } finally {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
