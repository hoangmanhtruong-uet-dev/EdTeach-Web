# 📑 ĐẶC TẢ PHÂN TẦNG TÍNH NĂNG GÓI DỊCH VỤ (FREE - PRO - MAX) - V2 (CHUẨN XÁC)
**Hệ thống Nền tảng Giáo dục Thông minh EdTeach**  
*Cập nhật kiến trúc phân tầng, Quy hoạch 3 cụm API Key độc lập & Tinh giản tính năng*

---

## 1. TỔNG QUAN CHIẾN LƯỢC SẢN PHẨM & TỐI ƯU CHI PHÍ AI

### 1.1. Chính sách cốt lõi về Chấm bài tự động (OMR Grading)
> [!IMPORTANT]
> **Gói FREE HOÀN TOÀN KHÔNG ĐƯỢC DÙNG TÍNH NĂNG CHẤM BÀI TỰ ĐỘNG** (Quét phiếu qua Camera điện thoại, Webcam máy tính, hay Tải ảnh/PDF chấm hàng loạt).  
> Muốn sử dụng bất kỳ hình thức chấm bài tự động nào bằng AI/OMR, Giáo viên **BẮT BUỘC PHẢI NÂNG CẤP LÊN GÓI PRO HOẶC MAX**.  
> Gói Free chỉ được nhập điểm học sinh bằng tay thủ công (Manual Input).

### 1.2. Tinh giản tính năng (Feature Deprecation)
Để tập trung 100% nguồn lực vào thế mạnh cốt lõi của EdTeach, hệ thống **CHÍNH THỨC LOẠI BỎ** 3 tính năng sau:
1. ❌ **Chấm bài tự luận bằng AI**: Loại bỏ do chữ viết tay của học sinh thực tế rất đa dạng/ẩu, dễ gây ảo giác điểm số (hallucination) dẫn đến tranh cãi khiếu nại điểm; tập trung toàn bộ hạ tầng thị giác máy tính vào chấm trắc nghiệm OMR.
2. ❌ **Gia sư ảo Socratic (AI Tutor)**: Loại bỏ do học sinh có thể chat tự do vô tội vạ gây rò rỉ và cạn kiệt ngân sách token API, trong khi học sinh hiện nay đã có sẵn ChatGPT, Gemini hay Claude miễn phí trên web.
3. ❌ **Gia sư hội thoại khắc phục lỗ hổng kiến thức**: Loại bỏ dạng hội thoại mở. **THAY THẾ BẰNG**: *Gợi ý giải từng bước (Scaffold Generator)* và *Giải toán đa phương pháp (Multi-method Solver)* tĩnh theo từng câu hỏi (chỉ sinh 1 lần theo đề, tiết kiệm token tuyệt đối và là đặc quyền của gói MAX).

### 1.3. Quy hoạch 3 Cụm API Key Độc Lập
Hệ thống phân tách rạch ròi 3 tầng API Key để kiểm soát chi phí và chất lượng dịch vụ:
- `GEMINI_API_KEY_FREE`: Dành riêng cho trải nghiệm tạo đề trắc nghiệm Free (Rate limit 3 lượt/ngày).
- `GEMINI_API_KEY_PRO`: Cụm trả phí cho Giáo viên trường (Tạo đề PRO, Số hóa đề từ URL, Fallback Vision OMR khi cắt góc lỗi).
- `GEMINI_API_KEY_MAX`: Cụm trả phí cao cấp tốc độ cao (AI Thinking, Bóc tách PDF nhân bản đề, Live Clone, Bù lỗ hổng Remediation, Đa phương pháp, Scaffold, Báo cáo AI chuyên sâu).

---

## 2. BẢNG MA TRẬN PHÂN LOẠI TÍNH NĂNG CHUẨN

