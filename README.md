# vibe-coding-lab

一个面向新手的最小前端练习仓库，用来体验从「提需求 → 改代码 → 验证 → 提交」的完整 Vibe Coding 流程。

当前示例页面包含：
- `Hello Vibe Coding` 标题展示
- 总点击次数
- 今日点击次数（按本地日期 `YYYY-MM-DD`，跨天自动归零）
- 历史最高点击次数（单日）
- 重置总点击数（不清历史）
- 清空所有数据（`confirm` 二次确认）
- 亮色 / 暗黑模式切换（支持主题记忆）
- 最近 7 天点击图表（基于 `historyByDate`，缺失日期按 0）

## 快速开始（3分钟）

### 1) 克隆仓库

```bash
git clone https://github.com/wu89wj/vibe-coding-lab.git
cd vibe-coding-lab
```

### 2) 运行示例页面

你有两种方式：

- **直接打开**：用浏览器打开 `index.html`
- **本地服务（推荐）**：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000/index.html
```

## 数据存储结构（localStorage keys）

页面使用以下 key：

1. `vibe-coding-lab-click-count`（字符串数字）
   - 记录总点击次数
2. `vibe-coding-lab-theme`（`light` / `dark`）
   - 记录主题模式
3. `vibe-coding-lab-daily-stats`（JSON）
   - 结构如下：

```json
{
  "currentDate": "2026-01-15",
  "todayCount": 12,
  "historyMaxDailyCount": 30,
  "historyByDate": {
    "2026-01-14": 30,
    "2026-01-15": 12
  }
}
```

说明：
- `todayCount` 会在跨天时自动归零（本地日期变化触发）
- `historyByDate` 保留历史每日记录
- `historyMaxDailyCount` 记录历史单日最高值
- 图表读取最近 7 天（含今天）日期并展示，若某天无数据则显示 0

---

## 功能验收清单

按下面步骤快速确认功能都正常：

1. **总点击数**
   - 点击“点我 +1”后，总点击次数递增。
2. **今日点击数**
   - 点击“点我 +1”后，今日点击次数同步递增。
3. **历史最高（单日）**
   - 当今日点击次数超过历史最大值时，“历史最高点击次数（单日）”同步更新。
4. **重置总点击数**
   - 点击“重置总点击数”后，总点击变为 `0`；今日与历史统计不变。
5. **暗黑模式持久化**
   - 切换暗黑模式后刷新页面，主题保持不变。
6. **清空所有数据（二次确认）**
   - 点击“清空所有数据”时应先弹出确认框；确认后总点击、今日点击、历史最高、主题都重置。
7. **跨天自动归零（今日点击）**
   - 在浏览器 DevTools 中将 `vibe-coding-lab-daily-stats.currentDate` 改为前一天并刷新，今日点击应重置为 `0`，历史数据仍保留。
8. **如何造出历史数据（用于图表验证）**
   - 打开 DevTools → Application → Local Storage。
   - 编辑 `vibe-coding-lab-daily-stats` 的 `historyByDate`，手动写入最近几天数据，例如：
     - `"2026-01-10": 2`
     - `"2026-01-11": 8`
     - `"2026-01-12": 3`
   - 保存后刷新页面，图表应显示对应柱状变化。
9. **验证图表更新与主题可读性**
   - 点击“点我 +1”后，今天对应的柱子数值应增加。
   - 切换暗黑/浅色模式，图表坐标、网格、柱子颜色应保持清晰可读。
   - 若最近 7 天某些日期没有写入数据，对应柱子应显示为 0。

---

## GitHub Pages 发布设置（无构建）

本仓库是纯静态页面，不需要 GitHub Actions 构建流程。

请在仓库 **Settings → Pages** 中确认：
- **Source**: `Deploy from a branch`
- **Branch**: `main`
- **Folder**: `/(root)`

仓库含 `.nojekyll`，用于禁用 Jekyll 处理。

### 线上验证

1. 推送 `main` 最新代码后，等待 1~3 分钟。
2. 访问：`https://wu89wj.github.io/vibe-coding-lab/`
3. 页面应能看到：
   - `重置总点击数` 按钮
   - `清空所有数据` 按钮
   - `暗黑模式` 开关按钮（🌙/☀️）
   - `今日点击次数` 与 `历史最高点击次数（单日）`

---

## 用 Codex 的推荐工作流

### Step 1：把需求写清楚
建议用这个结构提任务：

- **目标**：你想实现什么
- **验收标准**：如何算完成
- **限制条件**：是否能引入依赖、文件数量限制等
- **输出要求**：要不要测试命令、提交信息、PR 描述

### Step 2：让 Codex 执行并查看结果
- 查看改动文件
- 看是否包含验证命令
- 确认是否满足验收标准

### Step 3：本地手动验证
至少做这几件事：
- 页面能打开
- 新功能能操作
- 刷新后状态符合预期
- 控制台无报错

### Step 4：提交与迭代
- 让 Codex 生成清晰 commit
- 如需协作，创建 PR 并补充变更说明
- 再提下一轮小任务（一次一个小目标最好）

---

## 新手入口文档

请先阅读：[`ONBOARDING.md`](./ONBOARDING.md)
