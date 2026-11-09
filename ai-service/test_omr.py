import sys
import os

# Add ai-service to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.omr.sheet_generator import (
    build_classic_50_geometry,
    build_bgd_2025_geometry,
    build_bgd_2025_math_geometry,
    build_bgd_2025_science_geometry,
    build_bgd_2025_social_geometry,
    build_sheet_20_geometry,
    build_sheet_40_geometry,
    build_sheet_50_geometry,
    synthesize_filled_exam,
    generate_printable_pdf
)
from app.omr.template_matcher import grade_exam_sheet
from app.omr.detector import detect_and_warp_sheet


def test_classic_50():
    print("--- 1. Testing Classic 50 Sheet ---")
    c50_geom = build_classic_50_geometry()
    answers_50 = {str(i): ("A" if i % 2 == 0 else "B") for i in range(1, 51)}
    
    # Generate realistic filled sheet
    c50_img, meta = synthesize_filled_exam(
        c50_geom,
        student_code="654321",
        exam_code="204",
        answers_part1=answers_50,
        rotation_deg=0.0
    )
    
    # Grade sheet
    res_50 = grade_exam_sheet(c50_img, sheet_type="classic_50", answer_key=answers_50)
    print(f"Classic 50 Result: SBD={res_50['student_code']}, Exam={res_50['exam_code']}, Score={res_50['total_score']}, Correct={res_50['correct_count']}/50")
    
    assert res_50["student_code"] == "654321", f"Expected 654321, got {res_50['student_code']}"
    assert res_50["exam_code"] == "204", f"Expected 204, got {res_50['exam_code']}"
    assert res_50["correct_count"] == 50, f"Expected 50, got {res_50['correct_count']}"
    assert res_50["total_score"] == 10.0, f"Expected 10.0, got {res_50['total_score']}"
    assert "annotated_image_base64" in res_50, "Missing annotated image"
    print("PASS: Classic 50 sheet graded with 100% accuracy!")


def test_bgd_2025():
    print("--- 2. Testing BGD 2025 Sheet ---")
    bgd_geom = build_bgd_2025_geometry()
    p1_ans = {str(i): "C" for i in range(1, 41)}
    p2_ans = {str(i): {"a": "D", "b": "S", "c": "D", "d": "S"} for i in range(1, 9)}
    p3_ans = {"1": "-15", "2": "42", "3": "100"}
    
    bgd_img, meta = synthesize_filled_exam(
        bgd_geom,
        student_code="987654",
        exam_code="305",
        answers_part1=p1_ans,
        answers_part2=p2_ans,
        answers_part3=p3_ans
    )
    
    res_bgd = grade_exam_sheet(
        bgd_img,
        sheet_type="bgd_2025",
        answer_key={"part1": p1_ans, "part2": p2_ans, "part3": p3_ans}
    )
    
    print(f"BGD 2025 Result: SBD={res_bgd['student_code']}, Exam={res_bgd['exam_code']}, Total Score={res_bgd['total_score']}")
    print(f"Section Scores: {res_bgd['scores_by_section']}")
    
    assert res_bgd["student_code"] == "987654", f"Expected 987654, got {res_bgd['student_code']}"
    assert res_bgd["exam_code"] == "305", f"Expected 305, got {res_bgd['exam_code']}"
    assert res_bgd["scores_by_section"]["part1_score"] == 10.0
    assert res_bgd["scores_by_section"]["part2_score"] == 8.0  # 8 questions x 1.0 pt
    assert res_bgd["scores_by_section"]["part3_score"] == 0.75  # 3 correct x 0.25 pt
    print("PASS: BGD 2025 sheet graded with 100% accuracy!")


def test_pdf_generation():
    print("--- 3. Testing ReportLab PDF Generation ---")
    bgd_geom = build_bgd_2025_geometry()
    pdf_bytes = generate_printable_pdf(bgd_geom, "KY THI TOT NGHIEP THPT 2025")
    print(f"Generated PDF bytes: {len(pdf_bytes)}")
    assert len(pdf_bytes) > 5000, "PDF size is too small"
    print("PASS: Printable PDF generated successfully!")