| Nhóm tính năng | GÓI FREE (Miễn phí) | GÓI GIÁO VIÊN PRO (149k/th) | GÓI LUYỆN THI MAX (229k/th) | Khóa API phụ trách |
| :--- | :--- | :--- | :--- | :--- |
| **Giá niêm yết (Tháng)** | **0đ** / mãi mãi | **149.000đ** / tháng | **229.000đ** / tháng | — |
| **Giá Học kỳ (5 tháng)** | — | **599.000đ** *(~119.8k/tháng)* | **899.000đ** *(~179.8k/tháng)* | — |
| **Ngân sách Credits ví** | Tặng **5.000 Credits** khởi tạo | **+30.000 Credits/tháng** | **+100.000 Credits/tháng** | — |
| **Tạo đề thi trắc nghiệm AI** | Tối đa **3 lượt / ngày** (Flash) | **Không giới hạn** (Chuẩn GDPT) | **Không giới hạn** (Chuẩn GDPT) | `GEMINI_API_KEY_FREE` / `PRO` / `MAX` |
| **AI Suy luận sâu (Thinking)** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **Chế độ Gemini Thinking / DeepSeek R1** | `GEMINI_API_KEY_MAX` |
| **Số hóa đề thi từ URL Web** | ❌ Không hỗ trợ | ✅ **Bóc tách đề từ liên kết web** | ✅ **Bóc tách đề từ liên kết web** | `GEMINI_API_KEY_PRO` |
| **Nhân bản đề từ PDF/Ảnh cũ**| ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **AI OCR bóc tách & đẻ câu tương tự** | `GEMINI_API_KEY_MAX` |
| **Trộn mã đề kiểm tra** | Tối đa **2 mã đề** | Tối đa **4 mã đề** kèm Barem | **Trộn công nghiệp 8 đến 12 mã đề** | Thuật toán nội bộ |
| **Xuất file Word & PDF** | Watermark mờ chân trang | **Sạch 100%** không watermark | **Đóng dấu Logo, SĐT, cơ sở riêng** | Xử lý docx |
| **CHẤM BÀI TỰ ĐỘNG (OMR)** | ❌ **KHÓA TOÀN BỘ**<br>*(Chỉ cho nhập điểm tay)* | ✅ **MỞ KHÓA HOÀN TOÀN**<br>• Không giới hạn số bài<br>• 2 điện thoại cùng lúc | ✅ **MỞ KHÓA HOÀN TOÀN**<br>• Không giới hạn thiết bị<br>• Tự khớp danh sách lớp (Roster) | OpenCV Client/Server |
| **Gemini Vision OMR Fallback** | ❌ Không hỗ trợ | ✅ **Kích hoạt sau 3 lần cắt góc lỗi** | ✅ **Kích hoạt sau 3 lần cắt góc lỗi** | `GEMINI_API_KEY_PRO` |
| **Tạo biến thể câu hỏi (Live Clone)** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **Sinh tức thì câu hỏi tương tự số đẹp** | `GEMINI_API_KEY_MAX` |
| **Dàn ý / Gợi ý giải (Scaffold)** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **Bóc tách gợi ý từng bước cho HS** | `GEMINI_API_KEY_MAX` |
| **Giải toán Đa phương pháp** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | ✅ **Giải đại số, hình học, Casio** | `GEMINI_API_KEY_MAX` |
| **Sinh bài tập Bù lỗ hổng (Remediation)** | ❌ Không hỗ trợ | Thống kê Top câu sai của lớp | ✅ **Tự động sinh bài tập bù câu sai** | `GEMINI_API_KEY_MAX` |
| **Báo cáo học tập AI chuyên sâu** | ❌ Không hỗ trợ | Không giới hạn link Magic Link | ✅ **Nhận xét AI chi tiết gửi Zalo PH** | `GEMINI_API_KEY_MAX` |
| **Thí nghiệm 3D (Labs)** | 1 bài mẫu / môn (4 bài) | **Mở khóa trọn bộ 54+ Labs 3D** | **Mở khóa trọn bộ 54+ Labs 3D** | Hạ tầng 3D WebGL |
| **Whiteboard bục giảng số** | Kính vẽ bục giảng cơ bản | Kính vẽ Neon + AI sinh đề từ 3D | **Phòng học Whiteboard tương tác 2 chiều** | Socket phòng học |
| **Chợ đề thi (Marketplace)** | Phí sàn 30% | Phí sàn 15% - Giảm 20% khi mua | Phí sàn 5% - Giảm 50% mua đề VIP | Smart Contract / Escrow |

---

## 3. ĐẶC TẢ KỸ THUẬT CHI TIẾT THEO CỤM KEY API

### 3.1. Cụm Khóa `GEMINI_API_KEY_FREE`
- **Mục đích**: Bảo vệ ngân sách của hệ thống, chỉ dùng cho tài khoản mới đăng ký dùng thử.
- **Tính năng được phép gọi**:
  - `POST /api/exams/generate`: Tạo đề trắc nghiệm cơ bản.
  - Rate limit cứng: Tối đa 3 request / ngày / user.
  - Model: `gemini-1.5-flash` (không đính kèm system prompt phức tạp hay thinking mode).
  - **Lưu ý**: Tuyệt đối không cho phép gọi API chấm OMR hay Vision.

### 3.2. Cụm Khóa `GEMINI_API_KEY_PRO`
- **Mục đích**: Phục vụ các tác vụ sư phạm thường ngày của Giáo viên trường trả phí.
- **Tính năng phụ trách**:
  - `POST /api/exams/generate`: Tạo đề chuẩn GDPT 2025 kèm ma trận đặc tả.
  - `POST /api/exams/import-from-url`: Số hóa đề thi từ liên kết web bên ngoài.
  - `POST /api/grading/omr` (Vision Fallback):
    - **Cơ chế kích hoạt thông minh**: Khi quét phiếu trắc nghiệm bằng điện thoại, thuật toán OpenCV sẽ tìm 4 điểm neo định vị. Nếu camera bị rung hoặc méo góc khiến thuật toán **cắt góc thất bại ≥ 3 lần liên tiếp** (hoặc giáo viên nhấn nút *"Chấm cưỡng bức bằng AI Vision"* trên giao diện xem lại), hệ thống mới kích hoạt gọi Gemini Vision để đọc tọa độ các ô tô.
    - **Phân quyền**: Chỉ tài khoản **PRO** và **MAX** mới được kích hoạt Fallback này.

