---
name: Ban tin TTCK — Editorial Daily
reference-implementation:
  - https://bumiha90.github.io/ban-tin-ttck/ (bản tin hằng ngày — mẫu gốc)
  - https://bumiha90.github.io/tam-ly-ttck/ (báo cáo tâm lý — đã nhân bản đúng mẫu)
colors:
  background: '#EDF0F5'
  surface: '#ffffff'
  on-surface: '#122B4D'
  on-surface-variant: '#44546A'
  body-text: '#2C3E55'
  muted: '#5B6B80'
  muted-light: '#8593A6'
  outline: '#DDE3EC'
  outline-dashed: '#E4E9F0'
  primary: '#1E6FD9'
  primary-dark: '#0F4187'
  primary-container: '#E7F0FC'
  gain: '#178A50'
  gain-dark: '#0C5631'
  gain-container: '#E3F4EB'
  loss: '#D6453D'
  loss-dark: '#8C231D'
  loss-container: '#FBEAE9'
  neutral-warn: '#B97A0F'
  neutral-warn-dark: '#7A4E05'
  neutral-warn-container: '#FAF0DC'
  gray-chip-bg: '#EDF1F6'
  gray-chip-fg: '#2C3E55'
  footer-bg: '#122B4D'
  footer-text: '#9FB2CC'
  footer-link: '#8FBCF2'
typography:
  font-family: "'Be Vietnam Pro', system-ui, sans-serif"
  google-fonts: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap"
  hero-h1: { fontSize: 42-46px, fontWeight: '800', lineHeight: 1.08, letterSpacing: '-0.01em', mobile: 32-34px }
  section-h2: { fontSize: 19px, fontWeight: '800' }
  card-number: { fontSize: 25px, fontWeight: '800', letterSpacing: '-0.01em' }
  body: { fontSize: 13.5px, lineHeight: 1.6 }
  label-uppercase: { fontSize: 10-11px, fontWeight: '700', letterSpacing: '.13em', textTransform: uppercase }
  note-italic: { fontSize: 12px, fontStyle: italic, color: '#0F4187' }
number-format: kiểu Việt Nam — 1.798,61 · +0,59% (chấm nghìn, phẩy thập phân)
spacing:
  container-max: 1100px
  container-padding: 20px
  card-radius: 8-10px
  card-border: 1px solid #DDE3EC
  content-grid: 2 cột, gap 18px; khối rộng span cả 2 cột (class `rong`)
  row-divider: 1px dashed #E4E9F0
  mobile-breakpoint: 760px (về 1 cột)
---

# Design chuẩn cho MỌI báo cáo — nhân bản template "Bản tin TTCK"

> **Quy tắc số 1: COPY, KHÔNG DIỄN GIẢI.** File này mô tả đúng template đang chạy
> tại https://bumiha90.github.io/ban-tin-ttck/ . Khi làm báo cáo mới, lấy CSS ở
> Appendix cuối file (hoặc view-source trang mẫu) làm khung, chỉ thay nội dung.
> Đã có tiền lệ: một bản "diễn giải lại" spec trừu tượng bị user loại bỏ ngay
> trong ngày. Mọi báo cáo HTML của tất cả các agent dùng CHUNG một mẫu này.

## Brand & Style

Bản tin tài chính hằng ngày cho TTCK Việt Nam: hiện đại, gọn, mật độ thông tin
cao nhưng dễ quét mắt. Nền xám xanh nhạt `#EDF0F5`, nội dung đặt trong các thẻ
trắng bo góc 8–10px viền mảnh `#DDE3EC`. Màu chữ chủ đạo navy `#122B4D`, nhấn
xanh dương `#1E6FD9`. Một font duy nhất: **Be Vietnam Pro** — đậm 800 cho tiêu
đề/số liệu, 400–600 cho nội dung. Không serif, không nền tối, không teal.

## Ngữ nghĩa màu (bắt buộc thống nhất)

