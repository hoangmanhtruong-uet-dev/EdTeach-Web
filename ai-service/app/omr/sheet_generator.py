"""
OMR Sheet Template Geometry and PDF Generator.
Supports:
1. Official GDPT 2025 layouts ('bgd_2025_math', 'bgd_2025_science', 'bgd_2025_social')
2. Unified A4 MCQ sheets ('sheet_20', 'sheet_40', 'sheet_50')
3. Legacy formats ('bgd_2025': 40+8+6, 'classic_50': 2x25)
Generates high-precision UTF-8 Vietnamese PDF sheets and provides exact pixel coordinates for OpenCV matching.
"""

import io
import math
import os
import random
from pathlib import Path
from typing import Dict, Any, List, Tuple
import cv2
import numpy as np
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

TARGET_W = 1654
TARGET_H = 2338
PT_W, PT_H = A4
SCALE_X = TARGET_W / PT_W
SCALE_Y = TARGET_H / PT_H
MM_TO_PT = 72.0 / 25.4

OFFICIAL_2025_TYPES = {"bgd_2025_math", "bgd_2025_science", "bgd_2025_social"}
UNIFIED_A4_MCQ_TYPES = {"sheet_20", "sheet_40", "sheet_50"}
UNIFIED_A4_TYPES = OFFICIAL_2025_TYPES | UNIFIED_A4_MCQ_TYPES

_FONT_REG = "EduDejaVu"
_FONT_BOLD = "EduDejaVu-Bold"
_FONT_ITALIC = "EduDejaVu-Oblique"


def _ensure_unicode_fonts() -> Tuple[str, str, str]:
    """Register bundled DejaVuSans TTF fonts so Vietnamese UTF-8 characters never render as '■'."""
    registered = set(pdfmetrics.getRegisteredFontNames())
    if _FONT_REG in registered and _FONT_BOLD in registered:
        return _FONT_REG, _FONT_BOLD, _FONT_ITALIC if _FONT_ITALIC in registered else _FONT_REG

    candidate_dirs = [
        Path(__file__).resolve().parent / "fonts",
        Path("/usr/share/fonts/truetype/dejavu"),
    ]
    try:
        import matplotlib
        candidate_dirs.append(Path(matplotlib.get_data_path()) / "fonts" / "ttf")
    except Exception:
        pass

    for font_dir in candidate_dirs:
        reg_path = font_dir / "DejaVuSans.ttf"
        bold_path = font_dir / "DejaVuSans-Bold.ttf"
        obl_path = font_dir / "DejaVuSans-Oblique.ttf"
        if reg_path.exists() and bold_path.exists():
            if _FONT_REG not in registered:
                pdfmetrics.registerFont(TTFont(_FONT_REG, str(reg_path)))
            if _FONT_BOLD not in registered:
                pdfmetrics.registerFont(TTFont(_FONT_BOLD, str(bold_path)))
            if obl_path.exists() and _FONT_ITALIC not in registered:
                pdfmetrics.registerFont(TTFont(_FONT_ITALIC, str(obl_path)))
            italic_name = _FONT_ITALIC if obl_path.exists() else _FONT_REG
            return _FONT_REG, _FONT_BOLD, italic_name

    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"


def mm_to_pt(x_mm: float, y_top_mm: float) -> Tuple[float, float]:
    """Convert top-left A4 millimeter coordinate to ReportLab points (bottom-left origin)."""
    return x_mm * MM_TO_PT, PT_H - (y_top_mm * MM_TO_PT)


def px_to_pt(x_px: float, y_px: float) -> Tuple[float, float]:
    """Convert OpenCV pixel coordinate (top-left origin) to ReportLab points (bottom-left origin)."""
    x_pt = x_px / SCALE_X
    y_pt = PT_H - (y_px / SCALE_Y)
    return x_pt, y_pt


def pt_to_px(x_pt: float, y_pt: float) -> Tuple[int, int]:
    """Convert ReportLab points to OpenCV pixel coordinate."""
    x_px = int(round(x_pt * SCALE_X))
    y_px = int(round((PT_H - y_pt) * SCALE_Y))
    return x_px, y_px


def mm_to_px(x_mm: float, y_top_mm: float) -> Tuple[int, int]:
    """Convert top-left A4 millimeter coordinate to OpenCV canvas pixel (1654 x 2338)."""
    x_px = int(round((x_mm / 210.0) * TARGET_W))
    y_px = int(round((y_top_mm / 297.0) * TARGET_H))
    return x_px, y_px


def _build_official_2025_header() -> Tuple[List[Dict[str, Any]], List[List[float]], List[List[Dict[str, Any]]], List[List[Dict[str, Any]]], int, int]:
    """Shared A4 5x5mm @ 8mm corner anchors, 8-col SBD and 3-col Exam Code across official GDPT 2025 templates."""
    anchors = [
        {"name": "TL", "rect": [int(round(8.0 / 210.0 * TARGET_W)), int(round(8.0 / 297.0 * TARGET_H)), 39, 39]},
        {"name": "TR", "rect": [int(round(197.0 / 210.0 * TARGET_W)), int(round(8.0 / 297.0 * TARGET_H)), 39, 39]},
        {"name": "BR", "rect": [int(round(197.0 / 210.0 * TARGET_W)), int(round(284.0 / 297.0 * TARGET_H)), 39, 39]},
        {"name": "BL", "rect": [int(round(8.0 / 210.0 * TARGET_W)), int(round(284.0 / 297.0 * TARGET_H)), 39, 39]},
    ]
    anchor_centers = [
        [(10.5 / 210.0) * TARGET_W, (10.5 / 297.0) * TARGET_H],
        [((210.0 - 10.5) / 210.0) * TARGET_W, (10.5 / 297.0) * TARGET_H],
        [((210.0 - 10.5) / 210.0) * TARGET_W, ((297.0 - 10.5) / 297.0) * TARGET_H],
        [(10.5 / 210.0) * TARGET_W, ((297.0 - 10.5) / 297.0) * TARGET_H],
    ]

    r_sbd = int(round(1.9 / 210.0 * TARGET_W))   # 15 px
    r_main = int(round(2.0 / 210.0 * TARGET_W))  # 16 px

    student_code_columns = []
    for col in range(8):
        col_digits = []
        x_mm = 113.0 + col * 6.0
        for d in range(10):
            y_mm = 51.0 + d * 4.8
            cx, cy = mm_to_px(x_mm, y_mm)
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": r_sbd})
        student_code_columns.append(col_digits)

    exam_code_columns = []
    for col in range(3):
        col_digits = []
        x_mm = 171.0 + col * 6.0
        for d in range(10):
            y_mm = 51.0 + d * 4.8
            cx, cy = mm_to_px(x_mm, y_mm)
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": r_sbd})
        exam_code_columns.append(col_digits)

    return anchors, anchor_centers, student_code_columns, exam_code_columns, r_sbd, r_main


