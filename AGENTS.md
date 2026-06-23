## Bắt buộc: kiểm tra môi trường trước khi chạy

Trước khi chạy bất kỳ pipeline vận hành nào, agent phải kiểm tra môi trường.
Chỉ được chạy tiếp khi **PowerShell 7** và **Python absolute path** đều OK.

Không được chạy pipeline bằng:

```powershell
python file_name.py
py run_this_file.py
```

Phải tìm absolute path của `python.exe` và dùng absolute path đó để chạy script.

### 1. Kiểm tra PowerShell 7

Tìm `pwsh.exe`:

```powershell
Get-Command pwsh -ErrorAction Stop
```

Kiểm tra version bằng PowerShell 7:

```powershell
pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'
```

Yêu cầu:

- Major version phải là `7` trở lên.
- Nếu chỉ có Windows PowerShell 5.1, dừng lại và báo Sếp. Không chạy pipeline.

### 2. Kiểm tra Python absolute path

Chạy trong PowerShell 7:

```powershell
pwsh -NoProfile -Command '(Get-Command python -ErrorAction Stop).Source'
```

Kết quả phải là đường dẫn tuyệt đối tới `python.exe`, ví dụ:

```text
C:\Users\ADMIN\AppData\Local\Programs\Python\Python311\python.exe
```

Nếu không tìm thấy Python hoặc path không trỏ tới `python.exe`, dừng lại và báo Sếp.

### 3. Chạy pipeline của dự án này bằng PowerShell 7 + absolute path

Dự án này (`F:\Hai BUi\Agent tổng hợp tin tức`) render web bằng **Node** (`render.js`); **Python** dùng cho server preview và script dữ liệu (giai đoạn 2 — vnstock). Luôn dùng absolute path, không gọi `python`/`py`/`node` trần.

Render web (bước render trong pipeline hằng ngày):

```powershell
pwsh -NoProfile -Command 'node "F:\Hai BUi\Agent tổng hợp tin tức\render.js"'
```

Chạy script Python (server preview / script dữ liệu) bằng absolute path tìm được ở bước 2:

```powershell
pwsh -NoProfile -Command '$python = (Get-Command python -ErrorAction Stop).Source; & $python -m http.server 8736 --directory "F:\Hai BUi\Agent tổng hợp tin tức\docs"'
```

Khi giai đoạn 2 có script dữ liệu Python (ví dụ `lay_du_lieu.py`):

```powershell
pwsh -NoProfile -Command '$python = (Get-Command python -ErrorAction Stop).Source; & $python "F:\Hai BUi\Agent tổng hợp tin tức\lay_du_lieu.py"'
```

Nếu PowerShell 7 hoặc Python không OK, không được chạy tiếp — dừng lại và báo Sếp.

# Agent Bản Tin TTCK Việt Nam — Quy trình thực thi

> Vai trò: agent phân tích kiểu phòng tự doanh, làm **BẢN TIN SÁNG** trước giờ giao dịch cho thị trường chứng khoán Việt Nam (HOSE/HNX/UPCoM). Đọc thêm `CLAUDE.md` (chi tiết schema, phân loại) và `nguon-rss.md` (danh sách RSS đã xác thực) trước khi chạy. Sản phẩm mỗi ngày: `du-lieu/YYYY-MM-DD.json` → `bao-cao/YYYY-MM-DD.md` → render web `docs/` → push GitHub Pages.

## ⛔ Giao thức chống tin cũ (BẮT BUỘC — lỗi nghiêm trọng nhất là trộn tin cũ thành tin mới)
1. **`Get-Date` đầu tiên** để biết ngày giờ hệ thống. Bản tin LUÔN đề ngày hôm nay; KHÔNG viết sự kiện chưa xảy ra (chưa đến sáng X thì không có "châu Á sáng X").
2. **Chỉ dùng tin có `pubDate` trong 24h.** RSS có `pubDate` chính xác — đó là lý do dùng RSS thay WebSearch. Tin cũ hơn chỉ làm bối cảnh và phải ghi ngày rõ trong câu ("hôm 08/06…").
3. **KHÔNG dùng WebSearch để lấy tin.** WebSearch chỉ là dự phòng cuối khi feed chết; khi đó phải xác định ngày đăng từng bài trước khi dùng (đọc ngày trong URL: CafeF `-188YYMMDD`, Vietstock `/YYYY/MM/`; không xác định được ngày = không dùng) và query luôn kèm ngày hôm nay.
4. **Giá/chỉ số/tỷ giá KHÔNG lấy từ RSS hay search** — WebFetch trang live (Yahoo Finance, oilprice.com, tradingeconomics.com).
5. **Sanity check tin vs giá**: tin sốc cung/cầu phải nhất quán với giá live; mâu thuẫn (vd "Hormuz đóng cửa" nhưng Brent live $83) = tin cũ/sai → loại.
6. **Tự kiểm cuối**: rà từng item trong JSON — "nguồn này đăng ngày nào, có chắc ≤24h không?"; có ký tự lạ (chữ Hán…) không? Không đạt → xóa item.

