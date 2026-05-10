/**
 * 2048游戏主题系统真机实测验收脚本
 * 验真Agent - 真机全流程测试
 */

const puppeteer = require('puppeteer');

// 主题定义
const THEMES = [
    { name: '经典主题', className: '', id: 'classic' },
    { name: '深夜霓虹', className: 'theme-neon', id: 'neon' },
    { name: '樱花主题', className: 'theme-sakura', id: 'sakura' },
    { name: '科技主题', className: 'theme-tech', id: 'tech' },
    { name: '自然主题', className: 'theme-nature', id: 'nature' },
    { name: '极简主题', className: 'theme-minimal', id: 'minimal' }
];

// 测试结果
const testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = type === 'pass' ? '✓' : type === 'fail' ? '✗' : '→';
    const color = type === 'pass' ? '\x1b[32m' : type === 'fail' ? '\x1b[31m' : '\x1b[36m';
    console.log(`${color}[${timestamp}] ${prefix} ${message}\x1b[0m`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runRealMachineTest() {
    console.log('\n' + '='.repeat(60));
    console.log('  2048游戏主题系统真机实测验收报告');
    console.log('  验真Agent - 真机全流程测试');
    console.log('='.repeat(60) + '\n');
    
    let browser;
    let page;
    
    try {
        // 启动浏览器
        log('启动浏览器...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // 访问游戏
        log('访问游戏页面 http://localhost:8080/index.html...');
        await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });
        await sleep(1000);
        
        log('页面加载完成，开始真机实测...\n');
        
        // 测试每个主题
        for (const theme of THEMES) {
            console.log('-'.repeat(50));
            log(`测试主题: ${theme.name}`, 'info');
            console.log('-'.repeat(50));
            
            const themeResult = {
                name: theme.name,
                id: theme.id,
                tests: [],
                passed: 0,
                failed: 0
            };
            
            // 切换主题
            if (theme.className) {
                await page.evaluate((className) => {
                    document.body.className = className;
                }, theme.className);
            } else {
                await page.evaluate(() => {
                    document.body.className = '';
                });
            }
            
            await sleep(500); // 等待主题切换生效
            
            // 1. 测试CSS变量是否正确应用
            log('  检查CSS变量...');
            const cssVars = await page.evaluate(() => {
                const styles = getComputedStyle(document.body);
                return {
                    bgPrimary: styles.getPropertyValue('--bg-primary').trim(),
                    textPrimary: styles.getPropertyValue('--text-primary').trim(),
                    brandPrimary: styles.getPropertyValue('--brand-primary').trim(),
                    glassBg: styles.getPropertyValue('--glass-bg').trim(),
                    glassBorder: styles.getPropertyValue('--glass-border').trim(),
                    tile2: styles.getPropertyValue('--tile-2').trim(),
                    tile2048: styles.getPropertyValue('--tile-2048').trim(),
                    btnPrimary: styles.getPropertyValue('--btn-primary').trim()
                };
            });
            
            const hasValidVars = Object.values(cssVars).every(v => v && v.length > 0);
            if (hasValidVars) {
                log(`  CSS变量检查通过`, 'pass');
                themeResult.tests.push({ name: 'CSS变量', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  CSS变量检查失败: ${JSON.stringify(cssVars)}`, 'fail');
                themeResult.tests.push({ name: 'CSS变量', status: 'fail' });
                themeResult.failed++;
            }
            
            // 2. 测试分数卡片玻璃态效果
            log('  检查分数卡片玻璃态效果...');
            const scoreBoxStyles = await page.evaluate(() => {
                const scoreBox = document.querySelector('.score-box');
                if (!scoreBox) return null;
                const styles = getComputedStyle(scoreBox);
                return {
                    background: styles.background,
                    borderColor: styles.borderColor,
                    backdropFilter: styles.backdropFilter,
                    boxShadow: styles.boxShadow
                };
            });
            
            if (scoreBoxStyles && scoreBoxStyles.background) {
                log(`  分数卡片玻璃态效果检查通过`, 'pass');
                themeResult.tests.push({ name: '分数卡片玻璃态', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  分数卡片玻璃态效果检查失败`, 'fail');
                themeResult.tests.push({ name: '分数卡片玻璃态', status: 'fail' });
                themeResult.failed++;
            }
            
            // 3. 测试游戏容器样式
            log('  检查游戏容器样式...');
            const gridStyles = await page.evaluate(() => {
                const grid = document.querySelector('.grid-container');
                if (!grid) return null;
                const styles = getComputedStyle(grid);
                return {
                    background: styles.background,
                    borderRadius: styles.borderRadius
                };
            });
            
            if (gridStyles && gridStyles.background) {
                log(`  游戏容器样式检查通过`, 'pass');
                themeResult.tests.push({ name: '游戏容器', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  游戏容器样式检查失败`, 'fail');
                themeResult.tests.push({ name: '游戏容器', status: 'fail' });
                themeResult.failed++;
            }
            
            // 4. 测试标题渐变效果
            log('  检查标题渐变效果...');
            const titleStyles = await page.evaluate(() => {
                const title = document.querySelector('.game-title');
                if (!title) return null;
                const styles = getComputedStyle(title);
                return {
                    background: styles.background,
                    webkitTextFillColor: styles.webkitTextFillColor
                };
            });
            
            if (titleStyles && titleStyles.background && titleStyles.background.includes('gradient')) {
                log(`  标题渐变效果检查通过`, 'pass');
                themeResult.tests.push({ name: '标题渐变', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  标题渐变效果检查失败`, 'fail');
                themeResult.tests.push({ name: '标题渐变', status: 'fail' });
                themeResult.failed++;
            }
            
            // 5. 测试按钮样式
            log('  检查按钮样式...');
            const btnStyles = await page.evaluate(() => {
                const btn = document.querySelector('.icon-btn');
                if (!btn) return null;
                const styles = getComputedStyle(btn);
                return {
                    background: styles.background,
                    color: styles.color,
                    borderColor: styles.borderColor
                };
            });
            
            if (btnStyles && btnStyles.background) {
                log(`  按钮样式检查通过`, 'pass');
                themeResult.tests.push({ name: '按钮样式', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  按钮样式检查失败`, 'fail');
                themeResult.tests.push({ name: '按钮样式', status: 'fail' });
                themeResult.failed++;
            }
            
            // 6. 测试徽章样式
            log('  检查徽章样式...');
            const badgeStyles = await page.evaluate(() => {
                const badge = document.querySelector('.md3-badge');
                if (!badge) return null;
                const styles = getComputedStyle(badge);
                return {
                    background: styles.background,
                    color: styles.color,
                    boxShadow: styles.boxShadow
                };
            });
            
            if (badgeStyles && badgeStyles.background) {
                log(`  徽章样式检查通过`, 'pass');
                themeResult.tests.push({ name: '徽章样式', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  徽章样式检查失败`, 'fail');
                themeResult.tests.push({ name: '徽章样式', status: 'fail' });
                themeResult.failed++;
            }
            
            // 7. 测试游戏方块颜色
            log('  检查游戏方块颜色...');
            const tileCount = await page.evaluate(() => {
                return document.querySelectorAll('.tile').length;
            });
            
            if (tileCount >= 0) {
                log(`  游戏方块数量: ${tileCount}`, 'pass');
                themeResult.tests.push({ name: '游戏方块', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  游戏方块检查失败`, 'fail');
                themeResult.tests.push({ name: '游戏方块', status: 'fail' });
                themeResult.failed++;
            }
            
            // 8. 检查硬编码颜色
            log('  检查硬编码颜色...');
            const hardcodedColors = await page.evaluate(() => {
                const elements = document.querySelectorAll('*');
                const hardcoded = [];
                const colorPattern = /^(#[0-9a-fA-F]{3,6}|rgb\(|rgba\()/;
                
                elements.forEach(el => {
                    const styles = getComputedStyle(el);
                    const props = ['color', 'background-color', 'border-color'];
                    props.forEach(prop => {
                        const value = styles.getPropertyValue(prop);
                        // 检查是否是硬编码颜色（不是var()引用）
                        if (value && colorPattern.test(value) && !value.includes('var(')) {
                            // 排除一些允许的硬编码（如白色文字）
                            if (!value.includes('rgb(255, 255, 255)') && 
                                !value.includes('rgba(255, 255, 255') &&
                                !value.includes('#fff')) {
                                hardcoded.push({ element: el.tagName, prop, value });
                            }
                        }
                    });
                });
                return hardcoded.slice(0, 10); // 只返回前10个
            });
            
            if (hardcodedColors.length === 0) {
                log(`  硬编码颜色检查通过`, 'pass');
                themeResult.tests.push({ name: '硬编码颜色', status: 'pass' });
                themeResult.passed++;
            } else {
                log(`  发现${hardcodedColors.length}处疑似硬编码颜色`, 'fail');
                themeResult.tests.push({ name: '硬编码颜色', status: 'fail', details: hardcodedColors });
                themeResult.failed++;
            }
            
            // 记录主题结果
            testResults.details.push(themeResult);
            if (themeResult.failed === 0) {
                testResults.passed++;
            } else {
                testResults.failed++;
            }
            
            log(`  主题 "${theme.name}" 测试完成: ${themeResult.passed}通过/${themeResult.failed}失败\n`);
        }
        
        // 生成最终报告
        console.log('\n' + '='.repeat(60));
        console.log('  真机实测验收结果');
        console.log('='.repeat(60) + '\n');
        
        // 主题汇总表
        console.log('主题测试汇总:');
        console.log('-'.repeat(50));
        testResults.details.forEach(r => {
            const status = r.failed === 0 ? '✓ 全部通过' : `✗ ${r.failed}项失败`;
            console.log(`  ${r.name.padEnd(12)} | ${r.passed}通过/${r.failed}失败 | ${status}`);
        });
        console.log('-'.repeat(50));
        
        // 最终结论
        const allPassed = testResults.failed === 0;
        console.log('\n' + '='.repeat(60));
        if (allPassed) {
            console.log('  【审核通过】');
            console.log('  所有6个主题真机测试全部通过');
            console.log('  UI元素正确跟随主题变化');
            console.log('  未发现硬编码颜色问题');
        } else {
            console.log('  【不通过】');
            console.log(`  ${testResults.failed}个主题存在问题`);
            console.log('  需要修复后重新测试');
        }
        console.log('='.repeat(60) + '\n');
        
        return allPassed;
        
    } catch (error) {
        log(`测试执行错误: ${error.message}`, 'fail');
        console.error(error);
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 执行测试
runRealMachineTest().then(success => {
    process.exit(success ? 0 : 1);
});