- **Tăng / tích cực:** chữ `#178A50` (đậm: `#0C5631`), chip nền `#E3F4EB`. Ký hiệu `▲`.
- **Giảm / tiêu cực:** chữ `#D6453D` (đậm: `#8C231D`), chip nền `#FBEAE9`. Ký hiệu `▼`.
- **Trung tính / cảnh báo / chờ xác nhận:** chữ `#B97A0F` (đậm: `#7A4E05`), chip nền `#FAF0DC`. Ký hiệu `●`.
- **Thông tin / accent / link:** `#1E6FD9` (đậm: `#0F4187`), chip nền `#E7F0FC`.
- **Phụ chú xám:** chip `#EDF1F6` / chữ `#2C3E55`; nhãn mờ `#5B6B80`.
- Số liệu hiển thị **định dạng Việt Nam**: `1.798,61`, `+0,59%`, `−504 tỷ`.

## Cấu trúc trang (theo thứ tự, dùng đúng tên class)

1. **`.topbar`** — nền trắng, viền dưới `3px solid #122B4D`. Trái: `.brand` gồm
   logo tròn 30px navy chữ trắng + tên brand uppercase 12px + dòng phụ xanh
   uppercase 10px. Giữa: `.tieude-bar` "— Tiêu đề loại báo cáo —" (ẩn trên
   mobile). Phải: `.meta-bar` thứ + ngày `THỨ NĂM · 11.06.2026` đậm, kèm link
   điều hướng (vd "tất cả bản tin").
2. **`.hero`** — nền trắng, grid 2 cột (1fr | 2fr). Trái: `.badge-ngay` (chip
   viền xanh uppercase) + `h1` 42–46px/800 (có thể kèm hình minh họa/gauge).
   Phải: `.diem-nhan` 20–21px/700 với `<span class="xanh">` nhấn xanh +
   `.dande` đoạn dẫn in nghiêng `#44546A`.
3. **`.metrics`** — dải thẻ số liệu, grid `auto-fit minmax(152px,1fr)`. Mỗi
   `.mcard`: `.nhan` (nhãn uppercase 10px mờ) → `.so` (số 25px/800 navy) →
   `.phu` (dòng phụ 13px/700 CÓ MÀU ngữ nghĩa + ký hiệu ▲▼●) → `.chu` (ghi chú
   nghiêng 11px, viền trái 3px `#DDE3EC`).
4. **`main.noidung`** — grid 2 cột gap 18px. Mỗi khối là `section.sec` (thẻ
   trắng): `.dau` chứa `.so-sec` "§ 01" (13px/800 xanh) + `h2` 19px/800;
   `.ghichu-sec` chú thích nghiêng 11px nếu cần. Khối quan trọng span cả hàng
   bằng class `sec rong`. Nội dung trong section dùng các pattern:
   - `.diem-item` + `.cham` — gạch đầu dòng có chấm tròn 8px màu ngữ nghĩa,
     phân dòng bằng gạch đứt.
   - `.bang-item` > `.bang-dong` (`.ct` tên xám | `.gt` giá trị 800 có màu) —
     hàng chỉ tiêu/giá trị.
   - `.qt-ynghia` — dòng diễn giải "→ ..." nghiêng 12px `#0F4187` dưới mỗi mục
     (chữ ký của hệ: fact ở trên, tác động ở dưới).
   - `.ma-item` + `.ma-chip` — dòng có chip mã/điểm màu nhạt đứng trước.
   - `.mucgia` — mốc giá: nhãn số đậm trong ô màu nhạt viền trái 4px + mô tả.
   - `.lich-item` + `.lich-khi`/`.lich-pv` — lịch sự kiện: chip thời gian màu
     theo mức độ + chip phạm vi (VN/QT).
   - Bảng số liệu: `th` uppercase 10px mờ viền liền, `td` 600 viền đứt, căn
     phải trừ cột đầu.
