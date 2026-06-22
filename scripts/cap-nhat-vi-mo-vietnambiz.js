#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "du-lieu");
const PAGE_URL = "https://data.vietnambiz.vn/currency-interest-rate";
const DATA_URL = (buildId) =>
  `https://data.vietnambiz.vn/_next/data/${encodeURIComponent(buildId)}/currency-interest-rate.json`;

const SOURCE_NAME = "VietnamBiz Data";

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
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-vi-mo-vietnambiz.js\" [--date YYYY-MM-DD] [--apply]'",
    "",
    "Examples:",
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-vi-mo-vietnambiz.js\" --date 2026-06-22'",
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-vi-mo-vietnambiz.js\" --date 2026-06-22 --apply'",
  ].join("\n");
}

async function requestText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "text/html,application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`VietnamBiz HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text;
}

async function requestJson(url) {
  const text = await requestText(url);
  return JSON.parse(text);
}

function extractNextData(html) {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) throw new Error("Khong tim thay script __NEXT_DATA__ trong HTML VietnamBiz");
  return JSON.parse(match[1]);
}

async function fetchVietnamBizData() {
  const html = await requestText(PAGE_URL);
  const nextData = extractNextData(html);
  if (!nextData.buildId) throw new Error("Khong tim thay buildId trong __NEXT_DATA__");

  const data = await requestJson(DATA_URL(nextData.buildId));
  const rows = data?.pageProps?.data;
  if (!Array.isArray(rows)) throw new Error("Response VietnamBiz khong co pageProps.data[]");
  return { buildId: nextData.buildId, rows };
}

function byTitle(rows, title) {
  const row = rows.find((item) => item.title === title);
  if (!row) throw new Error(`Khong tim thay chi tieu VietnamBiz: ${title}`);
  return row;
}