def test_skew_and_erasures():
    print("--- 4. Testing Skew & Erasures Resilience ---")
    c50_geom = build_classic_50_geometry()
    answers = {str(i): "C" for i in range(1, 51)}

    # Rotate by 2.5 degrees and simulate random eraser smudges
    img, _ = synthesize_filled_exam(
        c50_geom,
        student_code="112233",
        exam_code="999",
        answers_part1=answers,
        rotation_deg=2.5,
        simulate_erasures=True
    )

    res = grade_exam_sheet(img, sheet_type="classic_50", answer_key=answers)
    print(f"Rotated 2.5 deg result: SBD={res['student_code']}, Exam={res['exam_code']}, Correct={res['correct_count']}/50")
    print(f"Engine used: {res['engine_used']}, Flagged questions: {len(res['flagged_questions'])}")

    assert res["student_code"] == "112233", f"Expected 112233, got {res['student_code']}"
    assert res["exam_code"] == "999", f"Expected 999, got {res['exam_code']}"
    assert res["correct_count"] >= 48, f"Expected at least 48/50, got {res['correct_count']}"
    print("PASS: Sheet with skew and erasures graded with high resilience!")


def test_fastapi_endpoints():
    print("--- 5. Testing FastAPI OMR Endpoints ---")
    from fastapi.testclient import TestClient
    from main import app
    from app.core.config import settings
    import base64
    import cv2

    client = TestClient(app)
    auth_headers = {"X-Internal-Key": settings.INTERNAL_API_KEY} if settings.INTERNAL_API_KEY else {}

    # 1. /ai/omr/templates
    r_tmpl = client.get("/ai/omr/templates", headers=auth_headers)
    assert r_tmpl.status_code == 200
    templates_list = r_tmpl.json().get("templates", [])
    tmpl_ids = {t["id"] for t in templates_list}
    for req_id in (
        "bgd_2025",
        "bgd_2025_math",
        "bgd_2025_science",
        "bgd_2025_social",
        "sheet_20",
        "sheet_40",
        "sheet_50",
        "classic_50",
    ):
        assert req_id in tmpl_ids, f"Missing template {req_id}"
    print(f"PASS: /ai/omr/templates returned {len(templates_list)} templates")

    # 2. /ai/omr/generate-sheet-pdf
    r_pdf = client.post(
        "/ai/omr/generate-sheet-pdf",
        headers=auth_headers,
        json={
            "sheet_type": "sheet_40",
            "exam_title": "KIỂM TRA ĐỊNH KỲ",
            "school_name": "THPT CHUYÊN"
        },
    )
    assert r_pdf.status_code == 200
    assert r_pdf.headers["content-type"] == "application/pdf"
    assert len(r_pdf.content) > 5000
    print(f"PASS: /ai/omr/generate-sheet-pdf returned {len(r_pdf.content)} bytes PDF")

    # 3. /ai/omr/grade-single
    c50_geom = build_classic_50_geometry()
    answers = {str(i): "A" for i in range(1, 51)}
    c50_img, _ = synthesize_filled_exam(c50_geom, student_code="889900", exam_code="102", answers_part1=answers)
    _, buf = cv2.imencode(".jpg", c50_img)
    b64_str = base64.b64encode(buf).decode("utf-8")

    r_single = client.post(
        "/ai/omr/grade-single",
        headers=auth_headers,
        json={
            "image_base64": b64_str,
            "sheet_type": "classic_50",
            "answer_key": answers,
            "return_annotated_image": True
        },
    )
    assert r_single.status_code == 200, f"Error: {r_single.text}"
    single_data = r_single.json()["data"]
    assert single_data["student_code"] == "889900"
    assert single_data["exam_code"] == "102"
    assert single_data["total_score"] == 10.0
    assert "annotated_image_base64" in single_data
    print("PASS: /ai/omr/grade-single completed successfully with score 10.0")

    # 4. /ai/omr/grade-batch
    r_batch = client.post(
        "/ai/omr/grade-batch",
        headers=auth_headers,
        json={
            "sheet_type": "classic_50",
            "answer_key": answers,
            "items": [
                {"id": "std_1", "image_base64": b64_str, "student_name": "Hoc Sinh 1"},
                {"id": "std_2", "image_base64": b64_str, "student_name": "Hoc Sinh 2"}
            ]
        },
    )
    assert r_batch.status_code == 200
    batch_data = r_batch.json()
    assert batch_data["success_count"] == 2
    assert batch_data["statistics"]["average_score"] == 10.0
    print("PASS: /ai/omr/grade-batch parallel processed 2 items successfully")


