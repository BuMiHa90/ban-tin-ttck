// Render bản tin TTCK từ du-lieu/*.json ra docs/ (trang tĩnh, không cần server)
// Layout dùng Tailwind CSS import từ CDN (cdn.tailwindcss.com) — không tự viết CSS.
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

// Lớp tiện ích Tailwind dùng lại
const CL = {
  khung: "max-w-[1100px] mx-auto px-5",
  ynghia: "mt-0.5 text-xs text-[#0F4187] italic leading-[1.5]",
  rowBorder: "border-b border-dashed border-[#E4E9F0] last:border-b-0",
};

const khungTrang = (tieuDe, thanPhan) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(tieuDe)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: { fontFamily: { sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'] } } } };
</script>
</head>
<body class="font-sans bg-[#EDF0F5] text-[#122B4D] antialiased leading-relaxed" style="background:#EDF0F5">
${thanPhan}
</body>
</html>`;

const topbar = (giua, phai) => `
<header class="bg-white border-b-[3px] border-[#122B4D]">
  <div class="${CL.khung} py-3.5 flex justify-between items-center gap-3 flex-wrap">
    <div class="flex items-center gap-2.5">
      <div class="w-[30px] h-[30px] rounded-full bg-[#122B4D] text-white flex items-center justify-center font-extrabold text-[13px]">VN</div>
      <div>
        <div class="text-xs font-bold tracking-[0.14em] uppercase">Bản tin TTCK</div>
        <div class="text-[10px] tracking-[0.18em] uppercase text-[#1E6FD9] font-semibold">Daily research</div>
      </div>
    </div>
    <div class="text-lg font-extrabold text-[#122B4D] max-md:hidden">— ${esc(giua)} —</div>
    <div class="text-right text-[10px] tracking-[0.14em] uppercase text-[#5B6B80] font-semibold leading-[1.8] [&_b]:text-[#122B4D] [&_a]:text-[#1E6FD9] hover:[&_a]:underline">${phai}</div>
  </div>
</header>`;

function secDiem(items) {
  return items
    .map(
      (it) =>
        `<div class="flex gap-[11px] py-[9px] ${CL.rowBorder} text-[13.5px] text-[#2C3E55]"><span class="shrink-0 w-2 h-2 rounded-full mt-[7px]" style="background:${tone(it.tone).mau}"></span><span>${esc(it.text)}${it.y_nghia ? `<div class="${CL.ynghia}">→ VN: ${esc(it.y_nghia)}</div>` : ""}</span></div>`
    )
    .join("");
}
function secBang(items) {
  return items
    .map(
      (it) =>
        `<div class="py-2 ${CL.rowBorder}"><div class="flex justify-between gap-3.5 items-baseline text-[13.5px]"><span class="text-[#44546A] basis-[38%] grow-0 shrink-0 min-w-0">${esc(it.chi_tieu)}</span><span class="font-extrabold text-right grow shrink min-w-0 [overflow-wrap:anywhere]" style="color:${tone(it.tone).dam}">${esc(it.gia_tri)}</span></div>${it.y_nghia ? `<div class="${CL.ynghia}">→ ${esc(it.y_nghia)}</div>` : ""}</div>`
    )
    .join("");
}
function secMa(items) {
  return items
    .map(
      (it) =>
        `<div class="flex gap-2.5 items-start py-2 ${CL.rowBorder} text-[13.5px] text-[#2C3E55]"><span class="shrink-0 text-[11.5px] font-extrabold px-[9px] py-0.5 rounded mt-0.5 tracking-[0.04em]" style="background:${tone(it.tone).nen};color:${tone(it.tone).dam}">${esc(it.ma)}</span><span>${esc(it.text)}${it.y_nghia ? `<div class="${CL.ynghia}">→ ${esc(it.y_nghia)}</div>` : ""}</span></div>`
    )
    .join("");
}
function secMucGia(items) {
  return items
    .map(
      (it) =>
        `<div class="flex items-center gap-3 py-[9px] ${CL.rowBorder} text-[13.5px] text-[#44546A]"><span class="shrink-0 min-w-[64px] text-center font-extrabold text-[15px] px-2.5 py-[5px] rounded-[5px] border-l-4" style="background:${tone(it.tone).nen};color:${tone(it.tone).dam};border-color:${tone(it.tone).mau}">${esc(it.nhan)}</span><span>${esc(it.text)}</span></div>`
    )
    .join("");
}
function secQuocTe(items) {
  return (
    `<div class="grid grid-cols-1 md:grid-cols-2 gap-x-8">` +
    items
      .map((it) => {
        const h = HUONG[it.huong];
        return `<div class="py-[9px] border-b border-dashed border-[#E4E9F0] text-[13.5px]"><div class="flex justify-between gap-3 items-baseline"><span class="font-semibold text-[#2C3E55] shrink-0">${esc(it.ten)}</span><span class="font-extrabold text-[#122B4D] text-right min-w-0 [overflow-wrap:anywhere]">${esc(it.gia_tri)}${it.thay_doi ? ` <span class="whitespace-nowrap" style="color:${h ? h.mau : "#5B6B80"}">${h ? h.ky + " " : ""}${esc(it.thay_doi)}</span>` : ""}</span></div>${it.y_nghia ? `<div class="${CL.ynghia}">→ VN: ${esc(it.y_nghia)}</div>` : ""}</div>`;
      })
      .join("") +
    `</div>`
  );
}
function secLich(items) {
  return items
    .map((it) => {
      const t = tone(it.tone);
      const vn = (it.pham_vi || "QT").toUpperCase() === "VN";
      return `<div class="flex gap-[9px] items-start py-2 ${CL.rowBorder} text-[13.5px] text-[#2C3E55]"><span class="shrink-0 min-w-[88px] text-center font-extrabold text-xs px-2 py-[3px] rounded" style="background:${t.nen};color:${t.dam}">${esc(it.khi)}</span><span class="shrink-0 text-[10px] font-extrabold tracking-[0.08em] px-1.5 py-0.5 rounded-[3px] mt-[3px]" style="background:${vn ? "#E7F0FC" : "#EDF1F6"};color:${vn ? "#0F4187" : "#2C3E55"}">${vn ? "VN" : "QT"}</span><span>${esc(it.su_kien)}</span></div>`;
    })
    .join("");
}
const RENDER_MUC = { diem: secDiem, bang: secBang, ma: secMa, muc_gia: secMucGia, quoc_te: secQuocTe, lich: secLich };