def build_bgd_2025_math_geometry() -> Dict[str, Any]:
    """
    Exact 1:1 geometry matching the Official GDPT 2025 Math OMR PDF (22 questions):
    - 4 solid black corner anchors: 5mm x 5mm at 8mm margin (center 10.5mm from edges)
    - SBD: 8 columns (0-9)
    - Exam code: 3 columns (0-9)
    - Part I: 12 MCQ questions (3 columns x 4 rows) -> 0.25 pt/q = 3.0 pts
    - Part II: 4 True/False questions x 4 items (a, b, c, d) -> 1.0 pt/q = 4.0 pts
    - Part III: 6 Short Answer questions (4 cols: col0 [-,0-9], col1-2 [,,0-9], col3 [0-9]) -> 0.5 pt/q = 3.0 pts
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, r_sbd, r_main = _build_official_2025_header()

    # Part I: 12 questions arranged in 3 columns x 4 rows
    part1_questions = {}
    group_starts = [27.0, 87.6667, 148.3333]
    for q_idx in range(1, 13):
        grp = (q_idx - 1) // 4
        row = (q_idx - 1) % 4
        y_mm = 113.0 + row * 7.0
        x0_mm = group_starts[grp]
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 9.0, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        part1_questions[str(q_idx)] = opts

    # Part II: 4 questions x 4 items (a, b, c, d), arranged side-by-side
    part2_questions = {}
    for q_idx in range(1, 5):
        d_x_mm = 38.75 + (q_idx - 1) * 45.5
        s_x_mm = 47.75 + (q_idx - 1) * 45.5
        sub_items = {}
        for sub_i, sub_lbl in enumerate(["a", "b", "c", "d"]):
            y_mm = 167.5 + sub_i * 6.6
            d_cx, d_cy = mm_to_px(d_x_mm, y_mm)
            s_cx, s_cy = mm_to_px(s_x_mm, y_mm)
            sub_items[sub_lbl] = [
                {"label": "Đ", "cx": d_cx, "cy": d_cy, "r": r_main},
                {"label": "S", "cx": s_cx, "cy": s_cy, "r": r_main},
            ]
        part2_questions[str(q_idx)] = sub_items

    # Part III: 6 questions horizontally, each with 4 char columns
    part3_questions = {}
    q_step_mm = 182.0 / 6.0
    for q_idx in range(1, 7):
        col0_x_mm = 14.0 + (q_idx - 1) * q_step_mm + 6.7667
        cols_data = []
        for c_i in range(4):
            x_mm = col0_x_mm + c_i * 5.6
            bubbles = []
            if c_i == 0:
                bx, by = mm_to_px(x_mm, 220.0)
                bubbles.append({"label": "-", "cx": bx, "cy": by, "r": r_main})
            elif c_i in (1, 2):
                bx, by = mm_to_px(x_mm, 220.0)
                bubbles.append({"label": ",", "cx": bx, "cy": by, "r": r_main})
            for d in range(10):
                y_mm = 225.4 + d * 5.2
                bx, by = mm_to_px(x_mm, y_mm)
                bubbles.append({"label": str(d), "cx": bx, "cy": by, "r": r_sbd})
            cols_data.append({"type": "char_col", "bubbles": bubbles})
        part3_questions[str(q_idx)] = cols_data

    return {
        "sheet_type": "bgd_2025_math",
        "name": "Phiếu Trả Lời Trắc Nghiệm Môn Toán (GDPT 2025 - 22 Câu)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "part1_points": 0.25,
        "part3_points": 0.5,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "part1": part1_questions,
        "part2": part2_questions,
        "part3": part3_questions,
    }


def build_bgd_2025_science_geometry() -> Dict[str, Any]:
    """
    Exact 1:1 geometry matching the Official GDPT 2025 Science & Geography OMR PDF (28 questions):
    Subjects: Vật lí, Hóa học, Sinh học, Địa lí.
    - Part I: 18 MCQ questions (3 columns x 6 rows) -> 0.25 pt/q = 4.5 pts
    - Part II: 4 True/False questions x 4 items (a, b, c, d) -> 1.0 pt/q = 4.0 pts
    - Part III: 6 Short Answer questions (4 cols: -, ,, 0-9) -> 0.25 pt/q = 1.5 pts
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, r_sbd, r_main = _build_official_2025_header()

    # Part I: 18 questions arranged in 3 columns x 6 rows
    part1_questions = {}
    group_starts = [27.0, 87.6667, 148.3333]
    for q_idx in range(1, 19):
        grp = (q_idx - 1) // 6
        row = (q_idx - 1) % 6
        y_mm = 113.0 + row * 6.0
        x0_mm = group_starts[grp]
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 9.0, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        part1_questions[str(q_idx)] = opts

    # Part II: 4 questions x 4 items (a, b, c, d)
    part2_questions = {}
    for q_idx in range(1, 5):
        d_x_mm = 38.75 + (q_idx - 1) * 45.5
        s_x_mm = 47.75 + (q_idx - 1) * 45.5
        sub_items = {}
        for sub_i, sub_lbl in enumerate(["a", "b", "c", "d"]):
            y_mm = 173.0 + sub_i * 5.8
            d_cx, d_cy = mm_to_px(d_x_mm, y_mm)
            s_cx, s_cy = mm_to_px(s_x_mm, y_mm)
            sub_items[sub_lbl] = [
                {"label": "Đ", "cx": d_cx, "cy": d_cy, "r": r_main},
                {"label": "S", "cx": s_cx, "cy": s_cy, "r": r_main},
            ]
        part2_questions[str(q_idx)] = sub_items

    # Part III: 6 questions horizontally, each with 4 char columns
    part3_questions = {}
    q_step_mm = 182.0 / 6.0
    for q_idx in range(1, 7):
        col0_x_mm = 14.0 + (q_idx - 1) * q_step_mm + 6.7667
        cols_data = []
        for c_i in range(4):
            x_mm = col0_x_mm + c_i * 5.6
            bubbles = []
            if c_i == 0:
                bx, by = mm_to_px(x_mm, 224.4)
                bubbles.append({"label": "-", "cx": bx, "cy": by, "r": r_main})
            elif c_i in (1, 2):
                bx, by = mm_to_px(x_mm, 224.4)
                bubbles.append({"label": ",", "cx": bx, "cy": by, "r": r_main})
            for d in range(10):
                y_mm = 229.8 + d * 4.8
                bx, by = mm_to_px(x_mm, y_mm)
                bubbles.append({"label": str(d), "cx": bx, "cy": by, "r": r_sbd})
            cols_data.append({"type": "char_col", "bubbles": bubbles})
        part3_questions[str(q_idx)] = cols_data

    return {
        "sheet_type": "bgd_2025_science",
        "name": "Phiếu Trả Lời Trắc Nghiệm KHTN & Địa Lí (GDPT 2025 - 28 Câu)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "part1_points": 0.25,
        "part3_points": 0.25,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "part1": part1_questions,
        "part2": part2_questions,
        "part3": part3_questions,
    }


def build_bgd_2025_social_geometry() -> Dict[str, Any]:
    """
    Exact 1:1 geometry matching the Official GDPT 2025 Social Sciences & Tech OMR PDF (28 questions):
    Subjects: Lịch sử, GD Kinh tế & Pháp luật (GDCD), Công nghệ.
    - Part I: 24 MCQ questions (4 columns x 6 rows) -> 0.25 pt/q = 6.0 pts
    - Part II: 4 True/False questions x 4 items (a, b, c, d) -> 1.0 pt/q = 4.0 pts
    - Part III: None (signature area at bottom)
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, _, r_main = _build_official_2025_header()

    # Part I: 24 questions arranged in 4 columns x 6 rows
    part1_questions = {}
    group_starts = [25.0, 70.5, 116.0, 161.5]
    for q_idx in range(1, 25):
        grp = (q_idx - 1) // 6
        row = (q_idx - 1) % 6
        y_mm = 113.0 + row * 8.0
        x0_mm = group_starts[grp]
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 8.0, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        part1_questions[str(q_idx)] = opts

    # Part II: 4 questions x 4 items (a, b, c, d)
    part2_questions = {}
    for q_idx in range(1, 5):
        d_x_mm = 38.75 + (q_idx - 1) * 45.5
        s_x_mm = 47.75 + (q_idx - 1) * 45.5
        sub_items = {}
        for sub_i, sub_lbl in enumerate(["a", "b", "c", "d"]):
            y_mm = 185.0 + sub_i * 7.4
            d_cx, d_cy = mm_to_px(d_x_mm, y_mm)
            s_cx, s_cy = mm_to_px(s_x_mm, y_mm)
            sub_items[sub_lbl] = [
                {"label": "Đ", "cx": d_cx, "cy": d_cy, "r": r_main},
                {"label": "S", "cx": s_cx, "cy": s_cy, "r": r_main},
            ]
        part2_questions[str(q_idx)] = sub_items

    return {
        "sheet_type": "bgd_2025_social",
        "name": "Phiếu Trả Lời Trắc Nghiệm KHXH & Công Nghệ (GDPT 2025 - 28 Câu)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "part1_points": 0.25,
        "part3_points": 0.0,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "part1": part1_questions,
        "part2": part2_questions,
        "part3": {},
    }


def build_sheet_50_geometry() -> Dict[str, Any]:
    """
    Unified A4 OMR Sheet for 50 MCQ questions (A-B-C-D):
    - 5x5mm @ 8mm corner anchors, 8-col SBD, 3-col Exam Code
    - 5 vertical columns x 10 rows (Q1-10, Q11-20, Q21-30, Q31-40, Q41-50)
    - 0.2 pt/question = 10.0 pts
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, _, r_main = _build_official_2025_header()
    questions = {}
    for q_idx in range(1, 51):
        grp = (q_idx - 1) // 10
        row = (q_idx - 1) % 10
        x0_mm = 23.4 + grp * 36.4
        y_mm = 114.0 + row * 11.0
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 7.2, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        questions[str(q_idx)] = opts

    return {
        "sheet_type": "sheet_50",
        "name": "Phiếu Trả Lời Trắc Nghiệm 50 Câu (A-B-C-D)",
        "num_cols": 5,
        "x0_base_mm": 23.4,
        "col_step_mm": 36.4,
        "opt_step_mm": 7.2,
        "num_left_gap_mm": 4.2,
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "questions": questions,
    }


