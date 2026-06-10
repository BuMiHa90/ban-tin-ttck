// Render bản tin TTCK từ du-lieu/*.json ra web/ (trang tĩnh, không cần server)
// Chạy: node render.js
const fs = require("fs");
const path = require("path");

const DIR_DATA = path.join(__dirname, "du-lieu");
const DIR_OUT = path.join(__dirname, "docs");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const THU = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
function ngayVN(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { thu: THU[new Date(y, m - 1, d).getDay()], cham: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}` };
}

const TONE = {
  tot: { mau: "#178A50", nen: "#E3F4EB", dam: "#0C5631" },
  xau: { mau: "#D6453D", nen: "#FBEAE9", dam: "#8C231D" },
  canh_bao: { mau: "#B97A0F", nen: "#FAF0DC", dam: "#7A4E05" },
  trung_tinh: { mau: "#5B6B80", nen: "#EDF1F6", dam: "#2C3E55" },
  info: { mau: "#1E6FD9", nen: "#E7F0FC", dam: "#0F4187" },
};
const tone = (t) => TONE[t] || TONE.trung_tinh;
const HUONG = { tang: { ky: "▲", mau: TONE.tot.mau }, giam: { ky: "▼", mau: TONE.xau.mau }, canh_bao: { ky: "●", mau: TONE.canh_bao.mau } };

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Be Vietnam Pro',system-ui,sans-serif;background:#EDF0F5;color:#122B4D;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:#1E6FD9;text-decoration:none}a:hover{text-decoration:underline}
.khung{max-width:1100px;margin:0 auto;padding:0 20px}
.topbar{background:#fff;border-bottom:3px solid #122B4D}
.topbar .khung{display:flex;justify-content:space-between;align-items:center;padding-top:14px;padding-bottom:14px;gap:12px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:10px}
.brand .logo{width:30px;height:30px;border-radius:50%;background:#122B4D;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
.brand .ten{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.brand .phu{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#1E6FD9;font-weight:600}
.tieude-bar{font-size:18px;font-weight:800;color:#122B4D}
.meta-bar{text-align:right;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5B6B80;font-weight:600;line-height:1.8}
.meta-bar b{color:#122B4D}
.hero{background:#fff;border-bottom:1px solid #DDE3EC}
.hero .khung{display:grid;grid-template-columns:minmax(220px,1fr) 2fr;gap:32px;padding-top:34px;padding-bottom:34px}
.badge-ngay{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#1E6FD9;border:1.5px solid #1E6FD9;padding:5px 12px;border-radius:4px;margin-bottom:14px}
.hero h1{font-size:46px;line-height:1.08;font-weight:800;color:#122B4D;letter-spacing:-.01em}
.hero .diem-nhan{font-size:21px;font-weight:700;line-height:1.4;margin-bottom:10px}
.hero .diem-nhan .xanh{color:#1E6FD9}
.hero .dande{font-size:14.5px;color:#44546A;font-style:italic}
.metrics{background:#fff;padding:6px 0 26px}
.metrics .khung{display:grid;grid-template-columns:repeat(auto-fit,minmax(152px,1fr));gap:14px}
.mcard{border:1px solid #DDE3EC;border-radius:8px;padding:14px 16px;background:#fff}
.mcard .nhan{font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#5B6B80;margin-bottom:6px}
.mcard .so{font-size:25px;font-weight:800;color:#122B4D;letter-spacing:-.01em;line-height:1.1}
.mcard .phu{font-size:13px;font-weight:700;margin-top:3px}
.mcard .chu{margin-top:9px;font-size:11px;color:#5B6B80;border-left:3px solid #DDE3EC;padding:2px 0 2px 9px;font-style:italic;line-height:1.45}
.noidung{padding:26px 0 8px}
.noidung .khung{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.sec{background:#fff;border:1px solid #DDE3EC;border-radius:10px;padding:22px 24px}
.sec .dau{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.sec .so-sec{font-size:13px;font-weight:800;color:#1E6FD9;letter-spacing:.06em}
.sec h2{font-size:19px;font-weight:800;color:#122B4D}
.sec .ghichu-sec{font-size:11px;color:#8593A6;font-style:italic;margin-bottom:10px}
.diem-item{display:flex;gap:11px;padding:9px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#2C3E55}
.diem-item:last-child{border-bottom:none}
.diem-item .cham{flex:none;width:8px;height:8px;border-radius:50%;margin-top:7px}
.bang-item{padding:8px 0;border-bottom:1px dashed #E4E9F0}
.bang-item:last-child{border-bottom:none}
.bang-dong{display:flex;justify-content:space-between;gap:14px;font-size:13.5px}
.bang-dong .ct{color:#44546A}
.bang-dong .gt{font-weight:800;white-space:nowrap;text-align:right}
.ma-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#2C3E55}
.ma-item:last-child{border-bottom:none}
.ma-chip{flex:none;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:4px;margin-top:2px;letter-spacing:.04em}
.mucgia{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#44546A}
.mucgia:last-child{border-bottom:none}
.mucgia .nhan{flex:none;min-width:64px;text-align:center;font-weight:800;font-size:15px;padding:5px 10px;border-radius:5px;border-left:4px solid}
.sec.rong{grid-column:1/-1}
.qt-luoi{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
.qt-item{padding:9px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px}
.qt-dong{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.qt-ten{font-weight:600;color:#2C3E55}
.qt-so{font-weight:800;color:#122B4D;white-space:nowrap}
.qt-ynghia{margin-top:2px;font-size:12px;color:#0F4187;font-style:italic;line-height:1.5}
.lich-item{display:flex;gap:9px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#2C3E55}
.lich-item:last-child{border-bottom:none}
.lich-khi{flex:none;min-width:88px;text-align:center;font-weight:800;font-size:12px;padding:3px 8px;border-radius:4px}
.lich-pv{flex:none;font-size:10px;font-weight:800;letter-spacing:.08em;padding:2px 6px;border-radius:3px;margin-top:3px}
.quote{padding:10px 0 26px}
.quote .hop{background:#E7F0FC;border-radius:10px;padding:26px 32px;display:flex;gap:18px;align-items:flex-start}
.quote .dau-nhay{font-size:52px;font-weight:800;color:#1E6FD9;line-height:.8;font-family:Georgia,serif}
.dg-tieude{font-size:11px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#1E6FD9;margin-bottom:7px}
.quote p{font-size:16.5px;font-style:italic;font-weight:500;color:#0F4187;line-height:1.65}
.quote .ai{margin-top:8px;font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#1E6FD9;font-style:normal}
.chantrang{background:#122B4D;color:#fff;margin-top:14px}
.chantrang .khung{padding-top:22px;padding-bottom:22px}
.chantrang .hang{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}
.chantrang .brand-ft{font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:13px}
.chantrang .mota-ft{font-size:11px;color:#9FB2CC;font-style:italic}
.chantrang .nguon{margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.15);font-size:11px;color:#9FB2CC;line-height:2}
.chantrang .nguon a{color:#8FBCF2}
.list-bc{padding:30px 0}
.card-ngay{display:flex;gap:22px;background:#fff;border:1px solid #DDE3EC;border-radius:10px;padding:22px 26px;margin-bottom:14px;align-items:center}
.card-ngay:hover{border-color:#1E6FD9}
.o-ngay{flex:none;text-align:center;border-right:1px solid #E4E9F0;padding-right:22px}
.o-ngay .d{font-size:34px;font-weight:800;color:#122B4D;line-height:1}
.o-ngay .my{font-size:11px;font-weight:700;letter-spacing:.1em;color:#5B6B80;text-transform:uppercase;margin-top:4px}
.card-ngay h3{font-size:20px;font-weight:800;color:#122B4D;margin-bottom:4px}
.card-ngay .tom{font-size:13px;color:#5B6B80;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.chip-vni{flex:none;text-align:right}
.chip-vni .v{font-size:20px;font-weight:800}
.chip-vni .l{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#5B6B80;font-weight:700}
@media(max-width:760px){.hero .khung{grid-template-columns:1fr;gap:18px}.hero h1{font-size:34px}.noidung .khung{grid-template-columns:1fr}.tieude-bar{display:none}.card-ngay{flex-wrap:wrap}.qt-luoi{grid-template-columns:1fr}}
`;

const khungTrang = (tieuDe, thanPhan) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tieuDe)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
${thanPhan}
</body>
</html>`;

const topbar = (giua, phai) => `
<header class="topbar"><div class="khung">
  <div class="brand"><div class="logo">VN</div><div><div class="ten">Bản tin TTCK</div><div class="phu">Daily research</div></div></div>
  <div class="tieude-bar">— ${esc(giua)} —</div>
  <div class="meta-bar">${phai}</div>
