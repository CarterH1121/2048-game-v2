# 2048-game-v2

玩家端 2048 H5，采用原生 HTML/CSS/JavaScript 的单文件 SPA。当前阶段是产品精修、移动端验收和工程收尾。

## 本地运行

```powershell
npm ci
python -m http.server 8080 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8080/index.html`。localhost 环境默认请求同源 `/api`，不会自动连接生产 API；没有本地 API 时会进入离线游客模式。

## 验证

```powershell
npm test
```

- `npm run test:static`：语法、核心模块、安全基线、缓存版本与历史备份存在性。
- `npm run test:browser`：真实 Chrome 中验证登录/游客、四方向移动合并、胜负、道具、主要面板、刷新恢复、离线缓存、横竖屏和指定移动端尺寸。
- 浏览器截图写入 `output/playwright/acceptance/`，该目录不纳入 Git。

## 关键文件

- `index.html`：玩家端真实主版本。
- `sw.js`：Service Worker 与离线 app shell。
- `tests/acceptance.js`：隔离 API 的浏览器验收。
- `CODEX_HANDOFF.md`：当前结构、历史版本关系、风险和接管结论。
- `AGENTS.md`：后续维护边界与验证约定。

部署和任何生产操作都不属于默认本地工作流，需另行明确授权。

`deploy.sh --check` 仅执行本地发布前门禁。实际 `deploy`/`rollback` 除明确生产授权外，还必须显式提供 `DEPLOY_SERVER` 与经只读映射确认的 `DEPLOY_REMOTE_PATH`；脚本不会猜测生产目录。
