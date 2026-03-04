console.log("[app] loaded");

const COUNT_STORAGE_KEY = "vibe-coding-lab-click-count";
const THEME_STORAGE_KEY = "vibe-coding-lab-theme";
const DAILY_STATS_STORAGE_KEY = "vibe-coding-lab-daily-stats";
const BEST_STREAK_STORAGE_KEY = "vibe-coding-lab-best-streak";

const PROJECT_STORAGE_KEYS = [COUNT_STORAGE_KEY, THEME_STORAGE_KEY, DAILY_STATS_STORAGE_KEY];

let countElement;
let todayCountElement;
let maxDailyCountElement;
let streakElement;
let bestStreakElement;
let historyChart;
let incrementButton;
let resetButton;
let themeToggleButton;
let clearAllButton;
let exportButton;
let importButton;
let importFileInput;
let importMessageElement;

let count = 0;
let theme = "light";
let dailyStats;
let bestStreak = 0;

function getDateStringByOffset(offsetDays) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDateString() {
  return getDateStringByOffset(0);
}

function parseCount(value) {
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function showImportMessage(message, type) {
  if (!importMessageElement) return;
  importMessageElement.textContent = message;
  importMessageElement.className = `message ${type}`;
}

function getDefaultDailyStats() {
  return {
    currentDate: getTodayDateString(),
    todayCount: 0,
    historyMaxDailyCount: 0,
    historyByDate: {},
  };
}

function normalizeHistoryByDate(rawHistoryByDate) {
  const normalized = {};
  if (!rawHistoryByDate || typeof rawHistoryByDate !== "object") {
    return normalized;
  }

  Object.entries(rawHistoryByDate).forEach(([date, value]) => {
    normalized[date] = parseCount(String(value));
  });
  return normalized;
}

function loadDailyStats() {
  const raw = localStorage.getItem(DAILY_STATS_STORAGE_KEY);
  if (!raw) {
    return getDefaultDailyStats();
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      currentDate: typeof parsed.currentDate === "string" ? parsed.currentDate : getTodayDateString(),
      todayCount: parseCount(String(parsed.todayCount ?? "0")),
      historyMaxDailyCount: parseCount(String(parsed.historyMaxDailyCount ?? "0")),
      historyByDate: normalizeHistoryByDate(parsed.historyByDate),
    };
  } catch {
    return getDefaultDailyStats();
  }
}

function normalizeDailyStatsForToday() {
  const today = getTodayDateString();
  if (dailyStats.currentDate !== today) {
    dailyStats.currentDate = today;
    dailyStats.todayCount = 0;
    persistDailyStats();
    return true;
  }
  return false;
}

function syncDateAndRefresh() {
  const didDateChange = normalizeDailyStatsForToday();
  if (didDateChange) {
    renderCounts();
    drawRecentHistoryChart();
  }
}

function getRecentSevenDaysData() {
  const data = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = getDateStringByOffset(offset);
    data.push({
      date,
      count: parseCount(String(dailyStats.historyByDate[date] ?? "0")),
    });
  }
  return data;
}

