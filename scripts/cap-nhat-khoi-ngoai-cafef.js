#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "du-lieu");
const SOURCE_URL =
  "https://msh-appdata.cafef.vn/rest-api/api/v1/OverviewOrgnizaztion/0/{yyyymmdd}/15?symbol={symbol}";
const SOURCE_PAGE = "https://cafef.vn/du-lieu.chn";
const MARKETS = [
  { key: "hose", label: "HOSE", symbol: "VNINDEX", display: "HOSE/VNINDEX" },
  { key: "hnx", label: "HNX", symbol: "HNX-INDEX", display: "HNX-INDEX" },
  { key: "upcom", label: "UPCoM", symbol: "UPCOM-INDEX", display: "UPCOM-INDEX" },
];
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function parseArgs(argv) {
  const args = { apply: false, date: null, file: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--date") args.date = argv[++i];
    else if (arg.startsWith("--date=")) args.date = arg.slice("--date=".length);
    else if (arg === "--file") args.file = argv[++i];
    else if (arg.startsWith("--file=")) args.file = arg.slice("--file=".length);
    else if (!args.date && /^\d{4}-\d{2}-\d{2}$/.test(arg)) args.date = arg;
    else throw new Error(`Khong hieu tham so: ${arg}`);
  }
  return args;
}

function usage() {
  return [
    "Usage:",
    "  pwsh -NoProfile -Command '$sys = Get-Content -Raw -LiteralPath \"F:\\systeminfohelper.json\" | ConvertFrom-Json; & $sys.node.path \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-khoi-ngoai-cafef.js\" [--date PHIEN-YYYY-MM-DD] [--file du-lieu/YYYY-MM-DD.json] [--apply]'",
    "",
    "Examples:",
    "  pwsh -NoProfile -Command '$sys = Get-Content -Raw -LiteralPath \"F:\\systeminfohelper.json\" | ConvertFrom-Json; & $sys.node.path \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-khoi-ngoai-cafef.js\" --date 2026-07-01'",
    "  pwsh -NoProfile -Command '$sys = Get-Content -Raw -LiteralPath \"F:\\systeminfohelper.json\" | ConvertFrom-Json; & $sys.node.path \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-khoi-ngoai-cafef.js\" --date 2026-07-01 --file \"F:\\Hai BUi\\Agent tổng hợp tin tức\\du-lieu\\2026-07-02.json\" --apply'",
  ].join("\n");
}

function yyyymmdd(isoDate) {
  return isoDate.replace(/-/g, "");
}

function todayKeyInVietnam() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function latestDataFile() {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((file) => /^\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort();
  if (!files.length) throw new Error(`Khong tim thay file JSON trong ${DATA_DIR}`);
  return path.join(DATA_DIR, files[files.length - 1]);
}

function resolveTargetFile(args) {
  if (args.file) return path.resolve(args.file);
  const todayFile = path.join(DATA_DIR, `${todayKeyInVietnam()}.json`);
  if (fs.existsSync(todayFile)) return todayFile;
  return latestDataFile();
}

async function requestJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CafeF HTTP ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

function parseCafeFDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

async function fetchForeignNetForMarket(reportDate, market) {
  const url = SOURCE_URL.replace("{yyyymmdd}", yyyymmdd(reportDate)).replace(
    "{symbol}",
    encodeURIComponent(market.symbol),
  );
  const rows = await requestJson(url);
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(`CafeF khong tra rows khối ngoại ${market.symbol}`);
  }

  const rowIndex = rows.findIndex((row) => parseCafeFDate(row.date) === reportDate);
  if (rowIndex < 0) {
    throw new Error(
      `CafeF chua co dung ngay ${reportDate} cho ${market.symbol}; rows[0].date=${rows[0]?.date || "n/a"}`,
    );
  }

  const row = rows[rowIndex];
  const net5d = rows
    .slice(rowIndex, rowIndex + 5)
    .reduce((sum, item) => sum + Number(item.netVal || 0), 0);

  return {
    key: market.key,
    label: market.label,
    symbol: market.symbol,
    display: market.display,
    reportDate,
    fetchedAt: new Date().toISOString(),
    market: market.display,
    source: `CafeF msh-appdata OverviewOrgnizaztion (${market.symbol})`,
    sourceUrl: url,
    buyValVnd: Number(row.buyVal),
    sellValVnd: Number(row.sellVal),
    netValVnd: Number(row.netVal),
    buyVol: Number(row.buyVol),
    sellVol: Number(row.sellVol),
    netVol: Number(row.netVol),
    net5dVnd: Math.round(net5d),
    rowsUsedFor5d: rows.slice(rowIndex, rowIndex + 5).map((item) => ({
      date: parseCafeFDate(item.date),
      netValVnd: Number(item.netVal),
    })),
  };
}