def test_bgd_2025_math_and_corner_detector():
    print("--- 6. Testing Official GDPT 2025 Math Sheet & Robust Corner Detector ---")
    import cv2
    import numpy as np

    math_geom = build_bgd_2025_math_geometry()
    p1_ans = {str(i): ["A", "B", "C", "D"][(i - 1) % 4] for i in range(1, 13)}
    p2_ans = {
        "1": {"a": "Đ", "b": "S", "c": "Đ", "d": "S"},
        "2": {"a": "S", "b": "Đ", "c": "Đ", "d": "S"},
        "3": {"a": "Đ", "b": "Đ", "c": "Đ", "d": "Đ"},
        "4": {"a": "S", "b": "S", "c": "Đ", "d": "Đ"},
    }
    p3_ans = {"1": "-2,5", "2": "0,75", "3": "-0,4", "4": "15", "5": "4,25", "6": "-108"}

    # Flat frontend-style answer key with dot decimals
    flat_key = {
        **p1_ans,
        "13": "Đ-S-Đ-S",
        "14": "S-Đ-Đ-S",
        "15": "Đ-Đ-Đ-Đ",
        "16": "S-S-Đ-Đ",
        "17": "-2.5",
        "18": "0.75",
        "19": "-0.4",
        "20": "15",
        "21": "4.25",
        "22": "-108",
    }

    sheet_img, _ = synthesize_filled_exam(
        math_geom,
        student_code="01234567",
        exam_code="409",
        answers_part1=p1_ans,
        answers_part2=p2_ans,
        answers_part3=p3_ans,
        simulate_erasures=False,
    )

    # 6a. Clean sheet + standalone detector auto-detection of 5x5mm @ 8mm anchor ratio
    w_auto, _, eng_auto = detect_and_warp_sheet(sheet_img)
    assert eng_auto == "anchor_marks"
    assert w_auto[82, 82].mean() < 30.0, "5x5mm @ 8mm anchor should align to ~82.7px"

    res_clean = grade_exam_sheet(sheet_img, sheet_type="bgd_2025_math", answer_key=flat_key)
    assert res_clean["student_code"] == "01234567"
    assert res_clean["exam_code"] == "409"
    assert res_clean["total_score"] == 10.0

    # 6b. Perspective skew on dark wooden desk + decoy black square on table
    desk = np.full((2600, 2000, 3), (45, 38, 32), dtype=np.uint8)
    h0, w0 = sheet_img.shape[:2]
    M = cv2.getPerspectiveTransform(
        np.float32([[0, 0], [w0, 0], [w0, h0], [0, h0]]),
        np.float32([[220, 170], [1810, 230], [1740, 2470], [150, 2410]])
    )
    cv2.warpPerspective(sheet_img, M, (2000, 2600), dst=desk, borderMode=cv2.BORDER_TRANSPARENT)
    cv2.rectangle(desk, (30, 30), (90, 90), (5, 5, 5), -1)  # decoy object on desk
    res_skew = grade_exam_sheet(desk, sheet_type="bgd_2025_math", answer_key=flat_key)
    assert res_skew["engine_used"] == "anchor_marks"
    assert res_skew["total_score"] == 10.0

    # 6c. 90° sideways & 180° upside-down orientation correction
    for rot_code, lbl in [
        (cv2.ROTATE_90_CLOCKWISE, "90_CW"),
        (cv2.ROTATE_90_COUNTERCLOCKWISE, "90_CCW"),
        (cv2.ROTATE_180, "180"),
    ]:
        rot_img = cv2.rotate(sheet_img, rot_code)
        res_rot = grade_exam_sheet(rot_img, sheet_type="bgd_2025_math", answer_key=flat_key)
        assert res_rot["total_score"] == 10.0, f"Orientation {lbl} failed: {res_rot['total_score']}"

    # 6d. Faint shadow over BL anchor (3-anchor recovery test)
    dim_bl = desk.copy()
    # Dim BL anchor region heavily so global pass misses it while Otsu recovery catches it
    cv2.rectangle(dim_bl, (160, 2300), (290, 2420), (140, 140, 140), 15)
    res_rec = grade_exam_sheet(dim_bl, sheet_type="bgd_2025_math", answer_key=flat_key)
    assert res_rec["total_score"] == 10.0

    print("PASS: Official GDPT 2025 Math (22 Q) + 90°/180° + dark-desk + decimals passed 100%!")