function calculateCurrentStreak() {
  // streak：从今天向前逐天检查，点击数 > 0 连续累加，遇到 0/缺失即停止。
  let streak = 0;
  for (let offset = 0; ; offset += 1) {
    const date = getDateStringByOffset(-offset);
    const countForDate = parseCount(String(dailyStats.historyByDate[date] ?? "0"));
    if (countForDate > 0) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

function calculateBestStreakFromHistory() {
  // bestStreak：扫描历史日期，找点击数 > 0 的最长连续日期段。
  const positiveDates = Object.entries(dailyStats.historyByDate)
    .filter(([, value]) => parseCount(String(value)) > 0)
    .map(([date]) => date)
    .sort();

  if (positiveDates.length === 0) {
    return 0;
  }

  let best = 1;
  let current = 1;

  for (let i = 1; i < positiveDates.length; i += 1) {
    const prev = new Date(`${positiveDates[i - 1]}T00:00:00`);
    const curr = new Date(`${positiveDates[i]}T00:00:00`);
    const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

function persistBestStreak() {
  localStorage.setItem(BEST_STREAK_STORAGE_KEY, String(bestStreak));
}

function drawRecentHistoryChart() {
  if (!historyChart) return;
  const ctx = historyChart.getContext("2d");
  const data = getRecentSevenDaysData();

  const styles = getComputedStyle(document.body);
  const gridColor = styles.getPropertyValue("--chart-grid-color").trim();
  const axisColor = styles.getPropertyValue("--chart-axis-color").trim();
  const barColor = styles.getPropertyValue("--chart-bar-color").trim();
  const labelColor = styles.getPropertyValue("--chart-label-color").trim();

  const cssWidth = historyChart.clientWidth || 560;
  const cssHeight = historyChart.clientHeight || 220;
  const dpr = window.devicePixelRatio || 1;
  historyChart.width = Math.floor(cssWidth * dpr);
  historyChart.height = Math.floor(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const margin = { top: 16, right: 10, bottom: 28, left: 34 };
  const plotWidth = cssWidth - margin.left - margin.right;
  const plotHeight = cssHeight - margin.top - margin.bottom;
  const maxValue = Math.max(...data.map((item) => item.count), 1);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = margin.top + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + plotWidth, y);
    ctx.stroke();
  }

  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotHeight);
  ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
  ctx.stroke();

  const slotWidth = plotWidth / data.length;
  const barWidth = Math.max(slotWidth * 0.56, 10);
  ctx.fillStyle = barColor;

  data.forEach((item, index) => {
    const normalized = item.count / maxValue;
    const barHeight = normalized * (plotHeight - 4);
    const x = margin.left + slotWidth * index + (slotWidth - barWidth) / 2;
    const y = margin.top + plotHeight - barHeight;
    ctx.fillRect(x, y, barWidth, barHeight);
  });

  ctx.fillStyle = labelColor;
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";

  data.forEach((item, index) => {
    const x = margin.left + slotWidth * index + slotWidth / 2;
    const shortDate = item.date.slice(5);
    ctx.fillText(shortDate, x, margin.top + plotHeight + 16);
    ctx.fillText(String(item.count), x, margin.top + plotHeight - 6);
  });
}

function renderCounts() {
  if (!countElement) return;
  countElement.textContent = String(count);
  todayCountElement.textContent = String(dailyStats.todayCount);
  maxDailyCountElement.textContent = String(dailyStats.historyMaxDailyCount);
  const currentStreak = calculateCurrentStreak();
  bestStreak = Math.max(bestStreak, calculateBestStreakFromHistory());
  streakElement.textContent = String(currentStreak);
  bestStreakElement.textContent = String(bestStreak);
  persistBestStreak();
}

function persistCount() {
  localStorage.setItem(COUNT_STORAGE_KEY, String(count));
}

function persistDailyStats() {
  localStorage.setItem(DAILY_STATS_STORAGE_KEY, JSON.stringify(dailyStats));
}

function persistTheme() {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function renderTheme() {
  document.body.classList.toggle("theme-dark", theme === "dark");
  if (themeToggleButton) {
    themeToggleButton.textContent = theme === "dark" ? "☀️ 暗黑模式：开" : "🌙 暗黑模式：关";
  }
  drawRecentHistoryChart();
}

function incrementCounters() {
  normalizeDailyStatsForToday();

  count += 1;
  dailyStats.todayCount += 1;
  const today = dailyStats.currentDate;
  dailyStats.historyByDate[today] = dailyStats.todayCount;

  if (dailyStats.todayCount > dailyStats.historyMaxDailyCount) {
    dailyStats.historyMaxDailyCount = dailyStats.todayCount;
  }

  renderCounts();
  drawRecentHistoryChart();
  persistCount();
  persistDailyStats();
}

function clearAllData() {
  localStorage.removeItem(COUNT_STORAGE_KEY);
  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.removeItem(DAILY_STATS_STORAGE_KEY);

  count = 0;
  theme = "light";
  dailyStats = getDefaultDailyStats();
  bestStreak = 0;

  renderCounts();
  renderTheme();
}

function exportProjectData() {
  console.log("[export] clicked");
  try {
    const payload = {
      exportedAt: new Date().toISOString(),
      data: {
        [COUNT_STORAGE_KEY]: localStorage.getItem(COUNT_STORAGE_KEY) ?? "0",
        [THEME_STORAGE_KEY]: localStorage.getItem(THEME_STORAGE_KEY) ?? "light",
        [DAILY_STATS_STORAGE_KEY]:
          localStorage.getItem(DAILY_STATS_STORAGE_KEY) ?? JSON.stringify(getDefaultDailyStats()),
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibe-coding-lab-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showImportMessage("导出成功：备份文件已下载。", "success");
  } catch (error) {
    console.error("[export] failed", error);
    alert("导出失败，请打开控制台查看错误详情。");
  }
}

function validateBackupObject(backupObject) {
  if (!backupObject || typeof backupObject !== "object" || Array.isArray(backupObject)) {
    return "备份文件格式错误：根节点必须是对象。";
  }

  if (!backupObject.data || typeof backupObject.data !== "object" || Array.isArray(backupObject.data)) {
    return "备份文件格式错误：缺少 data 对象。";
  }

  const data = backupObject.data;
  for (const key of PROJECT_STORAGE_KEYS) {
    if (!(key in data)) {
      return `备份文件缺少必要字段：${key}`;
    }
  }

  if (typeof data[COUNT_STORAGE_KEY] !== "string") {
    return `${COUNT_STORAGE_KEY} 类型错误，应为字符串数字。`;
  }

  if (typeof data[THEME_STORAGE_KEY] !== "string" || !["light", "dark"].includes(data[THEME_STORAGE_KEY])) {
    return `${THEME_STORAGE_KEY} 类型错误，应为 light 或 dark。`;
  }

  if (typeof data[DAILY_STATS_STORAGE_KEY] !== "string") {
    return `${DAILY_STATS_STORAGE_KEY} 类型错误，应为 JSON 字符串。`;
  }

  let parsedDailyStats;
  try {
    parsedDailyStats = JSON.parse(data[DAILY_STATS_STORAGE_KEY]);
  } catch {
    return `${DAILY_STATS_STORAGE_KEY} 解析失败，不是合法 JSON。`;
  }

  if (!parsedDailyStats || typeof parsedDailyStats !== "object" || Array.isArray(parsedDailyStats)) {
    return `${DAILY_STATS_STORAGE_KEY} 内容错误：应为对象。`;
  }

  if (typeof parsedDailyStats.currentDate !== "string") {
    return "daily-stats.currentDate 类型错误，应为字符串。";
  }
  if (typeof parsedDailyStats.todayCount !== "number") {
    return "daily-stats.todayCount 类型错误，应为数字。";
  }
  if (typeof parsedDailyStats.historyMaxDailyCount !== "number") {
    return "daily-stats.historyMaxDailyCount 类型错误，应为数字。";
  }
  if (
    !parsedDailyStats.historyByDate ||
    typeof parsedDailyStats.historyByDate !== "object" ||
    Array.isArray(parsedDailyStats.historyByDate)
  ) {
    return "daily-stats.historyByDate 类型错误，应为对象。";
  }

  for (const value of Object.values(parsedDailyStats.historyByDate)) {
    if (typeof value !== "number") {
      return "daily-stats.historyByDate 的值必须全部为数字。";
    }
  }

  return null;
}

function applyImportedBackup(backupObject) {
  const validationError = validateBackupObject(backupObject);
  if (validationError) {
    const message = `导入失败：${validationError}`;
    showImportMessage(message, "error");
    alert(message);
    return;
  }

  const shouldOverwrite = confirm("将覆盖当前数据，是否继续");
  if (!shouldOverwrite) {
    showImportMessage("已取消导入。", "info");
    return;
  }

  const data = backupObject.data;
  localStorage.setItem(COUNT_STORAGE_KEY, data[COUNT_STORAGE_KEY]);
  localStorage.setItem(THEME_STORAGE_KEY, data[THEME_STORAGE_KEY]);
  localStorage.setItem(DAILY_STATS_STORAGE_KEY, data[DAILY_STATS_STORAGE_KEY]);

  count = parseCount(localStorage.getItem(COUNT_STORAGE_KEY));
  theme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  dailyStats = loadDailyStats();
  bestStreak = calculateBestStreakFromHistory();
  persistBestStreak();

  syncDateAndRefresh();
  renderCounts();
  renderTheme();
  showImportMessage("导入成功：数据已恢复并刷新页面状态。", "success");
  console.log("[import] success");
}

function handleImportFileSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  console.log("[import] file selected");

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backupObject = JSON.parse(String(reader.result));
      applyImportedBackup(backupObject);
    } catch (error) {
      console.error("[import] invalid JSON", error);
      showImportMessage("导入失败：文件不是合法 JSON。", "error");
      alert("导入失败：文件不是合法 JSON。");
    }
  };
  reader.onerror = (error) => {
    console.error("[import] file read failed", error);
    showImportMessage("导入失败：读取文件时发生错误。", "error");
    alert("导入失败：读取文件时发生错误。");
  };
  reader.readAsText(file, "utf-8");

  event.target.value = "";
}

function bindUI() {
  const missing = {
    exportButton: !exportButton,
    importButton: !importButton,
    importFileInput: !importFileInput,
  };
  if (missing.exportButton || missing.importButton || missing.importFileInput) {
    console.error("[bind] missing element", missing);
    return;
  }

  incrementButton.addEventListener("click", incrementCounters);

  resetButton.addEventListener("click", () => {
    count = 0;
    renderCounts();
    persistCount();
  });

  themeToggleButton.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    renderTheme();
    persistTheme();
  });

  clearAllButton.addEventListener("click", () => {
    const shouldClear = confirm("确认清空所有本地数据吗？此操作不可撤销。");
    if (!shouldClear) {
      return;
    }
    clearAllData();
    showImportMessage("已清空所有数据。", "info");
  });

  exportButton.addEventListener("click", exportProjectData);

  importButton.addEventListener("click", () => {
    console.log("[import] clicked");
    try {
      importFileInput.click();
    } catch (error) {
      console.error("[import] failed to open file picker", error);
      alert("导入失败：无法打开文件选择器。");
    }
  });

  importFileInput.addEventListener("change", handleImportFileSelection);

  window.addEventListener("resize", drawRecentHistoryChart);
  window.addEventListener("focus", syncDateAndRefresh);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      syncDateAndRefresh();
    }
  });
}

