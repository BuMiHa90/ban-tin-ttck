# Danh sách RSS feed chuẩn — nguồn tin chính của bản tin

> Xác thực lần đầu: 2026-06-10 tối (kiểm tra pubDate từng feed). Quy tắc dùng: **chỉ lấy item có pubDate trong 24h**; feed nào 2 ngày liền không ra tin mới → đánh dấu nghi hỏng, báo trong bản tin.

## ✅ Đã xác thực — dùng làm nguồn chính

### Quốc tế — thị trường (khối §01)
| Feed | URL | Ghi chú xác thực |
|---|---|---|
| WSJ Markets | https://feeds.content.dowjones.io/public/rss/RSSMarketsMain | Tươi theo giờ; có tin CPI ngay khi công bố (kiểm 10/06) |
| MarketWatch Top Stories | https://feeds.content.dowjones.io/public/rss/mw_topstories | Tươi theo giờ (kiểm 10/06) |
| Vietstock — CK thế giới | https://vietstock.vn/773/the-gioi/chung-khoan-the-gioi.rss | Tiếng Việt, recap phiên Mỹ sáng sớm giờ VN (kiểm 10/06) |

### Hàng hóa / năng lượng (khối §01, §02)
| Feed | URL | Ghi chú xác thực |
|---|---|---|
| OilPrice | https://oilprice.com/rss/main | Tươi theo giờ; dầu + địa chính trị năng lượng/Trung Đông (kiểm 10/06) |

### Châu Á (khối §01)
| Feed | URL | Ghi chú xác thực |
|---|---|---|
| FinanceAsia | https://www.financeasia.com/rss/latest | Nhịp ~ngày làm việc; tin tài chính khu vực, KHÔNG dùng cho số liệu phiên (kiểm 10/06: tin mới nhất hôm trước) |

### Trong nước (khối §03–§06)
| Feed | URL | Ghi chú xác thực |
|---|---|---|
| CafeF trang chủ | https://cafef.vn/home.rss | Tươi theo giờ, cập nhật đến tối (kiểm 10/06 19h48) |
| CafeF TTCK | https://cafef.vn/thi-truong-chung-khoan.rss | Tươi (kiểm 10/06) |
| Vietstock — Cổ phiếu | https://vietstock.vn/830/chung-khoan/co-phieu.rss | Tươi; **có bài "Theo dấu dòng tiền cá mập" hàng ngày = số tự doanh + khối ngoại** (kiểm 10/06) |
| Vietstock — Giao dịch nội bộ | https://vietstock.vn/739/chung-khoan/giao-dich-noi-bo.rss | Tươi; nguồn chính cho §06 giao dịch lãnh đạo/cổ đông lớn (kiểm 10/06) |
| Vietstock — Vĩ mô | https://vietstock.vn/761/kinh-te/vi-mo.rss | Tươi (kiểm 10/06) |
| VnEconomy — Chứng khoán | https://vneconomy.vn/chung-khoan.rss | Tươi (kiểm 10/06) |

## 🟡 Khả dụng — cùng hệ thống đã kiểm, chưa xác thực riêng từng feed
Dùng được khi cần đào sâu chủ đề; vẫn phải kiểm pubDate từng item.

**Vietstock** (gốc `https://vietstock.vn`):
- ETF & các quỹ: `/3358/chung-khoan/etf-va-cac-quy.rss` (cho §03 dòng tiền)
- Phái sinh: `/4186/chung-khoan/chung-khoan-phai-sinh.rss` (basis/OI)
- Trái phiếu: `/785/chung-khoan/thi-truong-trai-phieu.rss` · TPDN: `/3118/doanh-nghiep/trai-phieu-doanh-nghiep.rss`
- Cổ tức: `/738/doanh-nghiep/co-tuc.rss` · KQKD: `/737/doanh-nghiep/hoat-dong-kinh-doanh.rss` · M&A: `/764/doanh-nghiep/tang-von-m-a.rss`
- Vàng & kim loại quý: `/759/hang-hoa/vang-va-kim-loai-quy.rss` (cho SJC §03) · Nhiên liệu: `/34/hang-hoa/nhien-lieu.rss` · Nông sản: `/118/hang-hoa/nong-san-thuc-pham.rss`
- Ngân hàng: `/757/tai-chinh/ngan-hang.rss` (lãi suất huy động) · Tài chính quốc tế: `/772/the-gioi/tai-chinh-quoc-te.rss`
- Nhận định thị trường (CTCK): `/1636/nhan-dinh-phan-tich/nhan-dinh-thi-truong.rss` (cho §08 — nhớ gắn nhãn opinion)

**VnEconomy** (gốc `https://vneconomy.vn`):
- Tin mới: `/tin-moi.rss` · Tài chính: `/tai-chinh.rss` · Thị trường: `/thi-truong.rss`
- Kinh tế thế giới: `/kinh-te-the-gioi.rss` · BĐS: `/dia-oc.rss` · Doanh nghiệp: `/nhip-cau-doanh-nghiep.rss` · Đầu tư: `/dau-tu.rss`

## ❌ Đã loại — lý do
| Nguồn | Lý do loại (kiểm 10/06/2026) |
|---|---|
| NYTimes (nytimes.com/rss + rss.nytimes.com) | Chặn fetch từ môi trường này — không truy cập được |
| MarketWatch Real-time Headlines (`mw_realtimeheadlines`) | Feed bỏ hoang — tin "mới nhất" từ tháng 6/2025 |
| Commodity-TV gold (commodity-tv.com) | 5 ngày không tin mới; nội dung thiên PR công ty khai mỏ, không phải tin thị trường vàng. Thay bằng: giá vàng live (tradingeconomics/yahoo) + Vietstock vàng & kim loại quý |

## Những thứ RSS không thay được (vẫn WebFetch trang live)
- **Giá realtime & chỉ số**: oilprice.com (trang chủ), tradingeconomics.com, finance.yahoo.com, vn.investing.com — RSS là tin, không phải bảng giá.
- **Tỷ giá NHTM/trung tâm, giá vàng SJC**: trang ngân hàng/giá vàng trong nước.
- **Lịch kinh tế**: tradingeconomics.com/calendar, BLS, Fed.