function trangNgay(d) {
  const n = ngayVN(d.ngay);
  const metrics = d.chi_so
    .map((c) => {
      const h = HUONG[c.huong];
      return `<div class="border border-[#DDE3EC] rounded-lg px-4 py-3.5 bg-white">
    <div class="text-[10px] font-bold tracking-[0.13em] uppercase text-[#5B6B80] mb-1.5">${esc(c.ten)}</div>
    <div class="text-[25px] font-extrabold text-[#122B4D] tracking-[-0.01em] leading-[1.1]">${esc(c.gia_tri)}</div>
    ${c.phu ? `<div class="text-[13px] font-bold mt-[3px]" style="color:${h ? h.mau : "#5B6B80"}">${h ? h.ky + " " : ""}${esc(c.phu)}</div>` : ""}
    ${c.ghi_chu ? `<div class="mt-[9px] text-[11px] text-[#5B6B80] border-l-[3px] border-[#DDE3EC] pl-[9px] py-0.5 italic leading-[1.45]">${esc(c.ghi_chu)}</div>` : ""}
  </div>`;
    })
    .join("");

  const cacMuc = d.muc
    .map((m) => {
      const render = RENDER_MUC[m.loai] || secDiem;
      return `<section class="bg-white border border-[#DDE3EC] rounded-[10px] px-6 py-[22px]${m.rong ? " md:col-span-2" : ""}">
    <div class="flex items-baseline gap-2.5 mb-1.5"><span class="text-[13px] font-extrabold text-[#1E6FD9] tracking-[0.06em]">§ ${esc(m.so)}</span><h2 class="text-[19px] font-extrabold text-[#122B4D]">${esc(m.ten)}</h2></div>
    ${m.ghi_chu ? `<div class="text-[11px] text-[#8593A6] italic mb-2.5">${esc(m.ghi_chu)}</div>` : ""}
    ${render(m.items)}
  </section>`;
    })
    .join("");

  const nguon = (d.nguon || [])
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener" class="text-[#8FBCF2] hover:underline">${esc(s.ten)}</a>`)
    .join(" · ");

  const than = `
${topbar("Báo cáo thị trường ngày", `<b>${n.thu.toUpperCase()} · ${n.cham}</b><br>Tổng hợp trước giờ giao dịch · <a href="index.html">tất cả bản tin</a>`)}
<div class="bg-white border-b border-[#DDE3EC]">
  <div class="${CL.khung} grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_2fr] gap-8 py-[34px]">
    <div>
      <span class="inline-block text-[11px] font-bold tracking-[0.14em] uppercase text-[#1E6FD9] border-[1.5px] border-[#1E6FD9] px-3 py-[5px] rounded mb-3.5">Bản tin ngày · ${n.cham}</span>
      <h1 class="text-[34px] md:text-[46px] leading-[1.08] font-extrabold text-[#122B4D] tracking-[-0.01em]">${esc(d.tieu_de)}</h1>
    </div>
    <div>
      <div class="text-[21px] font-bold leading-[1.4] mb-2.5">${esc(d.chi_so[0]?.ten || "")} ${esc(d.chi_so[0]?.gia_tri || "")} — <span class="text-[#1E6FD9]">${esc(d.chi_so[0]?.ghi_chu || "")}</span></div>
      <p class="text-[14.5px] text-[#44546A] italic">${esc(d.dan_de)}</p>
    </div>
  </div>
</div>
<div class="bg-white pt-1.5 pb-[26px]">
  <div class="${CL.khung} grid grid-cols-[repeat(auto-fit,minmax(152px,1fr))] gap-3.5">${metrics}</div>
</div>
<main class="pt-[26px] pb-2">
  <div class="${CL.khung} grid grid-cols-1 md:grid-cols-2 gap-[18px] items-start">${cacMuc}</div>
</main>
<div class="pt-2.5 pb-[26px]">
  <div class="${CL.khung}">
    <div class="bg-[#E7F0FC] rounded-[10px] px-8 py-[26px] flex gap-[18px] items-start">
      <div class="text-[52px] font-extrabold text-[#1E6FD9] leading-[0.8] font-serif">"</div>
      <div>
        <div class="text-[11px] font-extrabold tracking-[0.13em] uppercase text-[#1E6FD9] mb-[7px]">Đánh giá của desk</div>
        <p class="text-[16.5px] italic font-medium text-[#0F4187] leading-[1.65]">${esc(d.danh_gia || d.quote)}</p>
        <div class="mt-2 text-[11px] font-bold tracking-[0.13em] uppercase text-[#1E6FD9]">— Agent tổng hợp tin tức · ${n.cham} · diễn giải tác động, không phải khuyến nghị</div>
      </div>
    </div>
  </div>
</div>
<footer class="bg-[#122B4D] text-white mt-3.5">
  <div class="${CL.khung} py-[22px]">
    <div class="flex justify-between gap-4 flex-wrap items-center">
      <span class="font-extrabold tracking-[0.12em] uppercase text-[13px]">Bản tin TTCK Việt Nam</span>
      <span class="text-[11px] text-[#9FB2CC] italic">Tài liệu tham khảo tổng hợp tự động · các dòng → là diễn giải tác động của agent · không phải khuyến nghị giao dịch chứng khoán</span>
    </div>
    <div class="mt-3.5 pt-3.5 border-t border-white/15 text-[11px] text-[#9FB2CC] leading-[2]">Nguồn: ${nguon}</div>
  </div>
</footer>`;
  return khungTrang(`${d.tieu_de} — Bản tin ${n.cham}`, than);
}

function trangIndex(ds) {
  const cards = ds
    .map((d) => {
      const n = ngayVN(d.ngay);
      const [y, m, day] = d.ngay.split("-");
      const vni = d.chi_so[0] || {};
      const h = HUONG[vni.huong];
      return `<a class="flex gap-[22px] bg-white border border-[#DDE3EC] rounded-[10px] px-[26px] py-[22px] mb-3.5 items-center no-underline hover:border-[#1E6FD9] max-md:flex-wrap" href="${d.ngay}.html">
    <div class="shrink-0 text-center border-r border-[#E4E9F0] pr-[22px]"><div class="text-[34px] font-extrabold text-[#122B4D] leading-none">${day}</div><div class="text-[11px] font-bold tracking-[0.1em] text-[#5B6B80] uppercase mt-1">Th${Number(m)} · ${y}</div></div>
    <div class="flex-1 min-w-[200px]"><h3 class="text-xl font-extrabold text-[#122B4D] mb-1">${esc(d.tieu_de)}</h3><div class="text-[13px] text-[#5B6B80] line-clamp-2">${esc(d.dan_de)}</div></div>
    <div class="shrink-0 text-right"><div class="text-[10px] tracking-[0.12em] uppercase text-[#5B6B80] font-bold">${esc(vni.ten || "")}</div><div class="text-xl font-extrabold" style="color:${h ? h.mau : "#122B4D"}">${esc(vni.gia_tri || "")}</div></div>
  </a>`;
    })
    .join("");
  const than = `
${topbar("Lưu trữ bản tin", `<b>${ds.length} bản tin</b><br>Cập nhật mỗi sáng trước giờ giao dịch`)}
<main class="py-[30px]"><div class="${CL.khung}">${cards}</div></main>
<footer class="bg-[#122B4D] text-white mt-3.5">
  <div class="${CL.khung} py-[22px]">
    <div class="flex justify-between gap-4 flex-wrap items-center">
      <span class="font-extrabold tracking-[0.12em] uppercase text-[13px]">Bản tin TTCK Việt Nam</span>
      <span class="text-[11px] text-[#9FB2CC] italic">Tài liệu tham khảo tổng hợp tự động · không phải khuyến nghị giao dịch chứng khoán</span>
    </div>
  </div>
</footer>`;
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