### 3.3. Cụm Khóa `GEMINI_API_KEY_MAX`
- **Mục đích**: Vận hành toàn bộ các tác vụ AI trí tuệ chuyên sâu, đắt giá nhất của nền tảng dành riêng cho Gia sư & Trung tâm luyện thi.
- **Tính năng độc quyền**:
  - `POST /api/exams/generate`: Chế độ suy luận nâng cao (`thinking_mode: true`), tạo câu hỏi vận dụng cao chuẩn phân hóa thi Đại học.
  - `POST /api/ai/live-clone`: Sinh câu hỏi tương tự cùng dạng, thay đổi số liệu toán học đẹp mắt ngay trong buổi dạy trực tiếp.
  - `POST /api/ai/scaffold`: Tự động chia nhỏ bài toán thành 3-4 nấc thang gợi ý suy luận mà không làm lộ ngay đáp án.
  - `POST /api/ai/multi-method`: Sinh đồng thời 2-3 cách giải khác nhau (Cách 1: Bản chất tự luận, Cách 2: Kỹ thuật trắc nghiệm Casio, Cách 3: Phương pháp hình học/vectơ).
  - `POST /api/remediation/generate`: Đọc danh sách câu sai của học sinh từ phiên chấm OMR, tự động tạo đề luyện tập bù lỗ hổng cá nhân hóa kèm mã đề riêng cho học sinh.
  - `POST /api/reports/generate`: Phân tích phổ điểm, chỉ số tự tin, nhận xét ưu/nhược điểm từng học sinh bằng AI và tạo file báo cáo gửi Zalo phụ huynh.

---

## 4. CHIẾN LƯỢC RÀO CẢN VÀ DỌN DẸP MÃ NGUỒN

### 4.1. Khóa Chấm Tự Động đối với Gói FREE
- Tại trang [`/grading`](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/(dashboard)/grading/page.tsx):
  - Nếu `!isProUser(profile)` (người dùng Free):
    - Khi bấm vào nút *"Quét phiếu bằng Điện thoại"*, *"Mở Camera chấm"*, hoặc *"Chấm hàng loạt"*: Hệ thống mở ngay **`UpgradeTierModal`** với thông điệp:
      > *"Tính năng Chấm phiếu trắc nghiệm tự động bằng AI/Điện thoại dành riêng cho Gói Giáo Viên PRO. Nâng cấp ngay để tiết kiệm 90% thời gian chấm bài!"*
    - Mục duy nhất mở cho Free là: *"Nhập điểm thủ công bằng tay"*.

### 4.2. Vô hiệu hóa các endpoint cũ đã loại bỏ
- `frontend/src/app/api/grading/route.ts` (Chấm tự luận AI): Trả về HTTP `410 Gone` với payload `{ error: "FEATURE_DEPRECATED", message: "Hệ thống đã loại bỏ Chấm tự luận để tập trung vào Chấm trắc nghiệm OMR chuẩn xác 100%." }`.
- `frontend/src/app/api/student/ai-tutor/route.ts`: Vô hiệu hóa và chặn mọi request chat Socratic tự do.
- `frontend/src/app/api/student/remediation/ai-tutor/route.ts`: Chuyển hướng học sinh sang đọc Scaffold gợi ý giải và Đa phương pháp tĩnh thay vì chatbot mở.

### 4.3. Dọn dẹp Giao diện Người dùng (UI Cleanup)
- Trang [`/grading`](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/(dashboard)/grading/page.tsx): Gỡ hoàn toàn tab "Chấm bài tự luận", chỉ giữ một luồng chấm duy nhất là Chấm phiếu trắc nghiệm OMR.
- Trang học sinh ([`/student`](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/(student)/student)): Gỡ bỏ widget chat Gia sư ảo trôi nổi; thay bằng modal *"Xem gợi ý giải từng bước"* và *"Các cách giải khác"* khi làm bài.

---

## 5. BẢO MẬT ADMIN & KÍCH HOẠT PHÂN TẦNG

- Tài khoản `truongcri0101@gmail.com` luôn có quyền MAX vĩnh viễn trên toàn hệ thống.
- Biến cấu hình `IS_BETA_ALL_FEATURES_UNLOCKED` tại [`plans.ts`](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/payment/plans.ts) sẽ được set về `false` để chính thức áp dụng rào cản phân quyền cho toàn bộ tài khoản thường.

---
*Tài liệu này là bản quy hoạch chuẩn xác nhất, đã loại bỏ hoàn toàn tính năng chấm tự động ở gói FREE.*
