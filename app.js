const fallbackNews = {
  updatedAt: "2026-04-17",
  items: [
    { category: "AI", topic: "模型",
      title: "多模态大模型加速落地，企业关注 ROI 与实际增益",
      summary: "越来越多团队不再只比模型规模，而是聚焦交付成本、响应速度和对内部流程的实际增益。" },
    { category: "AI", topic: "产品",
      title: "AI Agent 工具链升温，自动化工作流成为新焦点",
      summary: "从写作到数据处理，越来越多产品将 Agent 作为默认交互方式，推动结果导向型体验升级。" },
    { category: "财经", topic: "宏观",
      title: "一季度 GDP 同比增长 5.0%，外贸增速创近五年新高",
      summary: "国家统计局数据显示，2026 年一季度经济整体实现良好开局，外贸与内需双向改善。" },
    { category: "财经", topic: "市场",
      title: "市场重新评估科技资产估值，资金转向盈利能力",
      summary: "投资者开始更重视企业基本面质量，尤其是利润兑现、成本控制和长期竞争壁垒。" },
  ],
};

const fallbackStocks = {
  updatedAt: "2026-04-17 09:30",
  cadence: "每日 09:30 / 14:30",
  disclaimer: "以下内容仅作信息参考，不构成任何投资建议，实际决策请结合自身风险承受能力独立判断。",
  items: [
    { rank: 1, name: "招商银行", code: "600036", sector: "沪市主板 · 银行",
      conclusion: "震荡观察", tags: ["银行龙头", "高股息", "机构重仓"],
      reason: "银行板块估值处于历史低位，机构资金持续关注其股息率与净息差变化。",
      panel: { points: [62,67,71,68,73,75,72], change: { "5d": "+1.2%", "10d": "+2.8%", "20d": "+4.5%" }, volumeHeat: 72, themeStrength: 78 } },
    { rank: 2, name: "贵州茅台", code: "600519", sector: "沪市主板 · 消费",
      conclusion: "趋势偏强", tags: ["消费龙头", "定价权", "长期持有"],
      reason: "消费复苏背景下，白酒龙头渠道库存与批价走势是市场关键跟踪指标。",
      panel: { points: [55,58,60,64,66,69,74], change: { "5d": "+2.1%", "10d": "+4.3%", "20d": "+7.6%" }, volumeHeat: 81, themeStrength: 86 } },
    { rank: 3, name: "平安银行", code: "000001", sector: "深市主板 · 银行",
      conclusion: "等待放量", tags: ["深市主板", "零售转型", "低估值"],
      reason: "银行板块整体处于估值修复阶段，平安银行零售转型进展是重要观察窗口。",
      panel: { points: [70,68,65,63,61,60,58], change: { "5d": "-1.5%", "10d": "-2.3%", "20d": "-4.1%" }, volumeHeat: 55, themeStrength: 63 } },
  ],
};

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function normalizeScore(v, fallback) {
  const n = Number(v);
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : fallback));
}

function changeClass(str) {
  const s = String(str ?? "");
  if (s.startsWith("+")) return "chip-up";
  if (s.startsWith("-")) return "chip-down";
  return "chip-flat";
}