</div></header>`;

function secDiem(items) {
  return items.map((it) => `<div class="diem-item"><span class="cham" style="background:${tone(it.tone).mau}"></span><span>${esc(it.text)}${it.y_nghia ? `<div class="qt-ynghia">→ VN: ${esc(it.y_nghia)}</div>` : ""}</span></div>`).join("");
}
function secBang(items) {
  return items.map((it) => `<div class="bang-item"><div class="bang-dong"><span class="ct">${esc(it.chi_tieu)}</span><span class="gt" style="color:${tone(it.tone).dam}">${esc(it.gia_tri)}</span></div>${it.y_nghia ? `<div class="qt-ynghia">→ ${esc(it.y_nghia)}</div>` : ""}</div>`).join("");
}
function secMa(items) {
  return items.map((it) => `<div class="ma-item"><span class="ma-chip" style="background:${tone(it.tone).nen};color:${tone(it.tone).dam}">${esc(it.ma)}</span><span>${esc(it.text)}${it.y_nghia ? `<div class="qt-ynghia">→ ${esc(it.y_nghia)}</div>` : ""}</span></div>`).join("");
}
function secMucGia(items) {
  return items.map((it) => `<div class="mucgia"><span class="nhan" style="background:${tone(it.tone).nen};color:${tone(it.tone).dam};border-color:${tone(it.tone).mau}">${esc(it.nhan)}</span><span>${esc(it.text)}</span></div>`).join("");
}
function secQuocTe(items) {
  return `<div class="qt-luoi">` + items
    .map((it) => {
      const h = HUONG[it.huong];
      return `<div class="qt-item"><div class="qt-dong"><span class="qt-ten">${esc(it.ten)}</span><span class="qt-so">${esc(it.gia_tri)}${it.thay_doi ? ` <span style="color:${h ? h.mau : "#5B6B80"}">${h ? h.ky + " " : ""}${esc(it.thay_doi)}</span>` : ""}</span></div>${it.y_nghia ? `<div class="qt-ynghia">→ VN: ${esc(it.y_nghia)}</div>` : ""}</div>`;
    })
    .join("") + `</div>`;
}
function secLich(items) {
  return items
    .map((it) => {
      const t = tone(it.tone);
      const vn = (it.pham_vi || "QT").toUpperCase() === "VN";
      return `<div class="lich-item"><span class="lich-khi" style="background:${t.nen};color:${t.dam}">${esc(it.khi)}</span><span class="lich-pv" style="background:${vn ? "#E7F0FC" : "#EDF1F6"};color:${vn ? "#0F4187" : "#2C3E55"}">${vn ? "VN" : "QT"}</span><span>${esc(it.su_kien)}</span></div>`;
    })
    .join("");
}
const RENDER_MUC = { diem: secDiem, bang: secBang, ma: secMa, muc_gia: secMucGia, quoc_te: secQuocTe, lich: secLich };

