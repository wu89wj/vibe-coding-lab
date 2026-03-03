const COUNT_STORAGE_KEY = "vibe-coding-lab-click-count";
const THEME_STORAGE_KEY = "vibe-coding-lab-theme";
const DAILY_STATS_STORAGE_KEY = "vibe-coding-lab-daily-stats";

const PROJECT_STORAGE_KEYS = [COUNT_STORAGE_KEY, THEME_STORAGE_KEY, DAILY_STATS_STORAGE_KEY];

const countElement = document.getElementById("count-value");
const todayCountElement = document.getElementById("today-count-value");
const maxDailyCountElement = document.getElementById("max-daily-count-value");
const historyChart = document.getElementById("history-chart");
const incrementButton = document.getElementById("increment-btn");
const resetButton = document.getElementById("reset-btn");
const themeToggleButton = document.getElementById("theme-toggle-btn");
const clearAllButton = document.getElementById("clear-all-btn");
const exportButton = document.getElementById("export-btn");
const importButton = document.getElementById("import-btn");
const importFileInput = document.getElementById("import-file-input");
const importMessageElement = document.getElementById("import-message");

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

let count = parseCount(localStorage.getItem(COUNT_STORAGE_KEY));
let theme = localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
let dailyStats = loadDailyStats();

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

function drawRecentHistoryChart() {
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
  countElement.textContent = String(count);
  todayCountElement.textContent = String(dailyStats.todayCount);
  maxDailyCountElement.textContent = String(dailyStats.historyMaxDailyCount);
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
  themeToggleButton.textContent =
    theme === "dark" ? "☀️ 暗黑模式：开" : "🌙 暗黑模式：关";
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

  renderCounts();
  renderTheme();
}

function exportProjectData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    data: {
      [COUNT_STORAGE_KEY]: localStorage.getItem(COUNT_STORAGE_KEY) ?? "0",
      [THEME_STORAGE_KEY]: localStorage.getItem(THEME_STORAGE_KEY) ?? "light",
      [DAILY_STATS_STORAGE_KEY]: localStorage.getItem(DAILY_STATS_STORAGE_KEY) ?? JSON.stringify(getDefaultDailyStats()),
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
    showImportMessage(`导入失败：${validationError}`, "error");
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

  syncDateAndRefresh();
  renderCounts();
  renderTheme();
  showImportMessage("导入成功：数据已恢复并刷新页面状态。", "success");
}

function handleImportFileSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const backupObject = JSON.parse(String(reader.result));
      applyImportedBackup(backupObject);
    } catch {
      showImportMessage("导入失败：文件不是合法 JSON。", "error");
    }
  };
  reader.onerror = () => {
    showImportMessage("导入失败：读取文件时发生错误。", "error");
  };
  reader.readAsText(file, "utf-8");

  // 允许重复选择同一文件时也触发 change。
  event.target.value = "";
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
  importFileInput.click();
});
importFileInput.addEventListener("change", handleImportFileSelection);

window.addEventListener("resize", drawRecentHistoryChart);
window.addEventListener("focus", syncDateAndRefresh);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    syncDateAndRefresh();
  }
});

syncDateAndRefresh();
renderCounts();
renderTheme();
showImportMessage("", "info");
