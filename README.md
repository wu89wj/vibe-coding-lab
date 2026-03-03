# vibe-coding-lab

> README 维护规则：以后任何功能迭代，如果需要改 README，只允许向 `## Changelog` 追加，不要改稳定区文字（除非是 bugfix/纠错）。

## 稳定区（Stable Section）

### 项目简介

一个面向新手的最小前端练习仓库，用来体验从「提需求 → 改代码 → 验证 → 提交」的完整 Vibe Coding 流程。

### 功能列表

- 总点击次数
- 今日点击次数（按本地日期，跨天自动归零）
- 历史最高点击次数（单日）
- 重置总点击数（不清历史）
- 清空所有数据（`confirm` 二次确认）
- 暗黑模式切换（主题持久化）
- 最近 7 天趋势图（`canvas`，缺失日期按 0）

### 快速开始

```bash
git clone https://github.com/wu89wj/vibe-coding-lab.git
cd vibe-coding-lab
```

### 运行方式

```bash
python3 -m http.server 8000
```

打开：`http://localhost:8000/index.html`

### localStorage keys

- `vibe-coding-lab-click-count`：总点击次数
- `vibe-coding-lab-theme`：主题（`light` / `dark`）
- `vibe-coding-lab-daily-stats`：每日统计对象（含 `currentDate`、`todayCount`、`historyMaxDailyCount`、`historyByDate`）

### 验收步骤

1. 点击“点我 +1”，总点击与今日点击递增。
2. 点击“重置总点击数”，仅总点击归零，历史统计不变。
3. 切换暗黑模式并刷新页面，主题保持一致。
4. 页面中确认存在 `<canvas id="history-chart">`，位于统计区下方且默认可见。
5. 清空或缺失 `historyByDate` 后刷新，图表仍显示（最近 7 天均为 0）。
6. 点击“清空所有数据”出现确认框；确认后所有统计与主题重置。
7. 改系统日期验收：将系统日期从 `2026-03-03` 改到 `2026-03-04` 后回到页面（或刷新），`todayCount` 应归零，但 `historyByDate` 不应预先写入 `2026-03-04: 0`。
8. 在新日期点击“点我 +1”，应同时更新 `todayCount` 和 `historyByDate[今天]`，图表也应立即刷新显示新日期的点击值。

### GitHub Pages 发布

保持 Pages 设置为：`main` 分支 + `/(root)` 目录（Deploy from a branch）。
仓库根目录保留 `.nojekyll`，确保静态资源直接发布。

---

## Changelog

- 2026-03-03: add daily stats + max daily + clear-all + theme persistence
- 2026-03-03: add 7-day canvas chart (missing dates fallback to 0)
- 2026-03-03: split frontend into `index.html` + `app.js` + `style.css` to reduce merge conflicts
- 2026-03-03: fix cross-day date switch sync (do not prefill `historyByDate[today]=0`, refresh stats/chart on focus)
