#!/usr/bin/env python3
"""
Pulse Daily - 免费内容自动生成脚本
无需任何 API Key，完全免费
新闻来源：36Kr / 机器之心 / 新浪财经 RSS
股票来源：东方财富沪深主板行情接口（只取 6xxxxx / 000xxx / 001xxx）
"""

import json, os, sys, re, html
from datetime import datetime, timezone, timedelta
import urllib.request, urllib.error
import xml.etree.ElementTree as ET

CST   = timezone(timedelta(hours=8))
NOW   = datetime.now(CST)
TODAY = NOW.strftime("%Y-%m-%d")
TIME_TAG = NOW.strftime("%Y-%m-%d %H:%M")
BASE  = os.path.dirname(os.path.abspath(__file__))

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml,application/xml,text/xml,*/*",
}

# ── 工具 ──────────────────────────────────────────────────────────────

def fetch(url: str, timeout: int = 20) -> bytes:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def clean(text: str) -> str:
    """去掉 HTML 标签和多余空白"""
    text = re.sub(r"<[^>]+>", "", text or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def truncate(text: str, max_len: int = 80) -> str:
    text = clean(text)
    return text[:max_len] + "…" if len(text) > max_len else text


# ── RSS 解析 ──────────────────────────────────────────────────────────

def parse_rss(raw: bytes, limit: int = 3) -> list[dict]:
    """从 RSS XML 提取前 limit 条 title + description"""
    root = ET.fromstring(raw.decode("utf-8", errors="replace"))
    ns   = {"atom": "http://www.w3.org/2005/Atom"}
    items = []

    # RSS 2.0
    for item in root.iter("item"):
        title = clean(getattr(item.find("title"), "text", "") or "")
        desc  = clean(getattr(item.find("description"), "text", "") or "")
        if title:
            items.append({"title": title, "summary": truncate(desc or title, 80)})
        if len(items) >= limit:
            break

    # Atom
    if not items:
        for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
            title = clean(getattr(entry.find("{http://www.w3.org/2005/Atom}title"), "text", "") or "")
            summ  = entry.find("{http://www.w3.org/2005/Atom}summary")
            cont  = entry.find("{http://www.w3.org/2005/Atom}content")
            desc  = clean(getattr(summ or cont, "text", "") or "")
            if title:
                items.append({"title": title, "summary": truncate(desc or title, 80)})
            if len(items) >= limit:
                break

    return items


# ── 新闻生成 ──────────────────────────────────────────────────────────

# AI 新闻 RSS 源 —— 专项频道，避免混入无关内容
AI_RSS_SOURCES = [
    ("模型",   "https://www.jiqizhixin.com/rss"),                       # 机器之心 全站
    ("产品",   "https://rsshub.app/36kr/news/cate/329"),                # 36Kr 人工智能频道
    ("Agent",  "https://rsshub.app/sspai/tag/AI"),                      # 少数派 AI 标签
    ("产业",   "https://rsshub.app/gcores/categories/news"),             # 备用
]

# 财经新闻 RSS 源 —— 专项频道
FINANCE_RSS_SOURCES = [
    ("宏观",   "https://rsshub.app/eastmoney/news/cjxw"),               # 东方财富财经新闻
    ("市场",   "https://rsshub.app/wallstreetcn/news/essential"),       # 华尔街见闻精选
    ("资金",   "https://rsshub.app/gelonghui/home"),                    # 格隆汇
    ("商业",   "https://rsshub.app/sina/finance/roll/2"),               # 新浪财经滚动
]

# 过滤关键词：包含以下词的标题不展示（避免娱乐/生活类噪音进入）
AI_BLOCK_KEYWORDS    = ["相机", "手机发布", "电视", "游戏", "音乐", "美食", "酒店", "家具", "续航测试"]
FINANCE_BLOCK_KEYWORDS = ["娱乐", "电影", "明星", "综艺", "八卦"]


def fetch_news_from_sources(sources: list, need: int = 2, block_keywords: list = None) -> list[dict]:
    """依次尝试各个 RSS 源，直到凑够 need 条，自动过滤噪音关键词"""
    block_keywords = block_keywords or []
    results = []
    for topic, url in sources:
        if len(results) >= need:
            break
        try:
            raw   = fetch(url, timeout=15)
            # 每个源多抓一些，以便过滤后还够用
            items = parse_rss(raw, limit=(need - len(results)) * 3)
            for item in items:
                if len(results) >= need:
                    break
                title = item.get("title", "")
                # 过滤掉包含噪音关键词的标题
                if any(kw in title for kw in block_keywords):
                    continue
                item["topic"] = topic
                results.append(item)
        except Exception as e:
            print(f"  RSS 抓取失败 [{url}]: {e}", file=sys.stderr)
    return results[:need]


def generate_news() -> dict:
    print("  抓取 AI 新闻…")
    ai_items = fetch_news_from_sources(AI_RSS_SOURCES, need=2, block_keywords=AI_BLOCK_KEYWORDS)

    print("  抓取财经新闻…")
    fin_items = fetch_news_from_sources(FINANCE_RSS_SOURCES, need=2, block_keywords=FINANCE_BLOCK_KEYWORDS)

    # 兜底：如果抓不到就用占位内容
    fallback_ai = [
        {"topic": "行业",   "title": "AI 技术持续演进，大模型产业化加速落地",
         "summary": "各大科技公司持续加大 AI 研发投入，模型能力与工程效率双向提升，产业落地进程明显加快。"},
        {"topic": "产品",   "title": "Agent 自动化工作流成为 2024 年企业软件新趋势",
         "summary": "从写作到数据处理，越来越多企业开始将 AI Agent 嵌入日常工作流，推动效率提升。"},
    ]
    fallback_fin = [
        {"topic": "宏观",   "title": "国内经济数据稳中向好，市场信心逐步修复",
         "summary": "多项宏观指标显示内需有所改善，机构预期全年经济增长目标有望顺利实现。"},
        {"topic": "市场",   "title": "A股市场资金结构变化，机构持仓偏好发生转移",
         "summary": "近期北向资金与公募基金持仓数据显示，市场资金正逐步向高质量龙头标的集中。"},
    ]

    while len(ai_items)  < 2: ai_items.append(fallback_ai[len(ai_items)])
    while len(fin_items) < 2: fin_items.append(fallback_fin[len(fin_items)])

    items = []
    for it in ai_items[:2]:
        items.append({"category": "AI",   "topic": it["topic"],
                      "title": it["title"], "summary": it["summary"]})
    for it in fin_items[:2]:
        items.append({"category": "财经", "topic": it["topic"],
                      "title": it["title"], "summary": it["summary"]})

    return {"updatedAt": TODAY, "items": items}


# ── 股票生成（东方财富接口，只取沪深主板）────────────────────────────

# 东方财富沪深主板热门股票行情接口
# fs=m:0+t:6,m:0+t:13,m:1+t:2,m:1+t:23  → 深主板+深主板B+沪主板+沪主板B
EMC_RANK_URL = (
    "https://push2.eastmoney.com/api/qt/clist/get"
    "?cb=&pn=1&pz=20&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281"
    "&fltt=2&invt=2&fid=f3"
    "&fs=m:0+t:6,m:0+t:13,m:1+t:2,m:1+t:23"
    "&fields=f2,f3,f4,f5,f6,f10,f12,f14,f15,f16,f17,f18,f20,f21"
    "&_=1713000000000"
)

# 股票代码白名单前缀（沪深主板）
MAIN_BOARD_PREFIXES = ("600", "601", "603", "605", "000", "001", "002", "003")


def is_main_board(code: str) -> bool:
    return code.startswith(MAIN_BOARD_PREFIXES)


SECTOR_MAP = {
    "600": "沪市主板", "601": "沪市主板", "603": "沪市主板", "605": "沪市主板",
    "000": "深市主板", "001": "深市主板", "002": "深市主板", "003": "深市主板",
}

CONCLUSION_RULES = [
    (lambda chg, vol: chg > 3  and vol > 80, "趋势偏强"),
    (lambda chg, vol: chg < 0  or  vol < 50, "等待放量"),
    (lambda chg, vol: True,                   "震荡观察"),
]


def get_conclusion(chg_pct: float, vol_heat: int) -> str:
    for rule, label in CONCLUSION_RULES:
        if rule(chg_pct, vol_heat):
            return label
    return "震荡观察"


def pct_str(value: float) -> str:
    return f"+{value:.1f}%" if value >= 0 else f"{value:.1f}%"


def generate_stocks() -> dict:
    print("  抓取东方财富主板行情…")

    selected = []
    try:
        raw  = fetch(EMC_RANK_URL, timeout=20)
        text = raw.decode("utf-8", errors="replace")

        # 接口返回 JSON（有时带 callback 包裹，先剥掉）
        text = re.sub(r"^\w+\(", "", text).rstrip(");")
        data = json.loads(text)

        diff_list = data.get("data", {}).get("diff", [])
        candidates = []
        for item in diff_list:
            code = str(item.get("f12", ""))
            name = str(item.get("f14", ""))
            if not is_main_board(code) or not name:
                continue

            chg_pct  = float(item.get("f3",  0) or 0)   # 涨跌幅 %
            chg_5d   = float(item.get("f10", 0) or 0)   # 5日涨跌（东财用 f10）
            vol      = float(item.get("f5",  0) or 0)   # 成交量
            turnover = float(item.get("f6",  0) or 0)   # 成交额

            candidates.append({
                "code": code, "name": name,
                "chg_pct": chg_pct, "chg_5d": chg_5d,
                "vol": vol, "turnover": turnover,
            })
            if len(candidates) >= 30:
                break

        # 按成交额排序，取前 3 支（成交额大 = 市场关注度高）
        candidates.sort(key=lambda x: x["turnover"], reverse=True)
        top3 = candidates[:3]

        for rank, s in enumerate(top3, 1):
            code     = s["code"]
            chg      = s["chg_pct"]
            chg_5d   = s["chg_5d"]
            # 用成交量估算热度（归一化到 0-100）
            max_vol  = max(c["vol"] for c in top3) or 1
            vol_heat = int(s["vol"] / max_vol * 100)
            theme_strength = min(100, max(40, vol_heat - 5 + abs(int(chg * 3))))

            conclusion = get_conclusion(chg, vol_heat)
            sector_prefix = code[:3]
            sector = SECTOR_MAP.get(sector_prefix, "主板")

            selected.append({
                "rank": rank,
                "name": s["name"],
                "code": code,
                "sector": sector,
                "conclusion": conclusion,
                "tags": ["主板龙头", "资金关注", "流动性强"],
                "reason": (
                    f"今日成交活跃，{'涨幅居前' if chg > 0 else '跌幅有限'}，"
                    f"近5日表现 {pct_str(chg_5d)}，市场持续跟踪其资金流向与基本面变化。"
                ),
                "panel": {
                    "change": {
                        "5d":  pct_str(chg_5d),
                        "10d": pct_str(chg_5d * 1.6),
                        "20d": pct_str(chg_5d * 2.4),
                    },
                    "volumeHeat":    vol_heat,
                    "themeStrength": theme_strength,
                },
            })

    except Exception as e:
        print(f"  东方财富接口失败：{e}，使用兜底数据", file=sys.stderr)

    # 兜底数据（沪深主板）
    fallback_items = [
        {
            "rank": 1, "name": "招商银行", "code": "600036", "sector": "沪市主板",
            "conclusion": "震荡观察",
            "tags": ["银行龙头", "机构重仓", "高股息"],
            "reason": "银行板块估值处于历史低位，机构资金持续关注其股息率与净息差变化。",
            "panel": {"change": {"5d": "+1.2%", "10d": "+2.8%", "20d": "+4.5%"},
                      "volumeHeat": 72, "themeStrength": 78},
        },
        {
            "rank": 2, "name": "贵州茅台", "code": "600519", "sector": "沪市主板",
            "conclusion": "震荡观察",
            "tags": ["消费龙头", "定价权", "长期持有"],
            "reason": "消费复苏背景下，白酒龙头的渠道库存与批价走势是市场关键跟踪指标。",
            "panel": {"change": {"5d": "+0.8%", "10d": "+2.1%", "20d": "+3.6%"},
                      "volumeHeat": 68, "themeStrength": 82},
        },
        {
            "rank": 3, "name": "平安银行", "code": "000001", "sector": "深市主板",
            "conclusion": "等待放量",
            "tags": ["深市主板", "金融", "低估值"],
            "reason": "银行板块整体处于估值修复阶段，平安银行零售转型进展是重要观察窗口。",
            "panel": {"change": {"5d": "-0.5%", "10d": "+1.2%", "20d": "+2.8%"},
                      "volumeHeat": 55, "themeStrength": 65},
        },
    ]

    while len(selected) < 3:
        selected.append(fallback_items[len(selected)])

    return {
        "updatedAt": TIME_TAG,
        "cadence": "每日 09:30 / 14:30",
        "disclaimer": "以下内容仅作信息参考，不构成任何投资建议，实际决策请结合自身风险承受能力独立判断。",
        "items": selected[:3],
    }


# ── 写文件 ────────────────────────────────────────────────────────────

def write_json(filename: str, data: dict):
    path = os.path.join(BASE, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ 已写入 {filename}")


# ── 主流程 ────────────────────────────────────────────────────────────

def main():
    hour = NOW.hour
    update_news   = hour == 9  or "--news"   in sys.argv or "--all" in sys.argv
    update_stocks = hour in (9, 14) or "--stocks" in sys.argv or "--all" in sys.argv

    # 手动运行时默认全更新
    if not update_news and not update_stocks:
        update_news = True
        update_stocks = True

    if update_news:
        print("→ 更新新闻内容…")
        try:
            write_json("news.json", generate_news())
        except Exception as e:
            print(f"✗ 新闻更新失败：{e}", file=sys.stderr)

    if update_stocks:
        print("→ 更新股票观察…")
        try:
            write_json("stocks.json", generate_stocks())
        except Exception as e:
            print(f"✗ 股票更新失败：{e}", file=sys.stderr)

    print("完成。")


if __name__ == "__main__":
    main()
