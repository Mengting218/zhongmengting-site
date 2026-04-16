const fallbackNews = {
  updatedAt: "2026-04-15",
  items: [
    {
      category: "AI",
      topic: "头条",
      title: "多模态模型继续加速落地，企业更关注真实业务场景的 ROI",
      summary:
        "越来越多团队不再只比较模型参数规模，而是开始聚焦交付成本、响应速度、稳定性以及对内部流程的实际增益。",
    },
    {
      category: "AI",
      topic: "产品",
      title: "AI Agent 工具链持续升温，自动化工作流成为新焦点",
      summary:
        "从写作、分析到数据整理，越来越多产品开始将 Agent 作为默认交互方式，推动结果导向型软件体验升级。",
    },
    {
      category: "财经",
      topic: "市场",
      title: "市场重新评估科技资产估值，资金更关注盈利能力与现金流",
      summary:
        "在高增长预期之外，投资者开始更加重视企业的基本面质量，尤其是利润兑现、成本控制和长期竞争壁垒。",
    },
  ],
};

const fallbackStocks = {
  updatedAt: "2026-04-16 09:30",
  cadence: "每日 09:30 / 14:30",
  disclaimer: "以下内容仅作信息参考，不构成任何投资建议，实际决策请结合自身风险承受能力独立判断。",
  items: [
    {
      rank: 1,
      name: "中际旭创",
      code: "300308",
      sector: "光模块 / 算力链",
      tags: ["业绩弹性", "AI 算力", "景气跟踪"],
      conclusion: "趋势偏强",
      reason: "作为算力产业链代表标的，受益于高速光模块需求扩张，市场通常会持续跟踪其订单、景气度与业绩兑现情况。",
      panel: {
        change: {
          "5d": "+6.8%",
          "10d": "+11.4%",
          "20d": "+18.9%",
        },
        volumeHeat: 84,
        themeStrength: 91,
      },
    },
    {
      rank: 2,
      name: "中芯国际",
      code: "688981",
      sector: "半导体制造",
      tags: ["国产替代", "先进制造", "长期逻辑"],
      conclusion: "震荡观察",
      reason: "半导体自主可控主题反复受到关注，龙头制造企业通常兼具产业地位与政策预期，是市场观察核心标的之一。",
      panel: {
        change: {
          "5d": "+3.1%",
          "10d": "+7.6%",
          "20d": "+12.8%",
        },
        volumeHeat: 73,
        themeStrength: 88,
      },
    },
    {
      rank: 3,
      name: "宁德时代",
      code: "300750",
      sector: "新能源 / 电池",
      tags: ["龙头资产", "机构关注", "基本面"],
      conclusion: "等待放量",
      reason: "在风险偏好变化时，兼具行业地位、流动性和机构覆盖度的大市值龙头，往往会成为资金衡量成长板块的重要参照。",
      panel: {
        change: {
          "5d": "+1.6%",
          "10d": "+4.2%",
          "20d": "+9.5%",
        },
        volumeHeat: 67,
        themeStrength: 76,
      },
    },
  ],
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildNewsItem(item) {
  return `
    <article class="news-item">
      <p class="news-topic">${escapeHtml(item.category)} · ${escapeHtml(item.topic)}</p>
      <h4>${escapeHtml(item.title)}</h4>
      <p class="news-summary">${escapeHtml(item.summary)}</p>
    </article>
  `;
}

function normalizeScore(value, fallback) {
  const score = Number(value);
  return Math.max(0, Math.min(100, Number.isFinite(score) ? score : fallback));
}

function getPanelData(item) {
  const panel = item.panel || {};
  return {
    change: {
      "5d": panel.change?.["5d"] || "+2.3%",
      "10d": panel.change?.["10d"] || "+5.8%",
      "20d": panel.change?.["20d"] || "+9.6%",
    },
    volumeHeat: normalizeScore(panel.volumeHeat, 68),
    themeStrength: normalizeScore(panel.themeStrength, 75),
  };
}

function getConclusionData(item) {
  const text = item.conclusion || "继续观察";

  if (text.includes("趋势偏强")) {
    return { text, className: "conclusion-strong" };
  }

  if (text.includes("等待放量")) {
    return { text, className: "conclusion-wait" };
  }

  if (text.includes("震荡观察")) {
    return { text, className: "conclusion-range" };
  }

  return { text, className: "conclusion-neutral" };
}

function buildMetricBar(label, value, toneClass = "") {
  return `
    <div class="metric-block ${toneClass}">
      <div class="metric-head">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
      <div class="metric-track">
        <div class="metric-fill ${toneClass}" style="width: ${normalizeScore(value, 0)}%"></div>
      </div>
    </div>
  `;
}

function buildStockCard(item) {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => `<span class="stock-tag">${escapeHtml(tag)}</span>`).join("")
    : "";

  const panel = getPanelData(item);
  const conclusion = getConclusionData(item);

  return `
    <article class="stock-card">
      <div class="stock-head">
        <div>
          <div class="stock-title-row">
            <h3>${escapeHtml(item.name)}</h3>
            <span class="conclusion-chip ${conclusion.className}">${escapeHtml(conclusion.text)}</span>
          </div>
          <p class="stock-code">${escapeHtml(item.code)} · ${escapeHtml(item.sector)}</p>
        </div>
        <span class="stock-rank">No.${escapeHtml(item.rank)}</span>
      </div>
      <div class="stock-tags">${tags}</div>
      <p class="stock-note">${escapeHtml(item.reason)}</p>
      <div class="panel-wrap">
        <div class="panel-title-row">
          <span class="panel-title">近期盯盘面板</span>
          <span class="panel-subtitle">涨跌表现 / 成交热度 / 主题强度</span>
        </div>
        <table class="panel-table" aria-label="${escapeHtml(item.name)}近期盯盘面板">
          <thead>
            <tr>
              <th>近5日</th>
              <th>近10日</th>
              <th>近20日</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="change-chip positive">${escapeHtml(panel.change["5d"])}</span></td>
              <td><span class="change-chip positive">${escapeHtml(panel.change["10d"])}</span></td>
              <td><span class="change-chip positive">${escapeHtml(panel.change["20d"])}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="metric-grid">
          ${buildMetricBar("成交热度", panel.volumeHeat, "metric-volume")}
          ${buildMetricBar("主题强度", panel.themeStrength, "metric-theme")}
        </div>
      </div>
    </article>
  `;
}

