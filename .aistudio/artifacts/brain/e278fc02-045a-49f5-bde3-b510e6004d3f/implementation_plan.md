# Trung tâm Thí điểm Adblock Nhật Bản & Úc (VnExpress OV Pilot Command Center)

Tái cấu trúc giao diện và trải nghiệm VnExpress OV Adblock Control Tower theo triết lý "Goal-First Glanceability": người dùng mở dashboard là lập tức nắm bắt được tiến độ mục tiêu thí điểm tại 2 thị trường trọng điểm (Nhật Bản & Úc), phân tích chi tiết quy luật theo ngày, bảng thống kê các thứ trong tuần (Thứ 2 - CN), xu hướng theo tháng và tùy biến mục tiêu động trực tiếp trên giao diện thương mại.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Dựa trên phản hồi trong bước khảo sát tương tác:
> 1. **Chế độ mặc định**: Thiết lập **Tab Thí điểm Nhật & Úc chuyên sâu** làm màn hình trung tâm ngay khi truy cập, giảm tải triệt để các bảng số liệu phức tạp không cần thiết ở màn hình ngoài.
> 2. **Quy luật thứ trong tuần**: Cung cấp **Bảng số liệu tổng hợp chi tiết theo từng thứ (Thứ 2 đến Chủ Nhật)** thể hiện lưu lượng, tỷ lệ chặn, so sánh chênh lệch giữa ngày làm việc (Weekdays) và ngày cuối tuần (Weekends).
> 3. **Tùy biến mục tiêu động**: Tích hợp thanh điều khiển mục tiêu trực quan (Target Slider & Quick Presets: Baseline, Giảm 10%, Giảm 15%, hoặc Nhập chỉ số tùy chọn) tính toán lại toàn bộ mức độ đạt mục tiêu, chênh lệch (gap) và dự phóng doanh thu khả dụng theo thời gian thực.

---

## 1. Overview & Core Concept

- **What It Does**: Hệ thống quản trị và điều phối mục tiêu Adblock chuyên dụng cho VnExpress OV, tập trung vào chiến dịch thí điểm tại **Nhật Bản (Phase 1 Pilot)** và **Úc (Phase 2 Expansion)**. Biến các bảng dữ liệu thô phức tạp thành các thẻ mục tiêu rõ ràng, biểu đồ tiến độ ngày có đường mục tiêu (Target Line), bảng phân tích thứ trong tuần sắc sảo và bộ so sánh đối đầu (Japan vs Australia vs Toàn cầu).
- **Target Audience / Persona**: Ban Lãnh đạo Khối Công nghệ/Kinh doanh Quốc tế, Product Owner AdTech, Trưởng nhóm Vận hành Quảng cáo và Quản lý Thị trường Hải ngoại của VnExpress.
- **Key Value**: 
  - **"Nhìn phát thấy mục tiêu"**: Xác định tức thì trong 3 giây xem thị trường đang Thắng (Đạt chỉ tiêu giảm block), Cần chú ý hay Vượt ngưỡng nguy cơ.
  - **Quy luật hành vi người dùng**: Hiểu rõ biến động chặn quảng cáo giữa các ngày làm việc (văn phòng/desktop) và thứ Bảy/Chủ Nhật (di động/giải trí).
  - **Mô phỏng tác động kinh doanh**: Thay đổi mục tiêu giảm chặn trên thanh trượt để thấy ngay lượng Pageviews quảng cáo thu hồi thêm (Can Run Ads PV) và giá trị thương mại hóa.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Executive Glance (Lướt 3 giây đầu tiên)**:
   - Header hiển thị Badge trạng thái chiến dịch: Trạng thái kiểm soát tại Tokyo & Sydney.
   - Thẻ kép Mục tiêu Thí điểm (Pilot Scorecard): Thể hiện đồng thời Nhật Bản & Úc với thanh tiến độ Mục tiêu (Block Rate hiện tại vs Mục tiêu 10% vs Mục tiêu 15%), chênh lệch điểm phần trăm (+/- pp) và nhãn trạng thái sinh động.
