#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "du-lieu");
const XE_CHART_PAGE = "https://www.xe.com/currencycharts/?from=USD&to=VND";
const XE_API =
  "https://www.xe.com/api/protected/charting-rates/?fromCurrency=USD&toCurrency=VND";

const MS_1D = 24 * 60 * 60 * 1000;
const DEFAULT_BASIC_AUTH = "lodestar:pugsnax";

function parseArgs(argv) {
  const args = { apply: false, extended: false, date: null, file: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--extended") args.extended = true;
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
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-ty-gia-xe.js\" [--date YYYY-MM-DD] [--apply] [--extended]'",
    "",
    "Examples:",
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-ty-gia-xe.js\" --date 2026-06-22'",
    "  pwsh -NoProfile -Command '$node=(Get-Command node -ErrorAction Stop).Source; & $node \"F:\\Hai BUi\\Agent tổng hợp tin tức\\scripts\\cap-nhat-ty-gia-xe.js\" --date 2026-06-22 --apply'",
    "",
    "Env overrides:",
    "  XE_AUTHORIZATION='Basic ...'  # full Authorization header",
    "  XE_BASIC_AUTH='user:pass'      # encoded as Basic automatically",
  ].join("\n");
}

function getAuthorizationHeader() {
  if (process.env.XE_AUTHORIZATION) return process.env.XE_AUTHORIZATION;
  const basic = process.env.XE_BASIC_AUTH || DEFAULT_BASIC_AUTH;
  return `Basic ${Buffer.from(basic, "utf8").toString("base64")}`;
}

function requestJson(url, headers) {
  if (typeof fetch === "function") {
    return fetch(url, { headers }).then(async (res) => {
      const text = await res.text();
      if (!res.ok) throw new Error(`XE HTTP ${res.status}: ${text.slice(0, 200)}`);
      return JSON.parse(text);
    });
  }

  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`XE HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
  });
}

async function fetchXeChart({ extended }) {
  const url = extended ? `${XE_API}&isExtended=true` : XE_API;
  return requestJson(url, {
    Accept: "application/json",
    Authorization: getAuthorizationHeader(),
    Referer: XE_CHART_PAGE,
    "User-Agent": "Mozilla/5.0",
  });
}

function decodeBatches(data) {
  if (!data || data.from !== "USD" || data.to !== "VND" || !Array.isArray(data.batchList)) {
    throw new Error("Response XE khong dung schema USD/VND batchList");
  }

  const byTimestamp = new Map();
  for (const batch of data.batchList) {
    if (!Array.isArray(batch.rates) || batch.rates.length < 2) continue;
    const [baseOffset, ...rates] = batch.rates;
    for (let i = 0; i < rates.length; i += 1) {
      const timestamp = batch.startTime + i * batch.interval;
      const rate = Math.round((rates[i] - baseOffset + Number.EPSILON) * 1e10) / 1e10;
      byTimestamp.set(timestamp, { timestamp, rate });
    }
  }

  return [...byTimestamp.values()].sort((a, b) => a.timestamp - b.timestamp);
}

function nearestAtOrBefore(points, timestamp) {
  let lo = 0;
  let hi = points.length - 1;
  let best = null;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (points[mid].timestamp <= timestamp) {
      best = points[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function calcChange(latest, previous) {
  if (!latest || !previous) return null;
  const abs = latest.rate - previous.rate;
  const pct = previous.rate === 0 ? 0 : (abs / previous.rate) * 100;
  return { abs, pct, previous };
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSigned(value, digits = 2) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}`;
}

function formatChange(change) {
  if (!change) return "chua du lich su";
  return `${formatSigned(change.abs)} (${formatSigned(change.pct)}%)`;
}

function formatSourceTime(timestamp) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(timestamp))
    .replace(",", "");
}

function toneFromChange(change) {
  if (!change || Math.abs(change.pct) < 0.05) return "trung_tinh";
  return change.pct > 0 ? "canh_bao" : "tot";
}

function yNghiaFromChange(change) {
  if (!change || Math.abs(change.pct) < 0.05) {
    return "USD/VND gần như đi ngang trong 24h, nên tỷ giá chưa tạo thêm tín hiệu mới cho nhóm nhập khẩu, xuất khẩu và nợ USD";
  }
  if (change.pct > 0) {
    return `USD/VND tăng ${formatSigned(change.pct)}% trong 24h phản ánh VND yếu hơn, tạo áp lực theo dõi với doanh nghiệp nợ USD và nhập khẩu trong ngắn hạn`;
  }
  return `USD/VND giảm ${formatNumber(Math.abs(change.pct))}% trong 24h phản ánh VND mạnh hơn, giúp hạ áp lực chi phí USD với nhập khẩu và doanh nghiệp vay ngoại tệ trong ngắn hạn`;
}

function buildSectionPayload(data, points) {
  const latest = points[points.length - 1];
  if (!latest) throw new Error("XE khong tra diem ty gia nao");

  const change24h = calcChange(latest, nearestAtOrBefore(points, latest.timestamp - MS_1D));
  const change30d = calcChange(latest, nearestAtOrBefore(points, latest.timestamp - 30 * MS_1D));

  const item = {
    chi_tieu: "USD/VND (XE)",
    gia_tri: `${formatNumber(latest.rate)}; 24h ${formatChange(change24h)}; 30 ngày ${formatChange(change30d)}`,
    tone: toneFromChange(change24h),
    y_nghia: yNghiaFromChange(change24h),
  };

  const source = {
    ten: `XE ${formatSourceTime(latest.timestamp)} ICT — USD/VND charting-rates (tạm dùng)`,
    url: XE_CHART_PAGE,
  };

  return {
    from: data.from,
    to: data.to,
    timestamp: latest.timestamp,
    iso: new Date(latest.timestamp).toISOString(),
    pointCount: points.length,
    latest,
    change24h,
    change30d,
    item,
    source,
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

function upsertXePayload(report, payload) {
  const section = (report.muc || []).find(
    (muc) => muc.so === "05" || /v[iĩ] mô|ti[eề]n t[eệ]/i.test(muc.ten || ""),
  );
  if (!section || !Array.isArray(section.items)) {
    throw new Error("Khong tim thay muc §05 Vĩ mô & tiền tệ trong JSON");
  }

  const itemIndex = section.items.findIndex((item) =>
    /usd\s*\/\s*vnd|tỷ giá|ty gia/i.test(item.chi_tieu || ""),
  );
  if (itemIndex >= 0) section.items[itemIndex] = payload.item;
  else section.items.push(payload.item);

  if (!Array.isArray(report.nguon)) report.nguon = [];
  const sourceIndex = report.nguon.findIndex(
    (source) => source.url === XE_CHART_PAGE || /^XE .*USD\/VND/i.test(source.ten || ""),
  );
  if (sourceIndex >= 0) report.nguon[sourceIndex] = payload.source;
  else report.nguon.push(payload.source);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const data = await fetchXeChart(args);
  const points = decodeBatches(data);
  const payload = buildSectionPayload(data, points);

  if (!args.apply) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const file = resolveTargetFile(args);
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  upsertXePayload(report, payload);
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Da cap nhat USD/VND (XE) vao ${path.relative(ROOT, file)}`);
  console.log(`${payload.item.chi_tieu}: ${payload.item.gia_tri}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