function optionalByTitle(rows, title) {
  return rows.find((item) => item.title === title) || null;
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatInteger(value) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatSigned(value, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}`;
}

function formatBp(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "chưa có so sánh";
  const bp = Math.round((current - previous) * 100);
  if (bp === 0) return "không đổi";
  return `${bp > 0 ? "+" : ""}${bp} bp`;
}

function formatDelta(current, previous, digits = 0) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return "chưa có so sánh";
  const diff = current - previous;
  if (diff === 0) return "không đổi";
  return formatSigned(diff, digits);
}

function shortDate(ngay) {
  return String(ngay || "").replace(/^Ngày\s+/i, "").replace(/^Tháng\s+/i, "T");
}

function toneForRateMove(row) {
  const bp = Math.round((row.value - row.pre_value) * 100);
  if (Math.abs(bp) < 10) return "trung_tinh";
  return bp > 0 ? "canh_bao" : "tot";
}

function toneForFxMove(rows) {
  const freeMarket = optionalByTitle(rows, "Tỷ giá USD tự do bán ra");
  if (!freeMarket) return "trung_tinh";
  const diff = freeMarket.value - freeMarket.pre_value;
  if (Math.abs(diff) < 50) return "trung_tinh";
  return diff > 0 ? "canh_bao" : "tot";
}

function buildPayload(rows, buildId) {
  const interbankOn = byTitle(rows, "Lãi suất liên ngân hàng _ON");
  const omo = byTitle(rows, "Lãi suất OMO");
  const centralFx = byTitle(rows, "Tỷ giá trung tâm");
  const bankSell = byTitle(rows, "Tỷ giá USD NHTM bán ra");
  const freeSell = byTitle(rows, "Tỷ giá USD tự do bán ra");
  const credit = byTitle(rows, "Tăng trưởng tín dụng (YoY)");
  const m2 = byTitle(rows, "Tăng trưởng cung tiền M2 (YoY)");
  const deposit = optionalByTitle(rows, "Tăng trưởng huy động (YoY)");

  const items = [
    {
      chi_tieu: "Lãi suất liên ngân hàng ON",
      gia_tri: `${formatNumber(interbankOn.value)}%; ${formatBp(interbankOn.value, interbankOn.pre_value)} so với trước (${shortDate(interbankOn.ngay)})`,
      tone: toneForRateMove(interbankOn),
      y_nghia: `ON ${formatBp(interbankOn.value, interbankOn.pre_value)} lên ${formatNumber(interbankOn.value)}% cho thấy chi phí vốn ngắn hạn trên liên ngân hàng tăng, cần theo dõi tác động tới ngân hàng và dòng tiền chứng khoán trong vài phiên tới`,
    },
    {
      chi_tieu: "Tỷ giá SBV/NHTM/tự do",
      gia_tri: `TT ${formatInteger(centralFx.value)} (${formatDelta(centralFx.value, centralFx.pre_value)}); NHTM ${formatInteger(bankSell.value)} (${formatDelta(bankSell.value, bankSell.pre_value)}); tự do ${formatInteger(freeSell.value)} (${formatDelta(freeSell.value, freeSell.pre_value)})`,
      tone: toneForFxMove(rows),
      y_nghia: `Tỷ giá tự do biến động ${formatDelta(freeSell.value, freeSell.pre_value)} trong ngày là tín hiệu cần soi cùng USD/VND và bán ròng ngoại để đánh giá áp lực tỷ giá ngắn hạn`,
    },
    {
      chi_tieu: "Lãi suất OMO",
      gia_tri: `${formatNumber(omo.value)}%; ${formatBp(omo.value, omo.pre_value)} (${shortDate(omo.ngay)})`,
      tone: Math.round((omo.value - omo.pre_value) * 100) === 0 ? "trung_tinh" : toneForRateMove(omo),
      y_nghia: `OMO ở ${formatNumber(omo.value)}% cho thấy mặt bằng điều hành ngắn hạn chưa đổi, nên áp lực thanh khoản cần đọc thêm qua ON và hoạt động bơm/hút của SBV`,
    },
    {
      chi_tieu: "Tín dụng & cung tiền",
      gia_tri: `Tín dụng ${formatNumber(credit.value)}% YoY; M2 ${formatNumber(m2.value)}% YoY${deposit ? `; huy động ${formatNumber(deposit.value)}% YoY` : ""} (${shortDate(credit.ngay)})`,
      tone: "trung_tinh",
      y_nghia: "Tín dụng tăng nhanh hơn M2/huy động là nền hỗ trợ tăng trưởng nhưng cũng làm thị trường nhạy hơn với biến động lãi suất và thanh khoản tiền đồng",
    },
  ];

  return {
    buildId,
    fetchedAt: new Date().toISOString(),
    source: {
      ten: `${SOURCE_NAME} ${shortDate(interbankOn.ngay)} — currency-interest-rate`,
      url: PAGE_URL,
    },
    items,
    raw: {
      interbankOn,
      omo,
      centralFx,
      bankSell,
      freeSell,
      credit,
      m2,
      deposit,
    },
  };
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
  const date = args.date || todayKeyInVietnam();
  const byDate = path.join(DATA_DIR, `${date}.json`);
  if (fs.existsSync(byDate)) return byDate;
  if (args.date) throw new Error(`Khong tim thay ${byDate}`);
  return latestDataFile();
}

function findSection05(report) {
  const section = (report.muc || []).find(
    (muc) => muc.so === "05" || /v[iĩ] mô|ti[eề]n t[eệ]/i.test(muc.ten || ""),
  );
  if (!section || !Array.isArray(section.items)) {
    throw new Error("Khong tim thay muc §05 Vĩ mô & tiền tệ trong JSON");
  }
  return section;
}

function upsertItem(items, nextItem) {
  const patterns = [
    nextItem.chi_tieu,
    nextItem.chi_tieu.replace(/\s+ON$/i, ""),
    nextItem.chi_tieu.replace(/\s*&.*$/i, ""),
  ].filter(Boolean);

  const index = items.findIndex((item) =>
    patterns.some((pattern) => new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(item.chi_tieu || "")),
  );
  if (index >= 0) items[index] = nextItem;
  else items.push(nextItem);
}

function upsertSource(report, source) {
  if (!Array.isArray(report.nguon)) report.nguon = [];
  const index = report.nguon.findIndex(
    (item) => item.url === PAGE_URL || /^VietnamBiz Data .*currency-interest-rate/i.test(item.ten || ""),
  );
  if (index >= 0) report.nguon[index] = source;
  else report.nguon.push(source);
}

function sortSection05Items(items) {
  const priority = [
    [/^USD\/VND/i, 40],
    [/^Lãi suất liên ngân hàng/i, 45],
    [/^Tỷ giá SBV/i, 46],
    [/^Lãi suất OMO/i, 47],
    [/^Tín dụng & cung tiền/i, 48],
    [/^KQKD quý 2/i, 80],
  ];

  return items
    .map((item, index) => {
      const rank = priority.find(([pattern]) => pattern.test(item.chi_tieu || ""))?.[1] ?? index;
      return { item, index, rank };
    })
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ item }) => item);
}

function applyPayload(report, payload) {
  const section = findSection05(report);
  for (const item of payload.items) upsertItem(section.items, item);
  section.items = sortSection05Items(section.items);
  upsertSource(report, payload.source);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const { buildId, rows } = await fetchVietnamBizData();
  const payload = buildPayload(rows, buildId);

  if (!args.apply) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const file = resolveTargetFile(args);
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  applyPayload(report, payload);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Da cap nhat VietnamBiz vao ${path.relative(ROOT, file)}`);
  for (const item of payload.items) console.log(`${item.chi_tieu}: ${item.gia_tri}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