async function fetchForeignNet(reportDate) {
  const markets = await Promise.all(MARKETS.map((market) => fetchForeignNetForMarket(reportDate, market)));
  const total = markets.reduce(
    (sum, item) => ({
      buyValVnd: sum.buyValVnd + item.buyValVnd,
      sellValVnd: sum.sellValVnd + item.sellValVnd,
      netValVnd: sum.netValVnd + item.netValVnd,
      buyVol: sum.buyVol + item.buyVol,
      sellVol: sum.sellVol + item.sellVol,
      netVol: sum.netVol + item.netVol,
      net5dVnd: sum.net5dVnd + item.net5dVnd,
    }),
    { buyValVnd: 0, sellValVnd: 0, netValVnd: 0, buyVol: 0, sellVol: 0, netVol: 0, net5dVnd: 0 },
  );

  return {
    reportDate,
    fetchedAt: new Date().toISOString(),
    market: "Toàn thị trường",
    source: "CafeF msh-appdata OverviewOrgnizaztion (VNINDEX, HNX-INDEX, UPCOM-INDEX)",
    sourceUrl: SOURCE_PAGE,
    markets,
    ...total,
  };
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSignedNumber(value, digits = 0) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}`;
}

function formatBil(vnd, digits = 0) {
  return `${formatSignedNumber(vnd / 1e9, digits)} tỷ`;
}

function toneFromNet(value) {
  if (value > 0) return "tot";
  if (value < 0) return "xau";
  return "trung_tinh";
}

function huongFromNet(value) {
  if (value > 0) return "tang";
  if (value < 0) return "giam";
  return "canh_bao";
}

function sourceName(payload) {
  const [y, m, d] = payload.reportDate.split("-");
  return `CafeF ${d}/${m} — khối ngoại 3 sàn qua msh-appdata`;
}

function findSection03(report) {
  const section = (report.muc || []).find(
    (muc) => muc.so === "03" || /d[oò]ng ti[eề]n|vị thế|vi the/i.test(muc.ten || ""),
  );
  if (!section || !Array.isArray(section.items)) {
    throw new Error("Khong tim thay muc §03 Dòng tiền & vị thế trong JSON");
  }
  return section;
}

function upsertByLabel(items, label, item) {
  const index = items.findIndex((current) => current.chi_tieu === label);
  if (index >= 0) items[index] = item;
  else items.push(item);
}

function sortSection03Items(items) {
  const priority = [
    [/^Khối ngoại HOSE/i, 10],
    [/^Khối ngoại HNX/i, 11],
    [/^Khối ngoại UPCoM/i, 12],
    [/^Khối ngoại tổng/i, 13],
    [/^Khối ngoại 5 phiên/i, 14],
    [/^Tự doanh/i, 20],
    [/^Thanh khoản/i, 40],
  ];
  return items
    .map((item, index) => ({
      item,
      index,
      rank: priority.find(([pattern]) => pattern.test(item.chi_tieu || ""))?.[1] ?? index + 100,
    }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

function upsertDashboard(report, payload) {
  if (!Array.isArray(report.chi_so)) report.chi_so = [];
  const index = report.chi_so.findIndex((item) => /khối ngoại|khoi ngoai/i.test(item.ten || ""));
  const item = {
    ten: "Khối ngoại",
    gia_tri: formatBil(payload.netValVnd),
    phu: "Tổng 3 sàn",
    huong: huongFromNet(payload.netValVnd),
    ghi_chu: `CafeF netVal 3 sàn ${payload.reportDate.slice(5)}`,
  };
  if (index >= 0) report.chi_so[index] = item;
  else report.chi_so.push(item);
}

function upsertSection03(report, payload) {
  const section = findSection03(report);
  for (const market of payload.markets || []) {
    upsertByLabel(section.items, `Khối ngoại ${market.label}`, {
      chi_tieu: `Khối ngoại ${market.label}`,
      gia_tri: formatBil(market.netValVnd),
      tone: toneFromNet(market.netValVnd),
      y_nghia: `Số netVal có cấu trúc từ CafeF cho ${market.display}, dùng làm số chuẩn thay vì suy luận từ bài tin`,
    });
  }
  upsertByLabel(section.items, "Khối ngoại tổng", {
    chi_tieu: "Khối ngoại tổng",
    gia_tri: formatBil(payload.netValVnd),
    tone: toneFromNet(payload.netValVnd),
    y_nghia: "Tổng cộng HOSE, HNX và UPCoM theo cùng nguồn CafeF API, dễ đối chiếu với từng sàn",
  });
  upsertByLabel(section.items, "Khối ngoại 5 phiên", {
    chi_tieu: "Khối ngoại 5 phiên",
    gia_tri: formatBil(payload.net5dVnd),
    tone: toneFromNet(payload.net5dVnd),
    y_nghia: "Lũy kế 5 phiên gần nhất của cả 3 sàn cho biết áp lực dòng vốn ngoại là một phiên đơn lẻ hay xu hướng ngắn hạn",
  });
  section.items = sortSection03Items(section.items);
}

function upsertSource(report, payload) {
  if (!Array.isArray(report.nguon)) report.nguon = [];
  const source = { ten: sourceName(payload), url: SOURCE_PAGE };
  const index = report.nguon.findIndex(
    (item) => /CafeF .*khối ngoại (HOSE|3 sàn)|msh-appdata.*VNINDEX/i.test(item.ten || ""),
  );
  if (index >= 0) report.nguon[index] = source;
  else report.nguon.push(source);
}

function applyPayload(report, payload) {
  upsertDashboard(report, payload);
  upsertSection03(report, payload);
  upsertSource(report, payload);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const targetFile = resolveTargetFile(args);
  const report = JSON.parse(fs.readFileSync(targetFile, "utf8"));
  const reportDate = args.date || report.phien || report.ngay;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
    throw new Error(`Ngay/phien khong hop le: ${reportDate}`);
  }

  const payload = await fetchForeignNet(reportDate);
  if (!args.apply) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  applyPayload(report, payload);
  fs.writeFileSync(targetFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Da cap nhat khối ngoại CafeF vao ${path.relative(ROOT, targetFile)}`);
  for (const market of payload.markets) {
    console.log(`Khối ngoại ${market.label} ${payload.reportDate}: ${formatBil(market.netValVnd)}`);
  }
  console.log(`Khối ngoại tổng 3 sàn ${payload.reportDate}: ${formatBil(payload.netValVnd)}`);
  console.log(`Lũy kế 5 phiên 3 sàn: ${formatBil(payload.net5dVnd)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