function renderHeadline(items) {
  const firstItem = (items || [])[0];
  const headlineTitle = document.getElementById("headline-title");
  const headlineSummary = document.getElementById("headline-summary");

  if (!headlineTitle || !headlineSummary || !firstItem) return;

  headlineTitle.textContent = firstItem.title;
  headlineSummary.textContent = firstItem.summary;
}

function renderNews(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const aiItems = items.filter((item) => item.category === "AI").slice(0, 4);
  const financeItems = items.filter((item) => item.category === "财经").slice(0, 4);

  const aiContainer = document.getElementById("ai-news-list");
  const financeContainer = document.getElementById("finance-news-list");
  const updatedAt = document.getElementById("news-updated-at");

  if (!aiContainer || !financeContainer || !updatedAt) return;

  aiContainer.innerHTML = aiItems.map(buildNewsItem).join("");
  financeContainer.innerHTML = financeItems.map(buildNewsItem).join("");
  updatedAt.textContent = data.updatedAt || "未知日期";
  renderHeadline(items);
}

function renderStocks(data) {
  const stockContainer = document.getElementById("stock-list");
  const updatedAt = document.getElementById("stocks-updated-at");

  if (!stockContainer || !updatedAt) return;

  const cards = (data.items || []).slice(0, 3).map(buildStockCard).join("");
  const disclaimer = data.disclaimer
    ? `<p class="stock-disclaimer">${escapeHtml(data.disclaimer)}</p>`
    : "";

  stockContainer.innerHTML = `${cards}${disclaimer}`;
  updatedAt.textContent = `最近观察更新：${data.updatedAt || "未知时间"}`;
}

async function loadNews() {
  try {
    const response = await fetch("./news.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    renderNews(data);
  } catch (error) {
    console.warn("加载 news.json 失败，使用兜底内容", error);
    renderNews(fallbackNews);
  }
}

async function loadStocks() {
  try {
    const response = await fetch("./stocks.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    renderStocks(data);
  } catch (error) {
    console.warn("加载 stocks.json 失败，使用兜底内容", error);
    renderStocks(fallbackStocks);
  }
}

loadNews();
loadStocks();