2. **Dynamic Target Tuner (Thanh tinh chỉnh mục tiêu động)**:
   - Bộ điều khiển linh hoạt cho phép người dùng click nhanh các mức mục tiêu: `Baseline`, `Mục tiêu -10%`, `Mục tiêu -15%`, hoặc nhập con số mong muốn (vd: `13.00%`).
   - Hệ thống lập tức cập nhật lại số PV cần kéo về, độ lệch thực tế và đánh giá khả thi.
3. **Phân tích Đa chiều (Theo Ngày & Thứ trong tuần)**:
   - **Bảng phân tích Thứ trong tuần (T2 -> CN)**: Bảng chuẩn số liệu chỉn chu với cột Thứ, Trung bình PV/ngày, Trung bình Block PV, Tỷ lệ Block %, So sánh với mức Trung bình tuần và So sánh với Mục tiêu thí điểm. Phân tách rõ nhóm Weekday (T2-T6) vs Weekend (T7-CN).
   - **Biểu đồ Ngày (Daily Trendline)**: Biểu đồ kết hợp đường xu hướng thực tế và dải băng mục tiêu (Target Band) kèm tooltip hiển thị rõ ngày nào đạt, ngày nào vượt ngưỡng.
4. **So sánh Đối đầu & Toàn cầu (Head-to-Head Comparison)**:
   - Bảng so sánh trực diện: Nhật Bản vs Úc vs Toàn cầu OV về mọi chỉ số: Tổng PV, Tỷ trọng đóng góp, Tỷ lệ chặn, Độ biến động (Stability), và Tiềm năng thu hồi quảng cáo.
5. **Chế độ Xem Toàn diện (Full OV Dashboard Switch)**:
   - Nút chuyển đổi mượt mà giữa "Chế độ Thí điểm Nhật & Úc" và "Trung tâm Điều khiển Toàn cầu OV" cho các tác vụ kiểm toán chuyên sâu, Pareto thư mục và chất lượng dữ liệu.

### Visual Identity & Theme
- **Phong cách thẩm mỹ**: Enterprise Dark Command Center kết hợp Fintech Precision. Không dùng dải màu tím giả lập AI hay card lồng nhau viền dày.
- **Bảng màu (60-30-10 Rule)**:
  - Nền canvas (60%): `#090D16` và `#0F172A` (Dark slate thanh lịch, dịu mắt, tương phản cao).
  - Khối cấu trúc & thẻ (30%): `#131C31` với viền tóc mảnh tinh tế `rgba(255, 255, 255, 0.08)`.
  - Màu điểm nhấn hành động & mục tiêu (10%):
    - Đạt chuẩn / Tốt: `#10B981` (Emerald).
    - Cảnh báo / Tiếp cận: `#F59E0B` (Amber).
    - Vượt ngưỡng / Cần can thiệp: `#EF4444` (Rose/Crimson).
    - Điểm nhấn điều hướng / Nhật Bản / Úc: `#3B82F6` (Electric Blue) & `#8B5CF6` (Indigo Violet).
- **Kiểu chữ & Số liệu**:
  - Tiêu đề & Nhãn: `Plus Jakarta Sans` sắc nét, rõ ràng, phân cấp thị giác mạch lạc.
  - Số liệu & Bảng biểu: Bắt buộc dùng `tabular-nums` hoặc font Monospace đồng nhất cho mọi tỷ lệ phần trăm và lượng PV, không bị giật layout.

---

## 3. Key Product Decisions & Trade-Offs

- **Quyết định 1: Tách biệt rõ ràng chế độ Thí điểm (Pilot Focus) và Chế độ Chuyên sâu (Full OV)**
  - *Lý do*: Đáp ứng chính xác nhận xét của người dùng: "Dash nhiều số liệu hơi khó theo dõi". Mặc định mở ra chỉ tập trung vào câu hỏi cốt lõi: Nhật Bản và Úc đang chạy thế nào so với mục tiêu. Người dùng cần tra cứu sâu vẫn có nút mở toàn bộ bảng chỉ tiêu chuyên mục và kiểm toán.