function buildSparkline(points) {
  const pts = Array.isArray(points) && points.length >= 2 ? points : [50,55,52,60,58,65,63];
  const W = 120, H = 36, PAD = 3;
  const min = Math.min(...pts), max = Math.max(...pts);
  const range = max - min || 1;
  const coords = pts.map((v, i) => {
    const x = PAD + (i / (pts.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  });
  const trend = pts[pts.length - 1] - pts[0];
  const stroke = trend > 0 ? "#dc2626" : trend < 0 ? "#16a34a" : "#9ca3af";
  const fill   = trend > 0 ? "rgba(220,38,38,0.07)" : trend < 0 ? "rgba(22,163,74,0.07)" : "rgba(156,163,175,0.07)";
  const lastX = coords[coords.length - 1].split(",")[0];
  const lastY = coords[coords.length - 1].split(",")[1];
  const polyFill = [...coords, (PAD + W - PAD * 2).toFixed(1) + "," + (H - PAD).toFixed(1), PAD + "," + (H - PAD).toFixed(1)].join(" ");
  return '<svg class="sparkline" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<polygon points="' + polyFill + '" fill="' + fill + '" stroke="none"/>'
    + '<polyline points="' + coords.join(" ") + '" fill="none" stroke="' + stroke + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<circle cx="' + lastX + '" cy="' + lastY + '" r="2.5" fill="' + stroke + '"/>'
    + '</svg>';
}

function buildMetricBar(label, value, toneClass) {
  const v = normalizeScore(value, 0);
  return '<div class="metric-block ' + toneClass + '">'
    + '<div class="metric-head"><span>' + escapeHtml(label) + '</span><strong>' + v + '</strong></div>'
    + '<div class="metric-track"><div class="metric-fill ' + toneClass + '" style="width:' + v + '%"></div></div>'
    + '</div>';
}

function buildNewsItem(item) {
  return '<article class="news-item">'
    + '<p class="news-topic">' + escapeHtml(item.category) + ' · ' + escapeHtml(item.topic) + '</p>'
    + '<h4>' + escapeHtml(item.title) + '</h4>'
    + '<p class="news-summary">' + escapeHtml(item.summary) + '</p>'
    + '</article>';
}

function getConclusionClass(text) {
  if (text.includes("趋势偏强")) return "conclusion-strong";
  if (text.includes("等待放量")) return "conclusion-wait";
  if (text.includes("震荡观察")) return "conclusion-range";
  return "conclusion-neutral";
}

function buildStockCard(item) {
  const tags = Array.isArray(item.tags)
    ? item.tags.map(t => '<span class="stock-tag">' + escapeHtml(t) + '</span>').join("") : "";
  const panel = item.panel || {};
  const change = panel.change || {};
  const c5  = change["5d"]  || "—";
  const c10 = change["10d"] || "—";
  const c20 = change["20d"] || "—";
  const conclusion = item.conclusion || "继续观察";
  return '<article class="stock-card">'
    + '<div class="stock-head">'
    +   '<div class="stock-title-row">'
    +     '<h3>' + escapeHtml(item.name) + '</h3>'
    +     '<span class="conclusion-chip ' + getConclusionClass(conclusion) + '">' + escapeHtml(conclusion) + '</span>'
    +   '</div>'
    +   '<div class="stock-meta-row">'
    +     '<span class="stock-code">' + escapeHtml(item.code) + '</span>'
    +     '<span class="stock-sector">' + escapeHtml(item.sector) + '</span>'
    +     '<span class="stock-rank">No.' + escapeHtml(item.rank) + '</span>'
    +   '</div>'
    + '</div>'
    + '<div class="stock-tags">' + tags + '</div>'
    + '<p class="stock-note">' + escapeHtml(item.reason) + '</p>'
    + '<div class="panel-wrap">'
    +   '<div class="panel-header-row">'
    +     '<span class="panel-title">近期盯盘</span>'
    +     '<div class="change-chips">'
    +       '<span class="change-chip ' + changeClass(c5)  + '"><em>5日</em>'  + escapeHtml(c5)  + '</span>'
    +       '<span class="change-chip ' + changeClass(c10) + '"><em>10日</em>' + escapeHtml(c10) + '</span>'
    +       '<span class="change-chip ' + changeClass(c20) + '"><em>20日</em>' + escapeHtml(c20) + '</span>'
    +     '</div>'
    +   '</div>'
    +   '<div class="sparkline-wrap">' + buildSparkline(panel.points) + '</div>'
    +   '<div class="metric-grid">'
    +     buildMetricBar("成交热度", panel.volumeHeat,    "metric-volume")
    +     buildMetricBar("主题强度", panel.themeStrength, "metric-theme")
    +   '</div>'
    + '</div>'
    + '</article>';
}

function renderHeadline(items) {
  const first = (items || [])[0];
  const t = document.getElementById("headline-title");
  const s = document.getElementById("headline-summary");
  if (!t || !s || !first) return;
  t.textContent = first.title;
  s.textContent = first.summary;
}

function renderNews(data) {
  const items   = Array.isArray(data.items) ? data.items : [];
  const aiItems = items.filter(i => i.category === "AI").slice(0, 2);
  const finItems= items.filter(i => i.category === "财经").slice(0, 2);
  const aiEl    = document.getElementById("ai-news-list");
  const finEl   = document.getElementById("finance-news-list");
  const upEl    = document.getElementById("news-updated-at");
  if (!aiEl || !finEl || !upEl) return;
  aiEl.innerHTML  = aiItems.map(buildNewsItem).join("");
  finEl.innerHTML = finItems.map(buildNewsItem).join("");
  upEl.textContent = data.updatedAt || "—";
  renderHeadline(items);
}

function renderStocks(data) {
  const el    = document.getElementById("stock-list");
  const upEl  = document.getElementById("stocks-updated-at");
  if (!el || !upEl) return;
  const cards = (data.items || []).slice(0, 3).map(buildStockCard).join("");
  const disc  = data.disclaimer
    ? '<p class="stock-disclaimer">' + escapeHtml(data.disclaimer) + '</p>' : "";
  el.innerHTML = cards + disc;
  upEl.textContent = "最近更新：" + (data.updatedAt || "—");
}

async function loadNews() {
  try {
    const r = await fetch("./news.json", { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    renderNews(await r.json());
  } catch (e) {
    console.warn("news.json 加载失败", e);
    renderNews(fallbackNews);
  }
}

async function loadStocks() {
  try {
    const r = await fetch("./stocks.json", { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    renderStocks(await r.json());
  } catch (e) {
    console.warn("stocks.json 加载失败", e);
    renderStocks(fallbackStocks);
  }
}

loadNews();
loadStocks();