## ⚙️ Vận hành (sau 2 lần chạy nền chết giữa chừng vì hết hạn mức)
- Tối đa **~12 lượt WebFetch** mỗi lần chạy. Nguồn nào lỗi/chậm → bỏ qua, ghi "chưa cập nhật", KHÔNG retry quá 1 lần.
- **Ghi sớm**: ngay sau khi đủ dữ liệu lõi (bước 2–3 bên dưới), GHI JSON + render + commit/push LUÔN. Không trì hoãn để gom thêm tin.

## Trình tự thực hiện
1. **`Get-Date`** lấy ngày giờ. Xác định `phien` = phiên giao dịch gần nhất ĐÃ đóng cửa (sáng thứ Hai thì phiên gần nhất là thứ Sáu).
2. **Thu thập lõi — 6 lượt RSS** (WebFetch):
   - Vietstock cổ phiếu `https://vietstock.vn/830/chung-khoan/co-phieu.rss` → lấy link 3 bài: "Theo dấu dòng tiền cá mập [hôm qua]" (số **tự doanh + khối ngoại**), "Nhịp đập Thị trường [hôm qua]" (VN-Index, thanh khoản, độ rộng), "[hôm nay]: Đọc gì trước giờ giao dịch".
   - WebFetch bài "Đọc gì trước giờ giao dịch" hôm nay (tổng hợp trong nước + quốc tế + vĩ mô).
   - WebFetch bài "cá mập" hôm qua (số tự doanh/khối ngoại cụ thể).
   - WSJ Markets `https://feeds.content.dowjones.io/public/rss/RSSMarketsMain` (phiên Mỹ đêm qua + lý do, Fed, địa chính trị).
   - OilPrice `https://oilprice.com/rss/main` (dầu, Trung Đông/Hormuz, năng lượng).
   - VnEconomy `https://vneconomy.vn/chung-khoan.rss` (thanh khoản, khối ngoại, nhận định, vĩ mô VN).
3. **Giá live — 3 lượt Yahoo Finance**: `^GSPC` (S&P close), `BZ=F` (Brent), `^N225` (Nikkei). Dow/Nasdaq/vàng/BTC lấy số từ tin trong feed.
4. **Tùy chọn** (chỉ khi bước 2–3 trơn, ≤3 lượt): Vietstock giao dịch nội bộ `https://vietstock.vn/739/chung-khoan/giao-dich-noi-bo.rss` (cho §06); Vietstock vĩ mô `https://vietstock.vn/761/kinh-te/vi-mo.rss`; 1 bài gốc cần đào sâu.
5. **Ghi `du-lieu/YYYY-MM-DD.json`** — mở file JSON gần nhất trong `du-lieu/` để theo ĐÚNG schema (xem mục dưới).
6. **Viết `bao-cao/YYYY-MM-DD.md`** theo format trong `CLAUDE.md` (tóm tắt nhanh → diễn biến → tin theo nhóm → đánh giá desk).
7. **Render + Deploy**:
   ```powershell
   node "F:\Hai BUi\Agent tổng hợp tin tức\render.js"
   $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
   git add -A; git commit -m "Ban tin YYYY-MM-DD ..."; git push
   ```
   GitHub Pages: https://bumiha90.github.io/ban-tin-ttck/ (tự cập nhật ~1 phút). Push lỗi → ghi rõ, không retry quá 2 lần.