def test_bgd_2025_science_and_social():
    print("--- 7. Testing Official GDPT 2025 Science (18+4+6) & Social (24+4) ---")
    import cv2
    import numpy as np

    # 7A. KHTN & Dia li (18 MCQ + 4 T/F + 6 Short Answer = 28 Q, 10.0 pts)
    sci_geom = build_bgd_2025_science_geometry()
    sci_p1 = {str(i): ["A", "B", "C", "D"][(i - 1) % 4] for i in range(1, 19)}
    sci_p2 = {
        "1": {"a": "Đ", "b": "S", "c": "Đ", "d": "S"},
        "2": {"a": "S", "b": "Đ", "c": "Đ", "d": "S"},
        "3": {"a": "Đ", "b": "Đ", "c": "Đ", "d": "Đ"},
        "4": {"a": "S", "b": "S", "c": "Đ", "d": "Đ"},
    }
    sci_p3 = {"1": "-3,5", "2": "12,4", "3": "-0,8", "4": "205", "5": "9,25", "6": "-42"}
    sci_flat = {
        **sci_p1,
        "19": "Đ-S-Đ-S",
        "20": "S-Đ-Đ-S",
        "21": "Đ-Đ-Đ-Đ",
        "22": "S-S-Đ-Đ",
        "23": "-3.5",
        "24": "12.4",
        "25": "-0.8",
        "26": "205",
        "27": "9.25",
        "28": "-42",
    }
    sci_img, _ = synthesize_filled_exam(
        sci_geom,
        student_code="87654321",
        exam_code="218",
        answers_part1=sci_p1,
        answers_part2=sci_p2,
        answers_part3=sci_p3,
        simulate_erasures=False,
    )
    assert len(generate_printable_pdf(sci_geom, "KHTN 28 CAU")) > 5000
    for rot_code in (None, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE, cv2.ROTATE_180):
        inp = sci_img if rot_code is None else cv2.rotate(sci_img, rot_code)
        r = grade_exam_sheet(inp, sheet_type="bgd_2025_science", answer_key=sci_flat)
        assert r["student_code"] == "87654321"
        assert r["exam_code"] == "218"
        assert r["scores_by_section"] == {"part1_score": 4.5, "part2_score": 4.0, "part3_score": 1.5}
        assert r["total_score"] == 10.0

    # 7B. KHXH & Cong nghe (24 MCQ + 4 T/F = 28 Q, NO Part III, 10.0 pts)
    soc_geom = build_bgd_2025_social_geometry()
    soc_p1 = {str(i): ["A", "B", "C", "D"][(i - 1) % 4] for i in range(1, 25)}
    soc_p2 = sci_p2
    soc_flat = {
        **soc_p1,
        "25": "Đ-S-Đ-S",
        "26": "S-Đ-Đ-S",
        "27": "Đ-Đ-Đ-Đ",
        "28": "S-S-Đ-Đ",
    }
    soc_img, _ = synthesize_filled_exam(
        soc_geom,
        student_code="13572468",
        exam_code="512",
        answers_part1=soc_p1,
        answers_part2=soc_p2,
        answers_part3=None,
        simulate_erasures=False,
    )
    assert len(generate_printable_pdf(soc_geom, "KHXH 28 CAU")) > 5000

    # Dark desk perspective skew + 90 CCW + 180 upside down (previously failed on notchless sheet without Part III!)
    desk = np.full((2600, 2000, 3), (45, 38, 32), dtype=np.uint8)
    h0, w0 = soc_img.shape[:2]
    M = cv2.getPerspectiveTransform(
        np.float32([[0, 0], [w0, 0], [w0, h0], [0, h0]]),
        np.float32([[210, 165], [1795, 225], [1725, 2455], [145, 2395]])
    )
    cv2.warpPerspective(soc_img, M, (2000, 2600), dst=desk, borderMode=cv2.BORDER_TRANSPARENT)

    for lbl, inp in [
        ("clean", soc_img),
        ("dark_desk", desk),
        ("90_CW", cv2.rotate(soc_img, cv2.ROTATE_90_CLOCKWISE)),
        ("90_CCW", cv2.rotate(soc_img, cv2.ROTATE_90_COUNTERCLOCKWISE)),
        ("180", cv2.rotate(soc_img, cv2.ROTATE_180)),
    ]:
        r = grade_exam_sheet(inp, sheet_type="bgd_2025_social", answer_key=soc_flat)
        assert r["engine_used"] == "anchor_marks", f"{lbl} engine={r['engine_used']}"
        assert r["student_code"] == "13572468", f"{lbl} sbd={r['student_code']}"
        assert r["exam_code"] == "512", f"{lbl} exam={r['exam_code']}"
        assert r["scores_by_section"] == {"part1_score": 6.0, "part2_score": 4.0, "part3_score": 0.0}
        assert r["total_score"] == 10.0, f"{lbl} score={r['total_score']}"

    print("PASS: Official GDPT 2025 Science (18+4+6) & Social (24+4, incl. 90_CCW/180) passed 100%!")


