# vibe-coding-lab

一个面向新手的最小前端练习仓库，用来体验从「提需求 → 改代码 → 验证 → 提交」的完整 Vibe Coding 流程。

## 快速开始

```bash
git clone https://github.com/wu89wj/vibe-coding-lab.git
cd vibe-coding-lab
python3 -m http.server 8000
```

打开：`http://localhost:8000/index.html`

## 功能列表

- 总点击次数
- 今日点击次数（按本地日期，跨天自动归零）
- 历史最高点击次数（单日）
- 重置总点击数（不清历史）
- 清空所有数据（`confirm` 二次确认）
- 暗黑模式切换（主题持久化）
- 最近 7 天趋势图（`canvas`，缺失日期按 0）

## localStorage keys

- `vibe-coding-lab-click-count`：总点击次数
- `vibe-coding-lab-theme`：主题（`light` / `dark`）
- `vibe-coding-lab-daily-stats`：每日统计对象（含 `currentDate`、`todayCount`、`historyMaxDailyCount`、`historyByDate`）

## 验收步骤

1. 点击“点我 +1”，总点击与今日点击递增。
2. 点击“重置总点击数”，仅总点击归零，历史统计不变。
3. 切换暗黑模式并刷新页面，主题保持一致。
4. 页面中确认存在 `<canvas id="history-chart">`，位于统计区下方且默认可见。
5. 清空或缺失 `historyByDate` 后刷新，图表仍显示（最近 7 天均为 0）。
6. 点击“清空所有数据”出现确认框；确认后所有统计与主题重置。

## GitHub Pages 发布

保持 Pages 设置为：`main` 分支 + `/(root)` 目录（Deploy from a branch）。
仓库根目录保留 `.nojekyll`，确保静态资源直接发布。