function initApp() {
  countElement = document.getElementById("count-value");
  todayCountElement = document.getElementById("today-count-value");
  maxDailyCountElement = document.getElementById("max-daily-count-value");
  streakElement = document.getElementById("streak-value");
  bestStreakElement = document.getElementById("best-streak-value");
  historyChart = document.getElementById("history-chart");
  incrementButton = document.getElementById("increment-btn");
  resetButton = document.getElementById("reset-btn");
  themeToggleButton = document.getElementById("theme-toggle-btn");
  clearAllButton = document.getElementById("clear-all-btn");
  exportButton = document.getElementById("export-btn");
  importButton = document.getElementById("import-btn");
  importFileInput = document.getElementById("import-file-input");
  importMessageElement = document.getElementById("import-message");

  const requiredElements = [
    countElement,
    todayCountElement,
    maxDailyCountElement,
    streakElement,
    bestStreakElement,
    historyChart,
    incrementButton,
    resetButton,
    themeToggleButton,
    clearAllButton,
    exportButton,
    importButton,
    importFileInput,
    importMessageElement,
  ];

  if (requiredElements.some((el) => !el)) {
    console.error("[init] missing required DOM elements, app init aborted");
    alert("页面初始化失败：缺少必要元素，请检查 HTML 结构。");
    return;
  }

  count = parseCount(localStorage.getItem(COUNT_STORAGE_KEY));
  theme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  dailyStats = loadDailyStats();
  bestStreak = parseCount(localStorage.getItem(BEST_STREAK_STORAGE_KEY));
  bestStreak = Math.max(bestStreak, calculateBestStreakFromHistory());
  persistBestStreak();

  bindUI();
  syncDateAndRefresh();
  renderCounts();
  renderTheme();
  showImportMessage("", "info");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
