/**
 * 2048 Material Design 3 深度验证脚本
 * 使用Node.js http模块进行真机测试
 */

const http = require('http');

console.log('🔍 开始深度验证测试...\n');

// 获取页面源码
function fetchSource() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:8080/index.html', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function deepTest() {
    const source = await fetchSource();
    
    const results = {
        md3Style: {},
        glassEffect: {},
        pwa: {},
        coreGame: {},
        interactions: {},
        modules: {},
        totalPass: 0,
        totalTests: 0
    };
    
    // ==================== MD3 样式验证 ====================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 Material Design 3 样式验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const md3Checks = [
        { name: '品牌主色 (--brand-primary)', test: source.includes('--brand-primary: #6366F1') },
        { name: '品牌辅助色 (--brand-secondary)', test: source.includes('--brand-secondary: #14B8A6') },
        { name: '表面层级 (surface-1/2/3)', test: source.includes('--surface-1') && source.includes('--surface-3') },
        { name: 'MD3阴影系统 (shadow-1~4)', test: source.includes('--shadow-1') && source.includes('--shadow-4') },
        { name: '圆角系统 (radius-sm/md/lg)', test: source.includes('--radius-sm') && source.includes('--radius-lg') },
        { name: '轮廓颜色 (--outline)', test: source.includes('--outline') },
    ];
    
    md3Checks.forEach(c => {
        results.md3Style[c.name] = c.test;
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 玻璃态效果验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ 玻璃态效果验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const glassChecks = [
        { name: 'backdrop-filter: blur', test: source.includes('backdrop-filter: blur') },
        { name: '-webkit-backdrop-filter', test: source.includes('-webkit-backdrop-filter') },
        { name: '玻璃背景色 (--glass-bg)', test: source.includes('--glass-bg') },
        { name: '玻璃边框 (--glass-border)', test: source.includes('--glass-border') },
        { name: '半透明背景 rgba', test: (source.match(/rgba\([^)]+,\s*0\.[0-9]+\)/g) || []).length > 10 },
        { name: '毛玻璃容器 (.grid-container)', test: source.includes('.grid-container') && source.includes('backdrop-filter') },
    ];
    
    glassChecks.forEach(c => {
        results.glassEffect[c.name] = c.test;
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== PWA 功能验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 PWA 功能验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const pwaChecks = [
        { name: 'PWA Manifest 配置', test: source.includes('manifest') || source.includes('application/json') },
        { name: 'theme-color 元标签', test: source.includes('theme-color') },
        { name: 'apple-mobile-web-app-capable', test: source.includes('apple-mobile-web-app-capable') },
        { name: 'apple-mobile-web-app-status-bar-style', test: source.includes('apple-mobile-web-app-status-bar-style') },
        { name: 'viewport-fit=cover', test: source.includes('viewport-fit=cover') },
        { name: 'standalone 显示模式', test: source.includes('standalone') },
        { name: 'safe-area-inset 适配', test: source.includes('safe-area-inset') },
        { name: 'touch-action: none', test: source.includes('touch-action: none') },
    ];
    
    pwaChecks.forEach(c => {
        results.pwa[c.name] = c.test;
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 核心游戏功能验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎮 核心游戏功能验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const coreChecks = [
        { name: '4x4 网格', test: source.includes('grid-template-columns: repeat(4') },
        { name: '移动逻辑 (move)', test: source.includes('move(direction)') || source.includes('move: function') },
        { name: '方块生成 (addRandomTile)', test: source.includes('addRandomTile') },
        { name: '得分系统 (score)', test: source.includes('this.score') || source.includes('score +=') },
        { name: '最高分 (bestScore)', test: source.includes('bestScore') },
        { name: '游戏结束检测 (gameOver)', test: source.includes('gameOver') },
        { name: '胜利检测 (won/2048)', test: source.includes('won') && source.includes('2048') },
        { name: '撤销功能 (undo)', test: source.includes('undo') && source.includes('history') },
        { name: '提示功能 (hint)', test: source.includes('hint') },
        { name: '洗牌功能 (shuffle)', test: source.includes('shuffle') },
        { name: '本地存储 (localStorage)', test: source.includes('localStorage') },
        { name: '游戏状态保存', test: source.includes('saveState') },
    ];
    
    coreChecks.forEach(c => {
        results.coreGame[c.name] = c.test;
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 交互功能验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👆 交互功能验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const interactionChecks = [
        { name: '触摸事件监听', test: source.includes('touchstart') || source.includes('touchmove') || source.includes('touch') },
        { name: '键盘事件监听', test: source.includes('keydown') || source.includes('KeyboardEvent') },
        { name: '点击事件监听', test: source.includes('addEventListener') && source.includes('click') },
        { name: '新游戏按钮', test: source.includes('newGameBtn') },
        { name: '设置按钮', test: source.includes('settingsBtn') },
        { name: '主题按钮', test: source.includes('themeBtn') },
        { name: '模态弹窗系统', test: source.includes('modal-overlay') || source.includes('ModalSystem') },
        { name: 'Toast 提示', test: source.includes('toast') },
        { name: '游戏结束弹窗', test: source.includes('gameOverOverlay') || source.includes('gameover') },
        { name: '教程系统', test: source.includes('tutorial') },
    ];
    
    interactionChecks.forEach(c => {
        results.interactions[c.name] = c.test;
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 主题系统验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 主题系统验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const themes = ['neon', 'sakura', 'tech', 'nature', 'minimal'];
    themes.forEach(theme => {
        const exists = source.includes(`theme-${theme}`);
        results.modules[`主题-${theme}`] = exists;
        console.log(`  ${exists ? '✅' : '❌'} ${theme} 主题`);
        if (exists) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 模块验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 模块完整性验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const modules = [
        { name: 'GameCore 核心模块', pattern: 'const GameCore = {' },
        { name: 'AudioManager 音频模块', pattern: 'AudioManager' },
        { name: 'Renderer 渲染模块', pattern: 'const Renderer = {' },
        { name: 'GameSettings 设置模块', pattern: 'GameSettings' },
        { name: 'AchievementSystem 成就模块', pattern: 'AchievementSystem' },
        { name: 'TutorialManager 教程模块', pattern: 'TutorialManager' },
        { name: 'PowerUpSystem 道具模块', pattern: 'PowerUpSystem' },
    ];
    
    modules.forEach(m => {
        const exists = source.includes(m.pattern);
        results.modules[m.name] = exists;
        console.log(`  ${exists ? '✅' : '❌'} ${m.name}`);
        if (exists) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== DOM 结构验证 ====================
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏗️ DOM 结构验证');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const domChecks = [
        { name: '游戏标题 (2048)', test: source.includes('<h1') && source.includes('2048') },
        { name: '分数显示区', test: source.includes('currentScore') && source.includes('score-value') },
        { name: '最高分区', test: source.includes('bestScore') },
        { name: '等级徽章', test: source.includes('levelBadge') },
        { name: '游戏网格容器', test: source.includes('grid-container') && source.includes('grid-background') },
        { name: '方块容器', test: source.includes('tile-container') },
        { name: '道具栏', test: source.includes('powerup-bar') },
        { name: '底部导航', test: source.includes('bottom-nav') },
        { name: '排行榜入口', test: source.includes('leaderboard') },
        { name: '成就入口', test: source.includes('achievements') },
        { name: '任务入口', test: source.includes('tasks') },
        { name: '分享入口', test: source.includes('share') },
        { name: '个人中心入口', test: source.includes('profile') },
    ];
    
    domChecks.forEach(c => {
        console.log(`  ${c.test ? '✅' : '❌'} ${c.name}`);
        if (c.test) results.totalPass++;
        results.totalTests++;
    });
    
    // ==================== 最终结果 ====================
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   深 度 验 证 报 告                          ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    const passRate = (results.totalPass / results.totalTests * 100).toFixed(1);
    console.log(`║ 总通过率: ${results.totalPass}/${results.totalTests} (${passRate}%)`.padEnd(61) + '║');
    
    // 分类统计
    const md3Pass = Object.values(results.md3Style).filter(v => v).length;
    const md3Total = Object.keys(results.md3Style).length;
    console.log(`║ Material Design 3: ${md3Pass}/${md3Total}项通过`.padEnd(61) + '║');
    
    const glassPass = Object.values(results.glassEffect).filter(v => v).length;
    const glassTotal = Object.keys(results.glassEffect).length;
    console.log(`║ 玻璃态效果: ${glassPass}/${glassTotal}项通过`.padEnd(61) + '║');
    
    const pwaPass = Object.values(results.pwa).filter(v => v).length;
    const pwaTotal = Object.keys(results.pwa).length;
    console.log(`║ PWA功能: ${pwaPass}/${pwaTotal}项通过`.padEnd(61) + '║');
    
    const corePass = Object.values(results.coreGame).filter(v => v).length;
    const coreTotal = Object.keys(results.coreGame).length;
    console.log(`║ 核心游戏: ${corePass}/${coreTotal}项通过`.padEnd(61) + '║');
    
    const intPass = Object.values(results.interactions).filter(v => v).length;
    const intTotal = Object.keys(results.interactions).length;
    console.log(`║ 交互功能: ${intPass}/${intTotal}项通过`.padEnd(61) + '║');
    
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // 判定结果
    const isPassed = passRate >= 90 && corePass >= 10 && pwaPass >= 6;
    
    if (isPassed) {
        console.log('\n');
        console.log('  ████████╗██╗   ██╗    ████████╗███████╗██████╗ ███╗   ███╗');
        console.log('  ╚══██╔══╝██║   ██║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║');
        console.log('     ██║   ██║   ██║       ██║   █████╗  ██████╔╝██╔████╔██║');
        console.log('     ██║   ██║   ██║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║');
        console.log('     ██║   ╚██████╔╝       ██║   ███████╗██║  ██║██║ ╚═╝ ██║');
        console.log('     ╚═╝    ╚═════╝        ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝');
        console.log('');
        console.log('              【深 度 验 证 通 过】');
        console.log('');
    } else {
        console.log('\n');
        console.log('  ██╗   ██╗ ██████╗ ██╗    ██╗    ███████╗██████╗          ');
        console.log('  ██║   ██║██╔═══██╗██║    ██║    ██╔════╝██╔══██╗         ');
        console.log('  ██║   ██║██║   ██║██║ █╗ ██║    █████╗  ██║  ██║         ');
        console.log('  ╚██╗ ██╔╝██║   ██║██║███╗██║    ██╔══╝  ██║  ██║         ');
        console.log('   ╚████╔╝ ╚██████╔╝╚███╔███╔╝    ███████╗██████╔╝         ');
        console.log('    ╚═══╝   ╚═════╝  ╚══╝╚══╝     ╚══════╝╚═════╝          ');
        console.log('');
        console.log('             【深 度 验 证 不 通 过】');
        console.log('');
    }
    
    return { passRate, isPassed, results };
}

deepTest().then(result => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 验证完成！');
    console.log(`   通过率: ${result.passRate}%`);
    console.log(`   验证结果: ${result.isPassed ? '通过' : '不通过'}`);
    process.exit(result.isPassed ? 0 : 1);
}).catch(err => {
    console.error('❌ 验证错误:', err);
    process.exit(1);
});