def build_sheet_40_geometry() -> Dict[str, Any]:
    """
    Unified A4 OMR Sheet for 40 MCQ questions (A-B-C-D):
    - 5x5mm @ 8mm corner anchors, 8-col SBD, 3-col Exam Code
    - 4 vertical columns x 10 rows (Q1-10, Q11-20, Q21-30, Q31-40)
    - 0.25 pt/question = 10.0 pts
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, _, r_main = _build_official_2025_header()
    questions = {}
    for q_idx in range(1, 41):
        grp = (q_idx - 1) // 10
        row = (q_idx - 1) % 10
        x0_mm = 26.8 + grp * 45.5
        y_mm = 114.0 + row * 11.0
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 8.5, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        questions[str(q_idx)] = opts

    return {
        "sheet_type": "sheet_40",
        "name": "Phiếu Trả Lời Trắc Nghiệm 40 Câu (A-B-C-D)",
        "num_cols": 4,
        "x0_base_mm": 26.8,
        "col_step_mm": 45.5,
        "opt_step_mm": 8.5,
        "num_left_gap_mm": 4.5,
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "questions": questions,
    }


def build_sheet_20_geometry() -> Dict[str, Any]:
    """
    Unified A4 OMR Sheet for 20 MCQ questions (A-B-C-D):
    - 5x5mm @ 8mm corner anchors, 8-col SBD, 3-col Exam Code
    - 2 vertical columns x 10 rows (Q1-10, Q11-20)
    - 0.5 pt/question = 10.0 pts
    """
    anchors, anchor_centers, student_code_columns, exam_code_columns, _, r_main = _build_official_2025_header()
    questions = {}
    for q_idx in range(1, 21):
        grp = (q_idx - 1) // 10
        row = (q_idx - 1) % 10
        x0_mm = 43.5 + grp * 91.0
        y_mm = 114.0 + row * 11.0
        opts = []
        for i, lbl in enumerate(["A", "B", "C", "D"]):
            cx, cy = mm_to_px(x0_mm + i * 12.0, y_mm)
            opts.append({"label": lbl, "cx": cx, "cy": cy, "r": r_main})
        questions[str(q_idx)] = opts

    return {
        "sheet_type": "sheet_20",
        "name": "Phiếu Trả Lời Trắc Nghiệm 20 Câu (A-B-C-D)",
        "num_cols": 2,
        "x0_base_mm": 43.5,
        "col_step_mm": 91.0,
        "opt_step_mm": 12.0,
        "num_left_gap_mm": 5.0,
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "anchor_centers": anchor_centers,
        "bubble_radius": r_main,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "questions": questions,
    }


def build_bgd_2025_geometry() -> Dict[str, Any]:
    """
    Builds exact geometry for BGD 2025 exam sheet.
    Canvas: 1654 x 2338 px.
    Anchor marks: 4 corners at margin 70px, size 80px.
    """
    margin = 70
    anchor_size = 80
    anchors = [
        {"name": "TL", "rect": [margin, margin, anchor_size, anchor_size]},
        {"name": "TR", "rect": [TARGET_W - margin - anchor_size, margin, anchor_size, anchor_size]},
        {"name": "BR", "rect": [TARGET_W - margin - anchor_size, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
        {"name": "BL", "rect": [margin, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
    ]

    bubble_radius = 14

    # 1. Student Code (Số Báo Danh - 6 digits, 0-9)
    # Placed at top right of header zone
    sbd_origin_x = 1000
    sbd_origin_y = 280
    sbd_dx = 40
    sbd_dy = 32
    student_code_columns = []
    for col in range(6):
        col_digits = []
        cx = sbd_origin_x + col * sbd_dx
        for d in range(10):
            cy = sbd_origin_y + d * sbd_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        student_code_columns.append(col_digits)

    # 2. Exam Code (Mã Đề Thi - 3 digits, 0-9)
    exam_origin_x = 1320
    exam_origin_y = 280
    exam_dx = 40
    exam_dy = 32
    exam_code_columns = []
    for col in range(3):
        col_digits = []
        cx = exam_origin_x + col * exam_dx
        for d in range(10):
            cy = exam_origin_y + d * exam_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        exam_code_columns.append(col_digits)

    # 3. Part I: 40 questions (4 options: A, B, C, D)
    # Arranged in 2 columns: Q1-Q20 (left) and Q21-Q40 (right)
    part1_questions = {}
    col1_x = 130
    col2_x = 510
    part1_y_start = 740
    part1_dy = 34
    opt_dx = 42

    for q_idx in range(1, 41):
        is_col2 = q_idx > 20
        row_idx = (q_idx - 1) % 20
        base_x = col2_x if is_col2 else col1_x
        cy = part1_y_start + row_idx * part1_dy
        options = []
        for i, opt in enumerate(["A", "B", "C", "D"]):
            cx = base_x + 90 + i * opt_dx
            options.append({"label": opt, "cx": cx, "cy": cy, "r": bubble_radius})
        part1_questions[str(q_idx)] = options

    # 4. Part II: 8 questions (True/False - 4 sub-items: a, b, c, d; each has [Đ], [S])
    # Placed on right side: X ~ 920, Y ~ 740
    part2_questions = {}
    part2_base_x = 940
    part2_y_start = 740
    part2_q_dy = 86  # vertical span per question

    for q_idx in range(1, 9):
        q_y = part2_y_start + (q_idx - 1) * part2_q_dy
        sub_items = {}
        for sub_i, sub_lbl in enumerate(["a", "b", "c", "d"]):
            # Two sub-items per row to keep it compact
            row = sub_i // 2
            col = sub_i % 2
            item_x = part2_base_x + col * 160
            item_y = q_y + row * 34
            d_cx = item_x + 50
            s_cx = item_x + 92
            sub_items[sub_lbl] = [
                {"label": "Đ", "cx": d_cx, "cy": item_y, "r": bubble_radius},
                {"label": "S", "cx": s_cx, "cy": item_y, "r": bubble_radius}
            ]
        part2_questions[str(q_idx)] = sub_items

    # 5. Part III: 6 questions (Short Answer / Number fill)
    # Placed on bottom right: Y ~ 1520
    # Each question has 5 columns: sign (-/,) and 4 digits (0-9)
    part3_questions = {}
    part3_origin_y = 1530
    part3_q_dy = 100

    for q_idx in range(1, 7):
        # 3 questions per column
        col_group = 0 if q_idx <= 3 else 1
        q_in_col = (q_idx - 1) % 3
        q_base_x = 940 + col_group * 310
        q_cy = part3_origin_y + q_in_col * 240

        cols_data = []
        # Col 0: Sign '-' and decimal ','
        sign_col = [
            {"label": "-", "cx": q_base_x + 55, "cy": q_cy + 25, "r": 12},
            {"label": ",", "cx": q_base_x + 55, "cy": q_cy + 55, "r": 12}
        ]
        cols_data.append({"type": "sign", "bubbles": sign_col})

        # Col 1..4: Digits 0..9
        for dcol in range(4):
            digits_list = []
            cx = q_base_x + 95 + dcol * 36
            for d in range(10):
                cy = q_cy + 25 + d * 21
                digits_list.append({"label": str(d), "cx": cx, "cy": cy, "r": 10})
            cols_data.append({"type": "digit", "bubbles": digits_list})

        part3_questions[str(q_idx)] = cols_data

    return {
        "sheet_type": "bgd_2025",
        "name": "Phiếu Trả Lời Trắc Nghiệm Chuẩn Bộ GD&ĐT (GDPT 2018)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "bubble_radius": bubble_radius,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "part1": part1_questions,
        "part2": part2_questions,
        "part3": part3_questions
    }


def build_classic_50_geometry() -> Dict[str, Any]:
    """
    Builds exact geometry for Classic 50-question A-B-C-D sheet.
    """
    margin = 70
    anchor_size = 80
    anchors = [
        {"name": "TL", "rect": [margin, margin, anchor_size, anchor_size]},
        {"name": "TR", "rect": [TARGET_W - margin - anchor_size, margin, anchor_size, anchor_size]},
        {"name": "BR", "rect": [TARGET_W - margin - anchor_size, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
        {"name": "BL", "rect": [margin, TARGET_H - margin - anchor_size, anchor_size, anchor_size]},
    ]
    bubble_radius = 15

    # SBD: 6 cols x 10 rows
    sbd_origin_x = 900
    sbd_origin_y = 260
    sbd_dx = 42
    sbd_dy = 32
    student_code_columns = []
    for col in range(6):
        col_digits = []
        cx = sbd_origin_x + col * sbd_dx
        for d in range(10):
            cy = sbd_origin_y + d * sbd_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        student_code_columns.append(col_digits)

    # Exam Code: 3 cols x 10 rows
    exam_origin_x = 1260
    exam_origin_y = 260
    exam_dx = 42
    exam_dy = 32
    exam_code_columns = []
    for col in range(3):
        col_digits = []
        cx = exam_origin_x + col * exam_dx
        for d in range(10):
            cy = exam_origin_y + d * exam_dy
            col_digits.append({"digit": str(d), "cx": cx, "cy": cy, "r": bubble_radius})
        exam_code_columns.append(col_digits)

    # 50 Questions: 2 columns of 25 questions each
    # Column 1: Q1 - Q25 (Left)
    # Column 2: Q26 - Q50 (Right)
    questions = {}
    col1_x = 180
    col2_x = 880
    y_start = 660
    dy = 60
    opt_dx = 65

    for q_idx in range(1, 51):
        is_col2 = q_idx > 25
        row_idx = (q_idx - 1) % 25
        base_x = col2_x if is_col2 else col1_x
        cy = y_start + row_idx * dy
        options = []
        for i, opt in enumerate(["A", "B", "C", "D"]):
            cx = base_x + 120 + i * opt_dx
            options.append({"label": opt, "cx": cx, "cy": cy, "r": bubble_radius})
        questions[str(q_idx)] = options

    return {
        "sheet_type": "classic_50",
        "name": "Phiếu Trả Lời Trắc Nghiệm Truyền Thống 50 Câu (A-B-C-D)",
        "width": TARGET_W,
        "height": TARGET_H,
        "anchors": anchors,
        "bubble_radius": bubble_radius,
        "student_code": student_code_columns,
        "exam_code": exam_code_columns,
        "questions": questions
    }


def render_blank_sheet_image(geom: Dict[str, Any]) -> np.ndarray:
    """
    Renders an exact synthetic OpenCV image corresponding to the template geometry.
    Useful for unit testing, debug overlays, and preview.
    """
    img = np.ones((TARGET_H, TARGET_W, 3), dtype="uint8") * 255
    st_type = geom.get("sheet_type", "")
    is_unified = st_type in UNIFIED_A4_TYPES

    # 1. Draw 4 solid black anchor marks
    for anchor in geom["anchors"]:
        rx, ry, rw, rh = anchor["rect"]
        cv2.rectangle(img, (rx, ry), (rx + rw, ry + rh), (0, 0, 0), -1)

    # Orientation notch (Top Left) for legacy sheets; skipped on unified A4 layouts
    if not is_unified:
        cv2.rectangle(img, (180, 85), (220, 135), (0, 0, 0), -1)

    # 2. Draw Header
    title = geom.get("name", "PHIẾU TRẢ LỜI TRẮC NGHIỆM")
    cv2.putText(img, title, (260, 120), cv2.FONT_HERSHEY_DUPLEX, 1.0, (20, 20, 20), 2)
    cv2.putText(img, "Bo Giao Duc & Dao Tao - EduTest OMR System", (260, 155), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (80, 80, 80), 1)

    if is_unified:
        # Candidate info box (compact left side matching official PDF)
        cv2.putText(img, "THONG TIN THI SINH", (110, 260), cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 0), 2)
        cv2.rectangle(img, (110, 618), (772, 756), (60, 60, 60), 1)
    else:
        # Candidate info box (lines for hand-writing name, class, exam date)
        cv2.rectangle(img, (100, 200), (860, 580), (50, 50, 50), 2)
        info_labels = [
            "Ho va ten thi sinh: ................................................................",
            "Ngay sinh: ........................................ Lop: ...........................",
            "Truong: ............................................................................",
            "Phong thi: ................ So bao danh: ....................................",
            "Chu y: Dung but chi 2B to kin o tron. Khong gap rach phieu.",
        ]
        for i, lbl in enumerate(info_labels):
            cv2.putText(img, lbl, (120, 245 + i * 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (30, 30, 30), 1)

    # 3. Draw Student Code table
    if is_unified:
        cv2.rectangle(img, (858, 256), (1252, 775), (30, 30, 30), 2)
        cv2.putText(img, "SO BAO DANH", (960, 290), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    else:
        cv2.rectangle(img, (980, 210), (1240, 600), (30, 30, 30), 2)
        cv2.putText(img, "SO BAO DANH", (1030, 245), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    for col_digits in geom["student_code"]:
        for item in col_digits:
            cx, cy, r = item["cx"], item["cy"], item["r"]
            cv2.circle(img, (cx, cy), r, (0, 0, 0), 1)
            cv2.putText(img, item["digit"], (cx - 5, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (60, 60, 60), 1)

    # 4. Draw Exam Code table
    if is_unified:
        cv2.rectangle(img, (1315, 256), (1473, 775), (30, 30, 30), 2)
        cv2.putText(img, "MA DE", (1355, 290), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    else:
        cv2.rectangle(img, (1300, 210), (1440, 600), (30, 30, 30), 2)
        cv2.putText(img, "MA DE", (1335, 245), cv2.FONT_HERSHEY_DUPLEX, 0.65, (0, 0, 0), 2)
    for col_digits in geom["exam_code"]:
        for item in col_digits:
            cx, cy, r = item["cx"], item["cy"], item["r"]
            cv2.circle(img, (cx, cy), r, (0, 0, 0), 1)
            cv2.putText(img, item["digit"], (cx - 5, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (60, 60, 60), 1)

    # 5. Draw Content depending on sheet type
    if st_type in UNIFIED_A4_MCQ_TYPES:
        cv2.rectangle(img, (110, 803), (1544, 1716), (40, 40, 40), 1)
        for q_num, opts in geom["questions"].items():
            first_cx, cy = opts[0]["cx"], opts[0]["cy"]
            cv2.putText(img, f"{q_num:>2}", (first_cx - 46, cy + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 5, opt["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (40, 40, 40), 1)
        for bx1, bx2 in [(110, 557), (588, 1035), (1066, 1544)]:
            cv2.rectangle(img, (bx1, 1763), (bx2, 1968), (80, 80, 80), 1)
    elif st_type == "classic_50":
        for q_num, opts in geom["questions"].items():
            first_cx = opts[0]["cx"]
            cy = opts[0]["cy"]
            cv2.putText(img, f"Cau {q_num: >2}:", (first_cx - 95, cy + 5), cv2.FONT_HERSHEY_DUPLEX, 0.55, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 6, opt["cy"] + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (40, 40, 40), 1)
    elif st_type in OFFICIAL_2025_TYPES:
        if st_type == "bgd_2025_math":
            p1_box, p2_box, p3_box = (110, 803, 1544, 1110), (110, 1141, 1544, 1511), (110, 1527, 1544, 2188)
        elif st_type == "bgd_2025_science":
            p1_box, p2_box, p3_box = (110, 850, 1544, 1161), (110, 1232, 1544, 1538), (110, 1609, 1544, 2176)
        else:  # bgd_2025_social (24 + 4, signature boxes at bottom)
            p1_box, p2_box, p3_box = (110, 850, 1544, 1256), (110, 1326, 1544, 1670), None

        cv2.rectangle(img, p1_box[:2], p1_box[2:], (40, 40, 40), 1)
        for q_num, opts in geom["part1"].items():
            first_cx, cy = opts[0]["cx"], opts[0]["cy"]
            cv2.putText(img, f"{q_num:>2}.", (first_cx - 50, cy + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.46, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 5, opt["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        cv2.rectangle(img, p2_box[:2], p2_box[2:], (40, 40, 40), 1)
        for q_num, sub_dict in geom["part2"].items():
            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                cv2.putText(img, f"{sub_lbl})", (d_bub["cx"] - 50, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (30, 30, 30), 1)
                cv2.circle(img, (d_bub["cx"], d_bub["cy"]), d_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "D", (d_bub["cx"] - 5, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)
                cv2.circle(img, (s_bub["cx"], s_bub["cy"]), s_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "S", (s_bub["cx"] - 5, s_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        if p3_box is not None and geom.get("part3"):
            cv2.rectangle(img, p3_box[:2], p3_box[2:], (40, 40, 40), 1)
            for q_num, col_groups in geom["part3"].items():
                for c_info in col_groups:
                    for b in c_info["bubbles"]:
                        cv2.circle(img, (b["cx"], b["cy"]), b["r"], (0, 0, 0), 1)
                        cv2.putText(img, b["label"], (b["cx"] - 4, b["cy"] + 3), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (50, 50, 50), 1)
        else:
            for bx1, bx2 in [(110, 557), (588, 1035), (1066, 1544)]:
                cv2.rectangle(img, (bx1, 1718), (bx2, 1922), (80, 80, 80), 1)
    else:
        # Legacy BGD 2025: Draw Part I, Part II, Part III
        cv2.putText(img, "PHAN I: TRAC NGHIEM 4 LUA CHON (40 CAU)", (100, 690), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (90, 710), (870, 1460), (40, 40, 40), 1)
        for q_num, opts in geom["part1"].items():
            first_cx = opts[0]["cx"]
            cy = opts[0]["cy"]
            cv2.putText(img, f"{q_num:>2}.", (first_cx - 48, cy + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (20, 20, 20), 1)
            for opt in opts:
                cv2.circle(img, (opt["cx"], opt["cy"]), opt["r"], (0, 0, 0), 1)
                cv2.putText(img, opt["label"], (opt["cx"] - 5, opt["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        cv2.putText(img, "PHAN II: DUNG / SAI (8 CAU)", (910, 690), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (900, 710), (1550, 1460), (40, 40, 40), 1)
        for q_num, sub_dict in geom["part2"].items():
            sample_sub = sub_dict["a"][0]
            q_y = sample_sub["cy"]
            cv2.putText(img, f"Cau {q_num}:", (910, q_y + 15), cv2.FONT_HERSHEY_DUPLEX, 0.55, (20, 20, 20), 1)
            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                cv2.putText(img, f"{sub_lbl})", (d_bub["cx"] - 30, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (30, 30, 30), 1)
                cv2.circle(img, (d_bub["cx"], d_bub["cy"]), d_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "D", (d_bub["cx"] - 5, d_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)
                cv2.circle(img, (s_bub["cx"], s_bub["cy"]), s_bub["r"], (0, 0, 0), 1)
                cv2.putText(img, "S", (s_bub["cx"] - 5, s_bub["cy"] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (50, 50, 50), 1)

        cv2.putText(img, "PHAN III: TRA LOI NGAN / DIEN SO (6 CAU)", (100, 1495), cv2.FONT_HERSHEY_DUPLEX, 0.75, (0, 0, 0), 2)
        cv2.rectangle(img, (90, 1515), (1550, 2240), (40, 40, 40), 1)
        for q_num, col_groups in geom["part3"].items():
            base_x = col_groups[0]["bubbles"][0]["cx"] - 50
            base_y = col_groups[0]["bubbles"][0]["cy"] - 10
            cv2.putText(img, f"Cau {q_num}", (base_x, base_y), cv2.FONT_HERSHEY_DUPLEX, 0.52, (20, 20, 20), 1)
            for c_info in col_groups:
                for b in c_info["bubbles"]:
                    cv2.circle(img, (b["cx"], b["cy"]), b["r"], (0, 0, 0), 1)
                    cv2.putText(img, b["label"], (b["cx"] - 4, b["cy"] + 3), cv2.FONT_HERSHEY_SIMPLEX, 0.32, (50, 50, 50), 1)

    return img


def _draw_rect_mm(c: canvas.Canvas, x_mm: float, y_top_mm: float, w_mm: float, h_mm: float, fill: int = 0, stroke: int = 1):
    x_pt, y_bot_pt = mm_to_pt(x_mm, y_top_mm + h_mm)
    c.rect(x_pt, y_bot_pt, w_mm * MM_TO_PT, h_mm * MM_TO_PT, fill=fill, stroke=stroke)


def _draw_line_mm(c: canvas.Canvas, x1_mm: float, y1_mm: float, x2_mm: float, y2_mm: float):
    x1_pt, y1_pt = mm_to_pt(x1_mm, y1_mm)
    x2_pt, y2_pt = mm_to_pt(x2_mm, y2_mm)
    c.line(x1_pt, y1_pt, x2_pt, y2_pt)


def _draw_unified_a4_pdf(c: canvas.Canvas, geom: Dict[str, Any], exam_title: str, f_reg: str, f_bold: str) -> None:
    """
    Renders publication-grade UTF-8 Vietnamese A4 OMR PDF matching 1:1 with OpenCV geometry
    for both GDPT 2025 sheets and Unified 20/40/50 MCQ sheets.
    """
    st_type = geom["sheet_type"]

    # 1. Four 5x5mm @ 8mm solid black corner anchors
    c.setFillColor(colors.black)
    c.setStrokeColor(colors.black)
    for ax_mm, ay_mm in [(8.0, 8.0), (197.0, 8.0), (8.0, 284.0), (197.0, 284.0)]:
        _draw_rect_mm(c, ax_mm, ay_mm, 5.0, 5.0, fill=1, stroke=0)

    # 2. Header titles
    subtitle_map = {
        "bgd_2025_math": "MÔN TOÁN – CHƯƠNG TRÌNH GDPT 2018 (KỲ THI 2025)",
        "bgd_2025_science": "MÔN: VẬT LÍ – HÓA HỌC – SINH HỌC – ĐỊA LÍ",
        "bgd_2025_social": "MÔN: LỊCH SỬ – GD KINH TẾ & PHÁP LUẬT – CÔNG NGHỆ – TIN HỌC",
        "sheet_20": "20 CÂU – 4 PHƯƠNG ÁN A, B, C, D",
        "sheet_40": "40 CÂU – 4 PHƯƠNG ÁN A, B, C, D",
        "sheet_50": "50 CÂU – 4 PHƯƠNG ÁN A, B, C, D",
    }
    sub_cap_map = {
        "bgd_2025_science": "Chương trình GDPT 2018 – kỳ thi 2025 · 28 câu",
        "bgd_2025_social": "Chương trình GDPT 2018 – kỳ thi 2025 · 28 câu",
    }

    cx_mid, ty1 = mm_to_pt(105.0, 18.0)
    c.setFont(f_bold, 15.0)
    c.drawCentredString(cx_mid, ty1, "PHIẾU TRẢ LỜI TRẮC NGHIỆM")

    _, ty2 = mm_to_pt(105.0, 24.5)
    c.setFont(f_bold, 9.0)
    c.drawCentredString(cx_mid, ty2, subtitle_map.get(st_type, geom.get("name", "")))

    clean_title = (exam_title or "").strip()
    is_generic_title = (
        not clean_title
        or clean_title.upper() == "KỲ THI TRẮC NGHIỆM ĐỊNH KỲ"
        or clean_title.lower().startswith("phiếu trả lời trắc nghiệm")
    )
    cap_line = sub_cap_map.get(st_type, "")
    if not is_generic_title:
        cap_line = clean_title[:90]
    if cap_line:
        _, ty3 = mm_to_pt(105.0, 29.5)
        c.setFont(f_reg, 7.0)
        c.setFillColor(colors.Color(0.25, 0.25, 0.25))
        c.drawCentredString(cx_mid, ty3, cap_line)
        c.setFillColor(colors.black)

    # 3. Candidate Info Left Block (x = 14..98mm)
    c.setFont(f_bold, 8.0)
    tx, ty = mm_to_pt(14.0, 37.0)
    c.drawString(tx, ty, "THÔNG TIN THÍ SINH")

    c.setFont(f_reg, 7.8)
    for lx, ly, lbl in [
        (14.0, 46.0, "Họ và tên:"),
        (14.0, 55.0, "Ngày sinh:"),
        (60.0, 55.0, "Lớp:"),
        (14.0, 64.0, "Trường:"),
        (14.0, 73.0, "Phòng thi:"),
        (60.0, 73.0, "Giám thị:" if st_type in OFFICIAL_2025_TYPES else "Môn thi:"),
    ]:
        px, py = mm_to_pt(lx, ly)
        c.drawString(px, py, lbl)

    c.setStrokeColor(colors.Color(0.45, 0.45, 0.45))
    c.setLineWidth(0.55)
    c.setDash([1.2, 2.0])
    for x1, y1, x2 in [
        (29.8, 46.6, 98.0),
        (30.1, 55.6, 56.0),
        (67.4, 55.6, 98.0),
        (26.2, 64.6, 98.0),
        (29.5, 73.6, 56.0),
        (73.8 if st_type in OFFICIAL_2025_TYPES else 72.7, 73.6, 98.0),
    ]:
        _draw_line_mm(c, x1, y1, x2, y1)
    c.setDash()
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.7)

    # 4. Instruction Box with Tô đúng / Tô sai examples
    _draw_rect_mm(c, 14.0, 78.5, 84.0, 17.5, fill=0, stroke=1)
    c.setFont(f_bold, 6.8)
    c.drawString(*mm_to_pt(16.0, 82.0), "Lưu ý:")
    c.setFont(f_reg, 6.8)
    c.drawString(*mm_to_pt(26.0, 82.0), "Dùng bút chì đen 2B, tô kín ô tròn.")
    c.drawString(*mm_to_pt(16.0, 86.0), "Không làm rách, gấp, nhàu phiếu; không viết")
    c.drawString(*mm_to_pt(16.0, 89.4), "vào ô định vị đen ở bốn góc.")

    c.setFont(f_reg, 6.3)
    c.drawString(*mm_to_pt(16.0, 93.9), "Tô đúng:")
    c.drawString(*mm_to_pt(40.0, 93.9), "Tô sai:")

    # Good circle example (solid black circle) + 3 bad examples (half/empty/dot/cross)
    r_ex = 1.60 * MM_TO_PT
    gx_pt, gy_pt = mm_to_pt(30.0, 93.3)
    c.setFillColor(colors.black)
    c.circle(gx_pt, gy_pt, r_ex, stroke=1, fill=1)

    c.setLineWidth(0.6)
    for bx_mm in (52.0, 58.2, 64.4):
        c.circle(*mm_to_pt(bx_mm, 93.3), r_ex, stroke=1, fill=0)
    # Checkmark next to good / partial slash on 52.0
    _draw_line_mm(c, 50.8, 93.3, 51.6, 94.2)
    _draw_line_mm(c, 51.6, 94.2, 53.1, 92.2)
    # Tiny dot inside 58.2
    c.circle(*mm_to_pt(58.2, 93.3), 0.45 * MM_TO_PT, stroke=0, fill=1)
    # Cross X inside 64.4
    _draw_line_mm(c, 63.3, 92.2, 65.5, 94.4)
    _draw_line_mm(c, 63.3, 94.4, 65.5, 92.2)

    # 5. SBD Box (8 cols) & Exam Code Box (3 cols)
    c.setLineWidth(0.75)
    _draw_rect_mm(c, 109.0, 32.5, 50.0, 66.0, fill=0, stroke=1)
    c.setFont(f_bold, 7.8)
    c.drawCentredString(*mm_to_pt(134.0, 37.0), "SỐ BÁO DANH")
    for col in range(8):
        _draw_rect_mm(c, 110.5 + col * 6.0, 40.0, 5.0, 6.2, fill=0, stroke=1)

    c.setLineWidth(0.55)
    for col_digits in geom["student_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont(f_reg, 5.8)
            c.drawCentredString(x_pt, y_pt - 2.0, item["digit"])

    c.setLineWidth(0.75)
    _draw_rect_mm(c, 167.0, 32.5, 20.0, 66.0, fill=0, stroke=1)
    c.setFont(f_bold, 7.8)
    c.drawCentredString(*mm_to_pt(177.0, 37.0), "MÃ ĐỀ")
    for col in range(3):
        _draw_rect_mm(c, 168.5 + col * 6.0, 40.0, 5.0, 6.2, fill=0, stroke=1)

    c.setLineWidth(0.55)
    for col_digits in geom["exam_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont(f_reg, 5.8)
            c.drawCentredString(x_pt, y_pt - 2.0, item["digit"])

    def draw_banner(y_top_mm: float, bold_prefix: str, desc_text: str):
        c.setFillColor(colors.Color(0.89, 0.89, 0.89))
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.7)
        _draw_rect_mm(c, 14.0, y_top_mm, 182.0, 6.0, fill=1, stroke=1)
        c.setFillColor(colors.black)
        c.setFont(f_bold, 8.0)
        bx_pt, by_pt = mm_to_pt(16.0, y_top_mm + 4.3)
        c.drawString(bx_pt, by_pt, bold_prefix)
        prefix_w_pt = pdfmetrics.stringWidth(bold_prefix, f_bold, 8.0)
        c.setFont(f_reg, 6.8)
        c.drawString(bx_pt + prefix_w_pt + 4.0, by_pt, desc_text)

    # 6. Sheet Body
    if st_type in UNIFIED_A4_MCQ_TYPES:
        n_q = len(geom["questions"])
        draw_banner(
            102.0,
            "PHẦN TRẢ LỜI.",
            f"Câu trắc nghiệm nhiều phương án lựa chọn (câu 1–{n_q}). Mỗi câu chỉ chọn một phương án.",
        )
        c.setLineWidth(0.7)
        _draw_rect_mm(c, 14.0, 108.0, 182.0, 110.0, fill=0, stroke=1)

        num_cols = geom["num_cols"]
        col_w = 182.0 / num_cols
        c.setStrokeColor(colors.Color(0.75, 0.75, 0.75))
        c.setLineWidth(0.5)
        for col in range(1, num_cols):
            dx = 14.0 + col * col_w
            _draw_line_mm(c, dx, 110.0, dx, 216.0)
        for col in range(num_cols):
            x_left = 14.0 + col * col_w + 3.0
            x_right = 14.0 + (col + 1) * col_w - 3.0
            _draw_line_mm(c, x_left, 163.5, x_right, 163.5)

        c.setStrokeColor(colors.black)
        c.setLineWidth(0.55)
        num_gap_pt = geom.get("num_left_gap_mm", 4.5) * MM_TO_PT
        for q_num, opts in geom["questions"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            r_pt = opts[0]["r"] / SCALE_X
            c.setFont(f_bold, 8.0)
            c.drawRightString(first_pt_x - r_pt - num_gap_pt * 0.5, first_pt_y - 2.6, str(q_num))
            for opt in opts:
                ox, oy = px_to_pt(opt["cx"], opt["cy"])
                c.circle(ox, oy, opt["r"] / SCALE_X, stroke=1, fill=0)
                c.setFont(f_reg, 6.2)
                c.drawCentredString(ox, oy - 2.1, opt["label"])

        c.setLineWidth(0.65)
        for sx_mm, sig_title in [(14.0, "Chữ ký thí sinh"), (74.67, "Giám thị 1"), (135.33, "Giám thị 2")]:
            _draw_rect_mm(c, sx_mm, 224.0, 56.67, 26.0, fill=0, stroke=1)
            c.setFont(f_bold, 7.0)
            c.drawString(*mm_to_pt(sx_mm + 2.0, 228.5), sig_title)

    elif st_type in OFFICIAL_2025_TYPES:
        if st_type == "bgd_2025_math":
            p1_y, p1_h = 108.0, 33.0
            p2_ban, p2_h, p2_div_y1, p2_div_y2, p2_tit_y = 145.0, 41.0, 153.0, 190.0, 157.5
            p3_ban, p3_h, p3_box_y, p3_div_y1, p3_div_y2, p3_tit_y = 194.0, 78.0, 209.0, 202.0, 276.0, 206.5
        elif st_type == "bgd_2025_science":
            p1_y, p1_h = 108.0, 39.5
            p2_ban, p2_h, p2_div_y1, p2_div_y2, p2_tit_y = 150.5, 38.9, 158.5, 193.5, 163.0
            p3_ban, p3_h, p3_box_y, p3_div_y1, p3_div_y2, p3_tit_y = 198.4, 72.0, 213.4, 206.4, 274.4, 210.9
        else:  # bgd_2025_social
            p1_y, p1_h = 108.0, 51.5
            p2_ban, p2_h, p2_div_y1, p2_div_y2, p2_tit_y = 162.5, 43.7, 170.5, 210.2, 175.0
            p3_ban = None

        # Part I
        n_p1 = len(geom["part1"])
        draw_banner(
            102.0,
            "PHẦN I.",
            f"Câu trắc nghiệm nhiều phương án lựa chọn (câu 1–{n_p1}). Mỗi câu chỉ chọn một phương án.",
        )
        c.setLineWidth(0.7)
        _draw_rect_mm(c, 14.0, p1_y, 182.0, p1_h, fill=0, stroke=1)
        c.setLineWidth(0.55)
        for q_num, opts in geom["part1"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            r_pt = opts[0]["r"] / SCALE_X
            c.setFont(f_bold, 7.6)
            c.drawRightString(first_pt_x - r_pt - 4.0, first_pt_y - 2.4, str(q_num))
            for opt in opts:
                ox, oy = px_to_pt(opt["cx"], opt["cy"])
                c.circle(ox, oy, opt["r"] / SCALE_X, stroke=1, fill=0)
                c.setFont(f_reg, 5.9)
                c.drawCentredString(ox, oy - 2.0, opt["label"])

        # Part II
        draw_banner(
            p2_ban,
            "PHẦN II.",
            "Câu trắc nghiệm đúng sai (câu 1–4). Mỗi ý a), b), c), d) chọn Đúng hoặc Sai.",
        )
        c.setLineWidth(0.7)
        _draw_rect_mm(c, 14.0, p2_ban + 6.0, 182.0, p2_h, fill=0, stroke=1)
        c.setStrokeColor(colors.Color(0.75, 0.75, 0.75))
        c.setLineWidth(0.5)
        for dx in (59.5, 105.0, 150.5):
            _draw_line_mm(c, dx, p2_div_y1, dx, p2_div_y2)
        c.setStrokeColor(colors.black)
        c.setLineWidth(0.55)

        for q_num, sub_dict in geom["part2"].items():
            qi = int(q_num) - 1
            col_mid_mm = 36.75 + qi * 45.5
            c.setFont(f_bold, 8.0)
            c.drawCentredString(*mm_to_pt(col_mid_mm, p2_tit_y), f"Câu {q_num}")
            c.setFont(f_reg, 6.2)
            c.drawCentredString(*mm_to_pt(38.75 + qi * 45.5, p2_tit_y + 4.7), "Đúng")
            c.drawCentredString(*mm_to_pt(47.75 + qi * 45.5, p2_tit_y + 4.7), "Sai")

            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                dx_pt, dy_pt = px_to_pt(d_bub["cx"], d_bub["cy"])
                sx_pt, sy_pt = px_to_pt(s_bub["cx"], s_bub["cy"])
                r_pt = d_bub["r"] / SCALE_X
                c.setFont(f_bold, 8.0)
                c.drawRightString(dx_pt - r_pt - 14.0, dy_pt - 2.6, f"{sub_lbl})")
                c.circle(dx_pt, dy_pt, r_pt, stroke=1, fill=0)
                c.setFont(f_reg, 5.9)
                c.drawCentredString(dx_pt, dy_pt - 2.0, "Đ")
                c.circle(sx_pt, sy_pt, r_pt, stroke=1, fill=0)
                c.drawCentredString(sx_pt, sy_pt - 2.0, "S")

        # Part III (Math / Science) or Signature Boxes (Social)
        if p3_ban is not None and geom.get("part3"):
            draw_banner(
                p3_ban,
                "PHẦN III.",
                "Câu trắc nghiệm trả lời ngắn (câu 1–6). Điền tối đa 4 ký tự (gồm dấu “−”, dấu “,”) rồi tô ô tròn.",
            )
            c.setLineWidth(0.7)
            _draw_rect_mm(c, 14.0, p3_ban + 6.0, 182.0, p3_h, fill=0, stroke=1)
            q_step_mm = 182.0 / 6.0
            c.setStrokeColor(colors.Color(0.75, 0.75, 0.75))
            c.setLineWidth(0.5)
            for k in range(1, 6):
                dx = 14.0 + k * q_step_mm
                _draw_line_mm(c, dx, p3_div_y1, dx, p3_div_y2)
            c.setStrokeColor(colors.black)

            for q_num, col_groups in geom["part3"].items():
                qi = int(q_num) - 1
                col_mid_mm = 14.0 + (qi + 0.5) * q_step_mm
                c.setFont(f_bold, 8.0)
                c.drawCentredString(*mm_to_pt(col_mid_mm, p3_tit_y), f"Câu {q_num}")

                c.setLineWidth(0.6)
                for c_i in range(4):
                    box_x = 14.0 + qi * q_step_mm + 4.3667 + c_i * 5.6
                    _draw_rect_mm(c, box_x, p3_box_y, 4.8, 6.2, fill=0, stroke=1)

                c.setLineWidth(0.55)
                for c_info in col_groups:
                    for b in c_info["bubbles"]:
                        bx_pt, by_pt = px_to_pt(b["cx"], b["cy"])
                        br_pt = b["r"] / SCALE_X
                        c.circle(bx_pt, by_pt, br_pt, stroke=1, fill=0)
                        c.setFont(f_reg, 5.5)
                        disp_lbl = "−" if b["label"] == "-" else b["label"]
                        c.drawCentredString(bx_pt, by_pt - 1.9, disp_lbl)
        else:
            c.setLineWidth(0.65)
            for sx_mm, sig_title in [(14.0, "Chữ ký thí sinh"), (74.67, "Giám thị 1"), (135.33, "Giám thị 2")]:
                _draw_rect_mm(c, sx_mm, 218.2, 56.67, 26.0, fill=0, stroke=1)
                c.setFont(f_bold, 7.0)
                c.drawString(*mm_to_pt(sx_mm + 2.0, 222.7), sig_title)

    # 7. Footer notice
    c.setFont(f_reg, 6.5)
    c.setFillColor(colors.Color(0.25, 0.25, 0.25))
    c.drawCentredString(
        *mm_to_pt(105.0, 281.0),
        "Phiếu được chấm tự động bằng EduTest OMR – không viết, vẽ ngoài khu vực quy định.",
    )
    c.setFillColor(colors.black)


def generate_printable_pdf(geom: Dict[str, Any], exam_title: str = "KỲ THI TRẮC NGHIỆM ĐỊNH KỲ") -> bytes:
    """
    Generates a production-quality, exact-dimension UTF-8 printable PDF sheet using ReportLab.
    Matches 1:1 with the pixel coordinates upon scanning at 200 DPI.
    """
    f_reg, f_bold, f_italic = _ensure_unicode_fonts()
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setAuthor("EduTest OMR")
    c.setTitle(exam_title or geom.get("name", "Phiếu trả lời trắc nghiệm"))

    st_type = geom.get("sheet_type", "")
    if st_type in UNIFIED_A4_TYPES:
        _draw_unified_a4_pdf(c, geom, exam_title, f_reg, f_bold)
        c.showPage()
        c.save()
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    # Legacy sheets ('bgd_2025' 40+8+6 & 'classic_50' 2x25) with full DejaVu Unicode support
    c.setFillColor(colors.black)
    for anchor in geom["anchors"]:
        rx, ry, rw, rh = anchor["rect"]
        x_pt, y_pt = px_to_pt(rx, ry + rh)
        w_pt = rw / SCALE_X
        h_pt = rh / SCALE_Y
        c.rect(x_pt, y_pt, w_pt, h_pt, fill=1, stroke=0)

    # Orientation Marker (legacy templates only)
    ox_pt, oy_pt = px_to_pt(180, 135)
    c.rect(ox_pt, oy_pt, 40 / SCALE_X, 50 / SCALE_Y, fill=1, stroke=0)

    # Title & Text
    c.setFont(f_bold, 13.5)
    c.drawString(100, PT_H - 45, exam_title)
    c.setFont(f_reg, 8)
    c.drawString(100, PT_H - 58, "Hệ thống chấm thi trắc nghiệm tự động EduTest OMR - Quy chuẩn GDPT 2018")

    # Candidate Box
    c.rect(36, PT_H - 210, 275, 135, stroke=1, fill=0)
    c.setFont(f_bold, 9)
    c.drawString(45, PT_H - 90, "THÔNG TIN THÍ SINH")
    c.setFont(f_reg, 8)
    c.drawString(45, PT_H - 110, "Họ và tên: .....................................................................")
    c.drawString(45, PT_H - 130, "Ngày sinh: .............................. Lớp: ...........................")
    c.drawString(45, PT_H - 150, "Trường: ........................................................................")
    c.drawString(45, PT_H - 170, "Phòng thi: .................... Số báo danh: .......................")
    c.setFont(f_italic, 7)
    c.drawString(45, PT_H - 195, "* Lưu ý: Dùng bút chì 2B tô kín ô tròn. Không làm rách hoặc gấp phiếu.")

    # Student Code Table
    sbd_box_x, sbd_box_y = px_to_pt(980, 600)
    c.rect(sbd_box_x, sbd_box_y, 260 / SCALE_X, 390 / SCALE_Y, stroke=1, fill=0)
    c.setFont(f_bold, 8)
    c.drawCentredString(sbd_box_x + (130 / SCALE_X), sbd_box_y + (390 / SCALE_Y) - 14, "SỐ BÁO DANH")

    c.setLineWidth(0.6)
    for col_digits in geom["student_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont(f_reg, 6)
            c.drawCentredString(x_pt, y_pt - 2, item["digit"])

    # Exam Code Table
    exam_box_x, exam_box_y = px_to_pt(1300, 600)
    c.rect(exam_box_x, exam_box_y, 140 / SCALE_X, 390 / SCALE_Y, stroke=1, fill=0)
    c.setFont(f_bold, 8)
    c.drawCentredString(exam_box_x + (70 / SCALE_X), exam_box_y + (390 / SCALE_Y) - 14, "MÃ ĐỀ")

    for col_digits in geom["exam_code"]:
        for item in col_digits:
            x_pt, y_pt = px_to_pt(item["cx"], item["cy"])
            r_pt = item["r"] / SCALE_X
            c.circle(x_pt, y_pt, r_pt, stroke=1, fill=0)
            c.setFont(f_reg, 6)
            c.drawCentredString(x_pt, y_pt - 2, item["digit"])

    # Draw Content
    if "questions" in geom:
        for q_num, opts in geom["questions"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            c.setFont(f_bold, 7)
            c.drawRightString(first_pt_x - 14, first_pt_y - 2.5, f"Câu {q_num}:")
            for opt in opts:
                opt_x, opt_y = px_to_pt(opt["cx"], opt["cy"])
                r_pt = opt["r"] / SCALE_X
                c.circle(opt_x, opt_y, r_pt, stroke=1, fill=0)
                c.setFont(f_reg, 6.5)
                c.drawCentredString(opt_x, opt_y - 2, opt["label"])
    else:
        # Legacy BGD 2025: Part I, Part II, Part III
        c.setFont(f_bold, 8.5)
        c.drawString(36, PT_H - 250, "PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN (40 CÂU)")
        p1_x, p1_y = px_to_pt(90, 1460)
        c.rect(p1_x, p1_y, 780 / SCALE_X, 750 / SCALE_Y, stroke=1, fill=0)
        for q_num, opts in geom["part1"].items():
            first_pt_x, first_pt_y = px_to_pt(opts[0]["cx"], opts[0]["cy"])
            c.setFont(f_bold, 6.5)
            c.drawRightString(first_pt_x - 10, first_pt_y - 2, f"{q_num}.")
            for opt in opts:
                opt_x, opt_y = px_to_pt(opt["cx"], opt["cy"])
                r_pt = opt["r"] / SCALE_X
                c.circle(opt_x, opt_y, r_pt, stroke=1, fill=0)
                c.setFont(f_reg, 5.5)
                c.drawCentredString(opt_x, opt_y - 1.8, opt["label"])

        c.setFont(f_bold, 8.5)
        c.drawString(328, PT_H - 250, "PHẦN II: ĐÚNG / SAI (8 CÂU)")
        p2_x, p2_y = px_to_pt(900, 1460)
        c.rect(p2_x, p2_y, 650 / SCALE_X, 750 / SCALE_Y, stroke=1, fill=0)
        for q_num, sub_dict in geom["part2"].items():
            sample_sub = sub_dict["a"][0]
            _, q_pt_y = px_to_pt(sample_sub["cx"], sample_sub["cy"])
            c.setFont(f_bold, 7)
            c.drawString(335, q_pt_y + 10, f"Câu {q_num}:")
            for sub_lbl, bubbles in sub_dict.items():
                d_bub, s_bub = bubbles[0], bubbles[1]
                dx_pt, dy_pt = px_to_pt(d_bub["cx"], d_bub["cy"])
                sx_pt, sy_pt = px_to_pt(s_bub["cx"], s_bub["cy"])
                r_pt = d_bub["r"] / SCALE_X
                c.setFont(f_reg, 6)
                c.drawString(dx_pt - 10, dy_pt - 2, f"{sub_lbl})")
                c.circle(dx_pt, dy_pt, r_pt, stroke=1, fill=0)
                c.drawCentredString(dx_pt, dy_pt - 1.8, "Đ")
                c.circle(sx_pt, sy_pt, r_pt, stroke=1, fill=0)
                c.drawCentredString(sx_pt, sy_pt - 1.8, "S")

        c.setFont(f_bold, 8.5)
        c.drawString(36, PT_H - 538, "PHẦN III: TRẢ LỜI NGẮN / ĐIỀN SỐ (6 CÂU)")
        p3_x, p3_y = px_to_pt(90, 2240)
        c.rect(p3_x, p3_y, 1460 / SCALE_X, 725 / SCALE_Y, stroke=1, fill=0)
        for q_num, col_groups in geom["part3"].items():
            first_b = col_groups[0]["bubbles"][0]
            fx_pt, fy_pt = px_to_pt(first_b["cx"], first_b["cy"])
            c.setFont(f_bold, 6.5)
            c.drawString(fx_pt - 18, fy_pt + 8, f"Câu {q_num}")
            for c_info in col_groups:
                for b in c_info["bubbles"]:
                    bx_pt, by_pt = px_to_pt(b["cx"], b["cy"])
                    br_pt = b["r"] / SCALE_X
                    c.circle(bx_pt, by_pt, br_pt, stroke=1, fill=0)
                    c.setFont(f_reg, 5)
                    c.drawCentredString(bx_pt, by_pt - 1.5, b["label"])

    c.showPage()
    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def synthesize_filled_exam(
    geom: Dict[str, Any],
    student_code: str = "123456",
    exam_code: str = "101",
    answers_part1: Dict[str, str] = None,
    answers_part2: Dict[str, Dict[str, str]] = None,
    answers_part3: Dict[str, str] = None,
    noise_level: float = 0.05,
    rotation_deg: float = 0.0,
    simulate_erasures: bool = True
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Renders a realistic filled exam sheet with pencil marks, realistic pencil shading,
    optional erasures, and slight perspective distortion for end-to-end testing.
    """
    sheet = render_blank_sheet_image(geom)

    def fill_bubble(cx: int, cy: int, r: int, fill_prob: float = 0.90, intensity: int = 55):
        inner_r = max(2, int(r * 0.78))
        cv2.circle(sheet, (cx, cy), inner_r, (intensity, intensity, intensity), -1)
        for _ in range(8):
            jx = cx + random.randint(-int(inner_r * 0.6), int(inner_r * 0.6))
            jy = cy + random.randint(-int(inner_r * 0.6), int(inner_r * 0.6))
            cv2.circle(sheet, (jx, jy), max(1, int(inner_r * 0.3)), (intensity - 15, intensity - 15, intensity - 15), -1)

    def erase_bubble(cx: int, cy: int, r: int):
        inner_r = max(2, int(r * 0.75))
        cv2.circle(sheet, (cx, cy), inner_r, (190, 190, 190), -1)

    # 1. Fill Student Code
    sbd_cols = len(geom["student_code"])
    for col_idx, char in enumerate(student_code[:sbd_cols]):
        if char.isdigit():
            digit_val = int(char)
            target_bubble = geom["student_code"][col_idx][digit_val]
            fill_bubble(target_bubble["cx"], target_bubble["cy"], target_bubble["r"])

    # 2. Fill Exam Code
    exam_cols = len(geom["exam_code"])
    for col_idx, char in enumerate(exam_code[:exam_cols]):
        if char.isdigit():
            digit_val = int(char)
            target_bubble = geom["exam_code"][col_idx][digit_val]
            fill_bubble(target_bubble["cx"], target_bubble["cy"], target_bubble["r"])

    # 3. Fill Answers
    if "questions" in geom:
        answers = answers_part1 or {}
        for q_num, opts in geom["questions"].items():
            ans = answers.get(q_num)
            for opt in opts:
                if opt["label"] == ans:
                    fill_bubble(opt["cx"], opt["cy"], opt["r"])
                elif simulate_erasures and random.random() < 0.03:
                    erase_bubble(opt["cx"], opt["cy"], opt["r"])
    else:
        # BGD 2025
        p1_ans = answers_part1 or {}
        for q_num, opts in geom["part1"].items():
            ans = p1_ans.get(q_num)
            for opt in opts:
                if opt["label"] == ans:
                    fill_bubble(opt["cx"], opt["cy"], opt["r"])
                elif simulate_erasures and random.random() < 0.03:
                    erase_bubble(opt["cx"], opt["cy"], opt["r"])

        p2_ans = answers_part2 or {}
        for q_num, sub_dict in geom["part2"].items():
            q_res = p2_ans.get(q_num, {})
            for sub_lbl, bubbles in sub_dict.items():
                expected_tf = q_res.get(sub_lbl)
                exp_norm = "Đ" if str(expected_tf).upper() in ["D", "Đ", "TRUE", "T", "1"] else "S"
                for b in bubbles:
                    b_norm = "Đ" if str(b["label"]).upper() in ["D", "Đ", "TRUE", "T", "1"] else "S"
                    if b_norm == exp_norm:
                        fill_bubble(b["cx"], b["cy"], b["r"])

        p3_ans = answers_part3 or {}
        for q_num, col_groups in geom["part3"].items():
            val = str(p3_ans.get(q_num, "")).strip().replace(".", ",")
            if not val:
                continue
            if col_groups[0].get("type") == "char_col":
                for col_i, ch in enumerate(val[:len(col_groups)]):
                    for b in col_groups[col_i]["bubbles"]:
                        if b["label"] == ch:
                            fill_bubble(b["cx"], b["cy"], b["r"])
                            break
            else:
                if val.startswith("-"):
                    sign_bubble = col_groups[0]["bubbles"][0]
                    fill_bubble(sign_bubble["cx"], sign_bubble["cy"], sign_bubble["r"])
                    digits_only = val[1:]
                else:
                    digits_only = val

                digit_chars = [c for c in digits_only if c.isdigit()][:4]
                for col_i, dchar in enumerate(digit_chars):
                    dval = int(dchar)
                    digit_bubble = col_groups[col_i + 1]["bubbles"][dval]
                    fill_bubble(digit_bubble["cx"], digit_bubble["cy"], digit_bubble["r"])

    # Optional: Apply slight rotation / perspective skew
    if abs(rotation_deg) > 0.01:
        M = cv2.getRotationMatrix2D((TARGET_W / 2, TARGET_H / 2), rotation_deg, 1.0)
        sheet = cv2.warpAffine(sheet, M, (TARGET_W, TARGET_H), borderValue=(255, 255, 255))

    return sheet, {
        "student_code": student_code,
        "exam_code": exam_code,
        "part1": answers_part1 or {},
        "part2": answers_part2 or {},
        "part3": answers_part3 or {}
    }
