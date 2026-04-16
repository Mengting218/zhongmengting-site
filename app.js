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

function buildNewsCard(item) {
  return `
    <article class="news-card">
      <p class="news-meta">${item.category} · ${item.topic}</p>
      <h4>${item.title}</h4>
      <p>${item.summary}</p>
    </article>
  `;
}

function renderNews(data) {
  const aiItems = (data.items || []).filter((item) => item.category === "AI");
  const financeItems = (data.items || []).filter((item) => item.category === "财经");

  const aiContainer = document.getElementById("ai-news-list");
  const financeContainer = document.getElementById("finance-news-list");
  const updatedAt = document.getElementById("news-updated-at");

  if (!aiContainer || !financeContainer || !updatedAt) return;

  aiContainer.innerHTML = aiItems.map(buildNewsCard).join("");
  financeContainer.innerHTML = financeItems.map(buildNewsCard).join("");
  updatedAt.textContent = `最近更新：${data.updatedAt || "未知日期"}`;
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

loadNews();