- **Quyết định 2: Bảng phân tích Thứ trong tuần chuyên sâu thay vì ma trận heatmap màu mè**
  - *Lý do*: Theo đúng lựa chọn của người dùng trong khảo sát tương tác. Bảng số liệu giúp người vận hành nắm chính xác con số chênh lệch tuyệt đối giữa ngày trong tuần và cuối tuần, phục vụ trực tiếp cho việc lên lịch kích hoạt kịch bản chặn/nhắc nhở độc giả.
- **Quyết định 3: Lưu trữ cấu hình Mục tiêu động trong Local Storage & Tự động tính toán lại tức thì**
  - *Lý do*: Người dùng có thể thử nghiệm nhiều kịch bản (What-if Scenario) cho thị trường Úc và Nhật mà không làm biến dạng dữ liệu gốc đã tải lên.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App State & Filter Engine                       │
│  - Active View: 'pilot' (default) | 'full_overview'                   │
│  - Selected Market: 'Japan' | 'Australia' | 'all'                     │
│  - Selected Month / Time Horizon: MTD, T9, T8, hoặc Toàn kỳ (T1-T9)   │
│  - Dynamic Targets State: { Japan: { targetBlockRate }, Australia: {..} } │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│     Pilot Command Center (Default)   │  │   Control Tower (Full View)  │
│ ┌──────────────────────────────────┐ │  │ ┌──────────────────────────┐ │
│ │ Executive Target Glance Cards    │ │  │ │ Global KPI Overview      │ │
│ │ - Japan: Goal vs Actual (Bar+Gap)│ │  │ │ Category Breakdown (19)  │ │
│ │ - Australia: Goal vs Actual      │ │  │ │ Full Market Matrix       │ │
│ └──────────────────────────────────┘ │  │ │ Data Quality Audit       │ │
│ ┌──────────────────────────────────┐ │  │ └──────────────────────────┘ │
│ │ Interactive Target Customizer    │ │  └──────────────────────────────┘
│ │ Slider / Presets / What-If Calcs │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Day-of-Week Analytical Grid      │ │
│ │ (T2 - CN: PV, Block%, Gap, Ratio)│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Daily Target vs Actual Trendline │ │
│ │ (Daily points with Target Band)  │ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ Head-to-Head: JP vs AU vs Global │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Triển khai Dữ liệu Thị trường Úc (Australia)
- Trích xuất tự động và đồng bộ bộ số liệu Úc từ bộ dữ liệu chuẩn (`RAW_COUNTRY_DATA` và CSV tải lên):
  - Baseline Block Rate của Úc: ~15.03% (tính trên ~28.6 triệu PVs lịch sử).
  - Mục tiêu giảm 10%: Block Rate $\le 13.53\%$.
  - Mục tiêu giảm 15%: Block Rate $\le 12.78\%$.
  - Cho phép tùy chỉnh mục tiêu trực tiếp trên giao diện từ 5.0% đến 25.0%.

---

## 5. Verification & Testing Plan

Trước khi bàn giao, thực hiện quy trình tự kiểm định như người dùng thực tế:
1. **Kiểm tra hiển thị mặc định**: Đảm bảo mở trang là vào ngay Tab Thí điểm Nhật & Úc với thiết kế gọn gàng, trực quan.
2. **Kiểm tra tính đúng đắn toán học**: Tỷ lệ Block Rate + Can Run Ads Rate luôn = 100.00%; chênh lệch mục tiêu tính đúng từng điểm phần trăm (pp).
3. **Kiểm tra bảng thứ trong tuần (T2 - CN)**: Kiểm tra phân nhóm ngày trong tuần và cuối tuần với số liệu thực từ dữ liệu ngày.
4. **Kiểm tra thanh tinh chỉnh mục tiêu động**: Kéo trượt hoặc chọn preset thay đổi ngay lập tức trạng thái Đạt/Không đạt và số PV tương ứng.
5. **Kiểm tra tính tương thích tải file CSV**: Đảm bảo tải file CSV mới vẫn tự động cập nhật ngay trên màn hình Thí điểm này mà không bị reset về 0%.
6. **Báo cáo trung thực**: Liệt kê rõ những hạng mục đã kiểm thử thành công và những giới hạn kỹ thuật môi trường (nếu có).