function trangNgay(d) {
  const n = ngayVN(d.ngay);
  const metrics = d.chi_so
    .map((c) => {
      const h = HUONG[c.huong];
      return `<div class="mcard">
    <div class="nhan">${esc(c.ten)}</div>
    <div class="so">${esc(c.gia_tri)}</div>
    ${c.phu ? `<div class="phu" style="color:${h ? h.mau : "#5B6B80"}">${h ? h.ky + " " : ""}${esc(c.phu)}</div>` : ""}
    ${c.ghi_chu ? `<div class="chu">${esc(c.ghi_chu)}</div>` : ""}
  </div>`;
    })
    .join("");

  const cacMuc = d.muc
    .map((m) => {
      const render = RENDER_MUC[m.loai] || secDiem;
      return `<section class="sec${m.rong ? " rong" : ""}">
    <div class="dau"><span class="so-sec">§ ${esc(m.so)}</span><h2>${esc(m.ten)}</h2></div>
    ${m.ghi_chu ? `<div class="ghichu-sec">${esc(m.ghi_chu)}</div>` : ""}
    ${render(m.items)}
  </section>`;
    })
    .join("");

  const nguon = (d.nguon || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.ten)}</a>`).join(" · ");

  const than = `
${topbar("Báo cáo thị trường ngày", `<b>${n.thu.toUpperCase()} · ${n.cham}</b><br>Tổng hợp trước giờ giao dịch · <a href="index.html">tất cả bản tin</a>`)}
<div class="hero"><div class="khung">
  <div><span class="badge-ngay">Bản tin ngày · ${n.cham}</span><h1>${esc(d.tieu_de)}</h1></div>
  <div><div class="diem-nhan">${esc(d.chi_so[0]?.ten || "")} ${esc(d.chi_so[0]?.gia_tri || "")} — <span class="xanh">${esc(d.chi_so[0]?.ghi_chu || "")}</span></div><p class="dande">${esc(d.dan_de)}</p></div>
</div></div>
<div class="metrics"><div class="khung">${metrics}</div></div>
<main class="noidung"><div class="khung">${cacMuc}</div></main>
<div class="quote"><div class="khung"><div class="hop"><div class="dau-nhay">"</div><div><div class="dg-tieude">Đánh giá của desk</div><p>${esc(d.danh_gia || d.quote)}</p><div class="ai">— Agent tổng hợp tin tức · ${n.cham} · diễn giải tác động, không phải khuyến nghị</div></div></div></div></div>
<footer class="chantrang"><div class="khung">
  <div class="hang"><span class="brand-ft">Bản tin TTCK Việt Nam</span><span class="mota-ft">Tài liệu tham khảo tổng hợp tự động · các dòng → là diễn giải tác động của agent · không phải khuyến nghị giao dịch chứng khoán</span></div>
  <div class="nguon">Nguồn: ${nguon}</div>
</div></footer>`;
  return khungTrang(`${d.tieu_de} — Bản tin ${n.cham}`, than);
}

function trangIndex(ds) {
  const cards = ds
    .map((d) => {
      const n = ngayVN(d.ngay);
      const [y, m, day] = d.ngay.split("-");
      const vni = d.chi_so[0] || {};
      const h = HUONG[vni.huong];
      return `<a class="card-ngay" href="${d.ngay}.html" style="text-decoration:none">
    <div class="o-ngay"><div class="d">${day}</div><div class="my">Th${Number(m)} · ${y}</div></div>
    <div style="flex:1;min-width:200px"><h3>${esc(d.tieu_de)}</h3><div class="tom">${esc(d.dan_de)}</div></div>
    <div class="chip-vni"><div class="l">${esc(vni.ten || "")}</div><div class="v" style="color:${h ? h.mau : "#122B4D"}">${esc(vni.gia_tri || "")}</div></div>
  </a>`;
    })
    .join("");
  const than = `
${topbar("Lưu trữ bản tin", `<b>${ds.length} bản tin</b><br>Cập nhật mỗi sáng trước giờ giao dịch`)}
<main class="list-bc"><div class="khung">${cards}</div></main>
<footer class="chantrang"><div class="khung">
  <div class="hang"><span class="brand-ft">Bản tin TTCK Việt Nam</span><span class="mota-ft">Tài liệu tham khảo tổng hợp tự động · không phải khuyến nghị giao dịch chứng khoán</span></div>
</div></footer>`;
  return khungTrang("Bản tin TTCK Việt Nam — Lưu trữ", than);
}

function main() {
  if (!fs.existsSync(DIR_OUT)) fs.mkdirSync(DIR_OUT, { recursive: true });
  const files = fs.readdirSync(DIR_DATA).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().reverse();
  const ds = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR_DATA, f), "utf8")));
  for (const d of ds) fs.writeFileSync(path.join(DIR_OUT, `${d.ngay}.html`), trangNgay(d), "utf8");
  fs.writeFileSync(path.join(DIR_OUT, "index.html"), trangIndex(ds), "utf8");
  fs.writeFileSync(path.join(DIR_OUT, ".nojekyll"), "", "utf8");
  console.log(`Đã render ${ds.length} bản tin -> docs/ (index.html + ${ds.map((d) => d.ngay + ".html").join(", ")})`);
}
main();