5. **`.quote`** — khối "Đánh giá của desk": hộp `#E7F0FC` bo 10px, dấu nháy `"`
   52px xanh font Georgia, `.dg-tieude` uppercase xanh, đoạn nhận định nghiêng
   16.5px `#0F4187`, ký tên `.ai` uppercase "— Agent ... · ngày · không phải
   khuyến nghị".
6. **`footer.chantrang`** — nền navy `#122B4D` chữ trắng: hàng brand uppercase +
   mô tả nghiêng `#9FB2CC`; khối `.nguon` liệt kê nguồn dữ liệu (link
   `#8FBCF2`) ngăn cách bằng ` · `, viền trên `rgba(255,255,255,.15)`.
7. **Trang danh sách/lưu trữ** — dùng `.card-ngay`: ô ngày trái (`.o-ngay` số
   ngày 34px/800 + tháng.năm uppercase), giữa là `h3` 20px/800 + `.tom` tóm tắt
   xám, phải là `.chip-vni` (số 800 có màu + nhãn uppercase). Hover viền xanh.

## Elevation & Shape

Không đổ bóng. Phân tầng bằng: nền xám xanh ↔ thẻ trắng viền 1px ↔ chip màu
container nhạt. Bo góc 8–10px cho thẻ, 4–5px cho chip, tròn 50% cho logo/chấm.
Phân dòng trong thẻ bằng gạch đứt 1px `#E4E9F0` — không dùng margin trống.

## Quy tắc bắt buộc khi sinh báo cáo mới

1. Nhúng đúng Google Fonts link trong frontmatter; fallback `system-ui, sans-serif`.
2. `<meta name="viewport" content="width=device-width,initial-scale=1">` + media query 760px về 1 cột.
3. Mọi số hiển thị theo định dạng Việt; mọi giá trị tăng/giảm phải kèm màu + ký hiệu ▲▼● đúng ngữ nghĩa. Tuyệt đối không dùng teal/cyan (nhầm màu giá sàn).
4. Mỗi trang phải đủ: topbar (kèm link điều hướng giữa các báo cáo) → hero → nội dung → footer navy ghi nguồn + disclaimer "không phải khuyến nghị".
5. Dòng diễn giải tác động luôn theo pattern `→ ...` bằng `.qt-ynghia`.
6. Giữ nguyên tên class trong file này để các báo cáo có thể đối chiếu/kế thừa CSS của nhau.
7. File tự chứa 1 trang HTML duy nhất (CSS inline trong `<style>`), không phụ thuộc JS.

## Appendix — CSS core (copy nguyên khối làm khung)

```css
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
.sec.rong{grid-column:1/-1}
.diem-item{display:flex;gap:11px;padding:9px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#2C3E55}
.diem-item:last-child{border-bottom:none}
.diem-item .cham{flex:none;width:8px;height:8px;border-radius:50%;margin-top:7px}
.bang-item{padding:8px 0;border-bottom:1px dashed #E4E9F0}
.bang-item:last-child{border-bottom:none}
.bang-dong{display:flex;justify-content:space-between;gap:14px;font-size:13.5px}
.bang-dong .ct{color:#44546A}
.bang-dong .gt{font-weight:800;white-space:nowrap;text-align:right}
.qt-ynghia{margin-top:2px;font-size:12px;color:#0F4187;font-style:italic;line-height:1.5}
.ma-item{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#2C3E55}
.ma-item:last-child{border-bottom:none}
.ma-chip{flex:none;font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:4px;margin-top:2px;letter-spacing:.04em}
.mucgia{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px dashed #E4E9F0;font-size:13.5px;color:#44546A}
.mucgia:last-child{border-bottom:none}
.mucgia .nhan{flex:none;min-width:64px;text-align:center;font-weight:800;font-size:15px;padding:5px 10px;border-radius:5px;border-left:4px solid}
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
@media(max-width:760px){.hero .khung{grid-template-columns:1fr;gap:18px}.hero h1{font-size:34px}.noidung .khung{grid-template-columns:1fr}.tieude-bar{display:none}.card-ngay{flex-wrap:wrap}}
```