## Schema JSON (8 mục §01–§08)
`{ ngay, phien, tieu_de, dan_de, chi_so[], muc[], quote, danh_gia, nguon[] }`
- **`chi_so[]`** (6 ô dashboard): VN-Index, thanh khoản HOSE, tự doanh, khối ngoại, S&P 500, Brent. Mỗi ô `{ten, gia_tri, phu, huong: tang|giam|canh_bao, ghi_chu}`. Số thiếu → ghi "chưa cập nhật", KHÔNG bịa.
- **`muc[]`** mỗi mục `{so, ten, loai, ghi_chu?, rong?, items[]}`:
  - **§01 Qua đêm — toàn cầu** (`loai:"quoc_te"`, `rong:true`): mỗi item `{ten, gia_tri, thay_doi, huong, y_nghia}` — `y_nghia` 1 câu tác động VN kèm mã/nhóm ngành (dầu→GAS PVD PVS BSR; HRC→HPG HSG; lợi suất Mỹ→định giá/dòng vốn EM).
  - **§02 Địa chính trị & rủi ro toàn cầu** (`loai:"diem"`): `{text, tone, y_nghia}` — chiến sự/Hormuz, thuế Điều 301 với VN (điều trần 07/07), Fed/ECB/BoJ.
  - **§03 Dòng tiền & vị thế** (`loai:"bang"`): `{chi_tieu, gia_tri, tone, y_nghia}` — ETF (VNM cơ cấu 19/06), lãi suất huy động, vàng SJC, margin.
  - **§04 Trong nước — tín hiệu thị trường** (`loai:"diem"`): `{text, tone}` — diễn biến phiên, nhóm kéo/đè, biến động bất thường (tin đồn ghi "chưa kiểm chứng").
  - **§05 Vĩ mô & tiền tệ** (`loai:"bang"`): lãi LNH, OMO, tỷ giá, CPI, số liệu định kỳ.
  - **§06 Doanh nghiệp & giao dịch nội bộ** (`loai:"ma"`): `{ma, tone, text, y_nghia}` — `y_nghia` theo công thức **ai chịu tác động + chiều + khung thời gian**.
  - **§07 Lịch sự kiện** (`loai:"lich"`): `{khi, pham_vi: "VN"|"QT", tone, su_kien}` — suy từ quy tắc định kỳ ghi "(dự kiến)".
  - **§08 Góc nhìn & chiến lược** (`loai:"muc_gia"`): `{nhan, tone, text}` — levels/kịch bản, ghi rõ là nhận định CTCK.
- **`danh_gia`**: 3–4 câu Đánh giá của desk theo khung **bài phe bull / phe bear / biến số 24h**. `quote` là fallback.
- **`nguon[]`**: `{ten, url}` — tên KÈM NGÀY ĐĂNG ("Vietstock 12/06 — …"). Mọi tin phải có nguồn.
- `tone` nhận: `tot | xau | canh_bao | trung_tinh | info`. `rong:true` cho mục chiếm cả 2 cột.

### ⚠️ Quy tắc NGẮN GỌN ô số (tránh vỡ layout — lỗi bản tin 23/06)
- **`gia_tri` (trong `chi_so` và bảng §03/§05) phải là SỐ + đơn vị ngắn**, ~≤25 ký tự. Chỉ một con số chính; nhiều chỉ tiêu thì dùng dấu `·` ("18,25% · 5,86% · 10,76%"). KHÔNG nhét cả câu, KHÔNG trích nguồn kép ("Vietstock ghi… VnEconomy ghi…") vào ô giá trị.
- **`ghi_chu` của `chi_so` ≤ ~40 ký tự** — gợi ý ngắn ("phiên 22/06 · +33,38 điểm"), KHÔNG phải câu trích nguồn dài.
- Mọi **diễn giải, đối chiếu nguồn, con số phụ** để trong `y_nghia` (bảng) hoặc đưa xuống `bao-cao/*.md` — KHÔNG đưa vào ô giá trị.
- §03/§05 là **bảng chỉ tiêu : số**; một mẩu tin (vd "hoàn thành đúng hạn các quy hoạch…") KHÔNG phải chỉ tiêu — đừng nhét vào bảng, để ở §04/§06 dạng `text`.

## Ranh giới phân tích (áp dụng mọi `y_nghia` và `danh_gia`)
- ✅ Được: "tin X tạo áp lực lên nhóm Y trong khung Z", "nếu A thì kịch bản B".
- ❌ Cấm: khuyên mua/bán/nắm giữ, mục tiêu giá riêng của agent, "nên/không nên" hành động.
- Mỗi `y_nghia` tối đa 1 câu. Phân biệt rõ **fact** (sự kiện) và **nhận định** (opinion CTCK). Không bịa số liệu.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ban-tin-ttck** (112 symbols, 150 relationships, 2 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ban-tin-ttck/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ban-tin-ttck/clusters` | All functional areas |
| `gitnexus://repo/ban-tin-ttck/processes` | All execution flows |
| `gitnexus://repo/ban-tin-ttck/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->