def test_unified_mcq_sheets_and_utf8_pdfs():
    print("--- 8. Testing Unified MCQ Sheets (20/40/50) & UTF-8 ReportLab PDF Round-Trip ---")
    import cv2
    import fitz
    import numpy as np

    mcq_specs = [
        ("sheet_20", build_sheet_20_geometry(), 20, "01928374", "205"),
        ("sheet_40", build_sheet_40_geometry(), 40, "45678901", "408"),
        ("sheet_50", build_sheet_50_geometry(), 50, "01234567", "309"),
    ]

    for sheet_type, geom, q_count, sbd, exam_code in mcq_specs:
        ans = {str(i): ["A", "B", "C", "D"][(i - 1) % 4] for i in range(1, q_count + 1)}
        img, _ = synthesize_filled_exam(
            geom,
            student_code=sbd,
            exam_code=exam_code,
            answers_part1=ans,
            simulate_erasures=False,
        )

        # 8a. Clean + Dark desk + Rotations (90_CW, 90_CCW, 180)
        desk = np.full((2600, 2000, 3), (45, 38, 32), dtype=np.uint8)
        h0, w0 = img.shape[:2]
        M = cv2.getPerspectiveTransform(
            np.float32([[0, 0], [w0, 0], [w0, h0], [0, h0]]),
            np.float32([[215, 175], [1805, 225], [1735, 2465], [145, 2405]]),
        )
        cv2.warpPerspective(img, M, (2000, 2600), dst=desk, borderMode=cv2.BORDER_TRANSPARENT)
        cv2.rectangle(desk, (25, 25), (85, 85), (10, 10, 10), -1)  # decoy square

        for lbl, inp in [
            ("clean", img),
            ("dark_desk", desk),
            ("90_CW", cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)),
            ("90_CCW", cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)),
            ("180", cv2.rotate(img, cv2.ROTATE_180)),
        ]:
            res = grade_exam_sheet(inp, sheet_type=sheet_type, answer_key=ans)
            assert res["engine_used"] == "anchor_marks", f"{sheet_type}/{lbl} engine={res['engine_used']}"
            assert res["student_code"] == sbd, f"{sheet_type}/{lbl} sbd={res['student_code']}"
            assert res["exam_code"] == exam_code, f"{sheet_type}/{lbl} exam={res['exam_code']}"
            assert res["correct_count"] == q_count, f"{sheet_type}/{lbl} correct={res['correct_count']}"
            assert res["total_score"] == 10.0, f"{sheet_type}/{lbl} score={res['total_score']}"

        # 8b. ReportLab Printable PDF -> Verify UTF-8 Vietnamese text + ZERO '■' + Round-trip scan grading!
        pdf_bytes = generate_printable_pdf(geom, f"KIỂM TRA ĐỊNH KỲ ({q_count} CÂU)")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = "\n".join(page.get_text() for page in doc)
        assert "■" not in full_text, f"{sheet_type} PDF contains tofu box '■'!"
        assert "PHIẾU TRẢ LỜI TRẮC NGHIỆM" in full_text, f"{sheet_type} missing Vietnamese title!"
        assert "EduTest OMR" in full_text, f"{sheet_type} missing EduTest OMR branding!"
        assert "EduTest AI" not in full_text, f"{sheet_type} still contains EduTest AI!"

        # Render generated PDF page at 200 DPI, paint bubbles directly at PDF->pixel geometry, warp & grade!
        pix = doc[0].get_pixmap(dpi=200)
        pdf_img = cv2.cvtColor(
            np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n),
            cv2.COLOR_RGB2BGR,
        )
        sx = pix.width / geom["width"]
        sy = pix.height / geom["height"]
        for c_i, ch in enumerate(sbd):
            for item in geom["student_code"][c_i]:
                if item["digit"] == ch:
                    cv2.circle(pdf_img, (int(round(item["cx"] * sx)), int(round(item["cy"] * sy))), int(round(item["r"] * sx * 0.9)), (20, 20, 20), -1)
        for c_i, ch in enumerate(exam_code):
            for item in geom["exam_code"][c_i]:
                if item["digit"] == ch:
                    cv2.circle(pdf_img, (int(round(item["cx"] * sx)), int(round(item["cy"] * sy))), int(round(item["r"] * sx * 0.9)), (20, 20, 20), -1)
        for q_num, opts in geom["questions"].items():
            target = ans[q_num]
            for opt in opts:
                if opt["label"] == target:
                    cv2.circle(pdf_img, (int(round(opt["cx"] * sx)), int(round(opt["cy"] * sy))), int(round(opt["r"] * sx * 0.9)), (20, 20, 20), -1)

        res_pdf = grade_exam_sheet(pdf_img, sheet_type=sheet_type, answer_key=ans)
        assert res_pdf["student_code"] == sbd, f"{sheet_type} PDF round-trip SBD={res_pdf['student_code']}"
        assert res_pdf["exam_code"] == exam_code, f"{sheet_type} PDF round-trip exam={res_pdf['exam_code']}"
        assert res_pdf["total_score"] == 10.0, f"{sheet_type} PDF round-trip score={res_pdf['total_score']}"

    # 8c. Also verify UTF-8 Vietnamese & zero '■' / zero 'EduTest AI' on all 2025 & legacy PDFs
    for st_name, g_fn, expected_header in [
        ("bgd_2025_math", build_bgd_2025_math_geometry, "PHIẾU TRẢ LỜI TRẮC NGHIỆM"),
        ("bgd_2025_science", build_bgd_2025_science_geometry, "PHIẾU TRẢ LỜI TRẮC NGHIỆM"),
        ("bgd_2025_social", build_bgd_2025_social_geometry, "PHIẾU TRẢ LỜI TRẮC NGHIỆM"),
        ("bgd_2025", build_bgd_2025_geometry, "THÔNG TIN THÍ SINH"),
        ("classic_50", build_classic_50_geometry, "THÔNG TIN THÍ SINH"),
    ]:
        pdf_bytes = generate_printable_pdf(g_fn(), "ĐỀ KIỂM TRA HỌC KỲ I")
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        full_text = "\n".join(page.get_text() for page in doc)
        assert "■" not in full_text, f"{st_name} PDF contains tofu box '■'!"
        assert expected_header in full_text, f"{st_name} missing Vietnamese header!"
        assert "EduTest OMR" in full_text, f"{st_name} missing EduTest OMR branding!"
        assert "EduTest AI" not in full_text, f"{st_name} still contains EduTest AI!"

    print("PASS: Unified MCQ (20/40/50) + UTF-8 ReportLab PDF round-trip passed 100%!")


if __name__ == "__main__":
    test_classic_50()
    test_bgd_2025()
    test_pdf_generation()
    test_skew_and_erasures()
    test_fastapi_endpoints()
    test_bgd_2025_math_and_corner_detector()
    test_bgd_2025_science_and_social()
    test_unified_mcq_sheets_and_utf8_pdfs()
    print("\n==========================================")
    print("SUCCESS: ALL OMR ENGINE UNIT TESTS PASSED 100%!")
    print("==========================================")
