"""
OMR Template Matcher & Exam Grader.
Coordinates corner detection, bubble evaluation, answer key scoring,
and visual overlay generation for BGD 2025 (Math/Science/Social), Unified MCQ (20/40/50), and legacy formats.
"""

import base64
from typing import Dict, Any, List, Optional, Tuple
import cv2
import numpy as np

from app.omr.detector import detect_and_warp_sheet
from app.omr.bubble_evaluator import (
    evaluate_single_choice,
    evaluate_digit_column,
    extract_bubble_stats
)
from app.omr.sheet_generator import (
    build_bgd_2025_geometry,
    build_bgd_2025_math_geometry,
    build_bgd_2025_science_geometry,
    build_bgd_2025_social_geometry,
    build_sheet_20_geometry,
    build_sheet_40_geometry,
    build_sheet_50_geometry,
    build_classic_50_geometry,
    TARGET_W,
    TARGET_H
)

def normalize_tf(val: Any) -> str:
    """Normalizes True/False variants ('D', 'Đ', 'TRUE', 'T', '1' -> 'Đ'; 'S', 'FALSE', 'F', '0' -> 'S')."""
    v = str(val or "").strip().upper()
    if v in ["D", "Đ", "TRUE", "T", "1"]:
        return "Đ"
    if v in ["S", "FALSE", "F", "0"]:
        return "S"
    return v


def normalize_short_answer(val: Any) -> str:
    """Normalizes Vietnamese comma/dot decimal numbers (e.g. '-2,5' == '-2.5')."""
    s = str(val or "").strip().replace(" ", "").replace(",", ".")
    if s.startswith("+"):
        s = s[1:]
    if not s:
        return ""
    try:
        num = float(s)
        # Keep stable numeric formatting if valid float (avoiding '-0.0')
        if num == 0:
            return "0"
        return f"{num:g}"
    except ValueError:
        return s


def _normalize_2025_answer_key(
    answer_key: Dict[str, Any],
    p1_count: int,
    p2_count: int,
    p3_count: int
) -> Tuple[Dict[str, str], Dict[str, Dict[str, str]], Dict[str, str]]:
    """Supports both nested {'part1', 'part2', 'part3'} and flat {'1': 'A', ..., '13': 'Đ-S-Đ-S', '17': '-2.5'}."""
    if any(k in answer_key for k in ("part1", "part2", "part3")):
        return (
            answer_key.get("part1", {}) or {},
            answer_key.get("part2", {}) or {},
            answer_key.get("part3", {}) or {},
        )

    part1_key: Dict[str, str] = {}
    part2_key: Dict[str, Dict[str, str]] = {}
    part3_key: Dict[str, str] = {}

    for i in range(1, p1_count + 1):
        val = answer_key.get(str(i), answer_key.get(i))
        if val is not None:
            part1_key[str(i)] = str(val)

    for idx in range(1, p2_count + 1):
        flat_q = p1_count + idx
        val = answer_key.get(str(flat_q), answer_key.get(flat_q))
        if isinstance(val, dict):
            part2_key[str(idx)] = val
        elif isinstance(val, str) and val.strip():
            parts = [p.strip() for p in val.replace(",", "-").split("-") if p.strip()]
            part2_key[str(idx)] = {
                lbl: parts[j] for j, lbl in enumerate(["a", "b", "c", "d"]) if j < len(parts)
            }

    for idx in range(1, p3_count + 1):
        flat_q = p1_count + p2_count + idx
        val = answer_key.get(str(flat_q), answer_key.get(flat_q))
        if val is not None:
            part3_key[str(idx)] = str(val)

    return part1_key, part2_key, part3_key


GEOMETRIES = {
    "bgd_2025": build_bgd_2025_geometry(),
    "bgd_2025_math": build_bgd_2025_math_geometry(),
    "bgd_2025_science": build_bgd_2025_science_geometry(),
    "bgd_2025_social": build_bgd_2025_social_geometry(),
    "sheet_20": build_sheet_20_geometry(),
    "sheet_40": build_sheet_40_geometry(),
    "sheet_50": build_sheet_50_geometry(),
    "classic_50": build_classic_50_geometry()
}


def get_template_geometry(sheet_type: str) -> Dict[str, Any]:
    if sheet_type not in GEOMETRIES:
        raise ValueError(f"Không hỗ trợ mẫu phiếu: {sheet_type}. Hỗ trợ: {list(GEOMETRIES.keys())}")
    return GEOMETRIES[sheet_type]


def decode_image_base64(image_base64: str) -> np.ndarray:
    """Decodes data URI or raw base64 string to OpenCV BGR image."""
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    img_bytes = base64.b64decode(image_base64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Không thể giải mã dữ liệu ảnh base64")
    return img


def encode_image_base64(img: np.ndarray, quality: int = 85) -> str:
    """Encodes OpenCV image to Base64 JPEG string."""
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    _, buffer = cv2.imencode(".jpg", img, encode_param)
    return base64.b64encode(buffer).decode("utf-8")


def grade_exam_sheet(
    raw_image: np.ndarray,
    sheet_type: str = "bgd_2025",
    answer_key: Dict[str, Any] = None,
    generate_annotated_image: bool = True
) -> Dict[str, Any]:
    """
    Main OMR Grading Pipeline:
    1. Detect corners and warp perspective to standard canvas (1654 x 2338).
    2. Extract Student Code (SBD) and Exam Code.
    3. Evaluate answers based on sheet_type geometry.
    4. Calculate scores based on Ministry of Education 2025 rules or Classic rules.
    5. Generate annotated image with visual color cues.
    """
    geom = get_template_geometry(sheet_type)
    answer_key = answer_key or {}

    # Step 1: Perspective Warp aligned precisely to template anchors
    anchor_centers = geom.get("anchor_centers")
    if anchor_centers is None and geom.get("anchors"):
        anchor_centers = [
            [a["rect"][0] + a["rect"][2] / 2.0, a["rect"][1] + a["rect"][3] / 2.0]
            for a in geom["anchors"]
        ]
    warped, detected_corners, engine_used = detect_and_warp_sheet(
        raw_image,
        target_w=TARGET_W,
        target_h=TARGET_H,
        anchor_centers=anchor_centers
    )

    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    annotated = warped.copy() if generate_annotated_image else None

    # Step 2: Read Student Code (SBD)
    detected_sbd_digits = []
    sbd_confidence_total = 0.0
    for col_digits in geom["student_code"]:
        col_r = col_digits[0]["r"] if col_digits else geom["bubble_radius"]
        opts = [(item["digit"], item["cx"], item["cy"]) for item in col_digits]
        d_val, d_conf, d_coord = evaluate_digit_column(gray, opts, radius=col_r)
        detected_sbd_digits.append(d_val if d_val is not None else "?")
        sbd_confidence_total += d_conf
        if annotated is not None and d_coord:
            cv2.circle(annotated, d_coord, col_r + 2, (255, 140, 0), 2)  # Blue-orange circle

    student_code = "".join(detected_sbd_digits)

    # Step 3: Read Exam Code
    detected_exam_digits = []
    for col_digits in geom["exam_code"]:
        col_r = col_digits[0]["r"] if col_digits else geom["bubble_radius"]
        opts = [(item["digit"], item["cx"], item["cy"]) for item in col_digits]
        d_val, _, d_coord = evaluate_digit_column(gray, opts, radius=col_r)
        detected_exam_digits.append(d_val if d_val is not None else "?")
        if annotated is not None and d_coord:
            cv2.circle(annotated, d_coord, col_r + 2, (255, 140, 0), 2)

    exam_code = "".join(detected_exam_digits)

    # Step 4: Evaluate Questions
    flagged_questions = []

    if "questions" in geom:
        results = {}
        correct_count = 0
        total_questions = len(geom["questions"])
        pt_per_q = round(10.0 / total_questions, 4)

        for q_num, opts in geom["questions"].items():
            q_radius = opts[0]["r"] if opts else geom["bubble_radius"]
            opts_coords = [(opt["label"], opt["cx"], opt["cy"]) for opt in opts]
            eval_res = evaluate_single_choice(gray, opts_coords, radius=q_radius)

            selected = eval_res["selected"]
            flag = eval_res["flag"]
            correct_ans = answer_key.get(str(q_num), "").strip().upper()
            is_correct = (selected == correct_ans) if (selected and correct_ans) else False

            if is_correct:
                correct_count += 1

            if flag in ["DOUBLE_MARK", "LIGHT_MARK"]:
                flagged_questions.append({
                    "section": "MCQ",
                    "question": q_num,
                    "flag": flag,
                    "warning": eval_res.get("warning", ""),
                    "scores": eval_res["all_scores"]
                })

            results[str(q_num)] = {
                "selected": selected,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "flag": flag,
                "score": pt_per_q if is_correct else 0.0
            }

            # Visual Annotation
            if annotated is not None:
                # Highlight correct answer with green ring
                for opt in opts:
                    if opt["label"] == correct_ans:
                        cv2.circle(annotated, (opt["cx"], opt["cy"]), opt["r"] + 3, (0, 180, 0), 2)
                # Highlight student choice
                if eval_res["selected_coord"]:
                    scx, scy = eval_res["selected_coord"]
                    if is_correct:
                        cv2.circle(annotated, (scx, scy), q_radius, (0, 220, 0), -1)  # Green filled
                    else:
                        cv2.circle(annotated, (scx, scy), q_radius, (0, 0, 220), -1)  # Red filled
                if flag == "DOUBLE_MARK":
                    pad = max(12, q_radius)
                    cv2.rectangle(
                        annotated,
                        (opts[0]["cx"] - pad, opts[0]["cy"] - pad),
                        (opts[-1]["cx"] + pad, opts[-1]["cy"] + pad),
                        (0, 215, 255),  # Yellow bounding box
                        2
                    )

        total_score = round(correct_count * (10.0 / total_questions), 2)
        summary = {
            "sheet_type": sheet_type,
            "student_code": student_code,
            "exam_code": exam_code,
            "total_score": total_score,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "results": results,
            "flagged_questions": flagged_questions,
            "engine_used": engine_used
        }

    else:
        # BGD 2025 (both legacy 40+8+6 and official bgd_2025_math 12+4+6)
        part1_key, part2_key, part3_key = _normalize_2025_answer_key(
            answer_key,
            len(geom["part1"]),
            len(geom["part2"]),
            len(geom["part3"]),
        )
        part1_pt = float(geom.get("part1_points", 0.25))
        part3_pt = float(geom.get("part3_points", 0.25))

        # Part I
        part1_results = {}
        part1_correct = 0
        for q_num, opts in geom["part1"].items():
            opts_coords = [(opt["label"], opt["cx"], opt["cy"]) for opt in opts]
            eval_res = evaluate_single_choice(gray, opts_coords, radius=opts[0]["r"])
            selected = eval_res["selected"]
            correct_ans = str(part1_key.get(str(q_num), "")).strip().upper()
            is_correct = (selected == correct_ans) if (selected and correct_ans) else False
            if is_correct:
                part1_correct += 1

            if eval_res["flag"] in ["DOUBLE_MARK", "LIGHT_MARK"]:
                flagged_questions.append({
                    "section": "Part I",
                    "question": q_num,
                    "flag": eval_res["flag"],
                    "warning": eval_res.get("warning", ""),
                    "scores": eval_res["all_scores"]
                })

            part1_results[str(q_num)] = {
                "selected": selected,
                "correct_answer": correct_ans,
                "is_correct": is_correct,
                "flag": eval_res["flag"],
                "score": part1_pt if is_correct else 0.0
            }

            if annotated is not None:
                for opt in opts:
                    if opt["label"] == correct_ans:
                        cv2.circle(annotated, (opt["cx"], opt["cy"]), opt["r"] + 3, (0, 180, 0), 2)
                if eval_res["selected_coord"]:
                    scx, scy = eval_res["selected_coord"]
                    color = (0, 220, 0) if is_correct else (0, 0, 220)
                    cv2.circle(annotated, (scx, scy), opts[0]["r"], color, -1)
                if eval_res["flag"] == "DOUBLE_MARK":
                    cv2.rectangle(
                        annotated,
                        (opts[0]["cx"] - 12, opts[0]["cy"] - 15),
                        (opts[-1]["cx"] + 12, opts[-1]["cy"] + 15),
                        (0, 215, 255),
                        2
                    )

        # Part II (Progressive Scoring: 0.1, 0.25, 0.5, 1.0)
        part2_results = {}
        part2_total_score = 0.0
        for q_num, sub_dict in geom["part2"].items():
            q_key = part2_key.get(str(q_num), {})
            sub_res = {}
            correct_subs = 0

            for sub_lbl, bubbles in sub_dict.items():
                opts_coords = [(b["label"], b["cx"], b["cy"]) for b in bubbles]
                eval_res = evaluate_single_choice(gray, opts_coords, radius=bubbles[0]["r"])
                sel_norm = normalize_tf(eval_res["selected"])
                exp_key = normalize_tf(q_key.get(sub_lbl, ""))

                is_sub_correct = (sel_norm == exp_key) if (sel_norm and exp_key) else False
                if is_sub_correct:
                    correct_subs += 1

                sub_res[sub_lbl] = {
                    "selected": eval_res["selected"],
                    "correct": exp_key,
                    "is_correct": is_sub_correct,
                    "flag": eval_res["flag"]
                }

                if annotated is not None:
                    for b in bubbles:
                        if b["label"] == exp_key:
                            cv2.circle(annotated, (b["cx"], b["cy"]), b["r"] + 2, (0, 180, 0), 2)
                    if eval_res["selected_coord"]:
                        scx, scy = eval_res["selected_coord"]
                        cv2.circle(annotated, (scx, scy), bubbles[0]["r"], (0, 220, 0) if is_sub_correct else (0, 0, 220), -1)

            scores_map = {0: 0.0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1.0}
            q_score = scores_map.get(correct_subs, 0.0)
            part2_total_score += q_score

            part2_results[str(q_num)] = {
                "sub_items": sub_res,
                "correct_subs_count": correct_subs,
                "score": q_score
            }

        # Part III: Short Answer / Number Match
        part3_results = {}
        part3_correct = 0
        for q_num, col_groups in geom["part3"].items():
            exp_ans = str(part3_key.get(str(q_num), "")).strip()
            selected_coords = []

            if col_groups[0].get("type") == "char_col":
                chars = []
                for c_info in col_groups:
                    col_opts = [(b["label"], b["cx"], b["cy"]) for b in c_info["bubbles"]]
                    col_r = c_info["bubbles"][0]["r"]
                    eval_res = evaluate_single_choice(gray, col_opts, radius=col_r)
                    if eval_res["selected"] is not None:
                        chars.append(eval_res["selected"])
                        if eval_res["selected_coord"]:
                            selected_coords.append((eval_res["selected_coord"], col_r))
                        if eval_res["flag"] == "DOUBLE_MARK":
                            flagged_questions.append({
                                "section": "Part III",
                                "question": q_num,
                                "flag": "DOUBLE_MARK",
                                "warning": eval_res.get("warning", ""),
                                "scores": eval_res["all_scores"]
                            })
                detected_val = "".join(chars)
            else:
                # Legacy 5-col layout: sign col + 4 digit cols
                sign_opts = [(b["label"], b["cx"], b["cy"]) for b in col_groups[0]["bubbles"]]
                sign_eval = evaluate_single_choice(gray, sign_opts, radius=12)
                detected_sign = sign_eval["selected"] if sign_eval["selected"] else ""
                digit_chars = []
                for col_i in range(1, len(col_groups)):
                    col_opts = [(b["label"], b["cx"], b["cy"]) for b in col_groups[col_i]["bubbles"]]
                    d_val, _, d_coord = evaluate_digit_column(gray, col_opts, radius=10)
                    if d_val is not None:
                        digit_chars.append(d_val)
                        if d_coord:
                            selected_coords.append((d_coord, 10))
                detected_val = (detected_sign if detected_sign == "-" else "") + "".join(digit_chars)

            norm_det = normalize_short_answer(detected_val)
            norm_exp = normalize_short_answer(exp_ans)
            is_match = (norm_det == norm_exp) if (norm_det and norm_exp) else False
            if is_match:
                part3_correct += 1

            if annotated is not None:
                for (dcx, dcy), dr in selected_coords:
                    color = (0, 220, 0) if is_match else (0, 0, 220)
                    cv2.circle(annotated, (dcx, dcy), dr, color, 2)

            part3_results[str(q_num)] = {
                "selected": detected_val,
                "correct_answer": exp_ans,
                "is_correct": is_match,
                "score": part3_pt if is_match else 0.0
            }

        part1_score = round(part1_correct * part1_pt, 2)
        part3_score = round(part3_correct * part3_pt, 2)
        total_score = round(part1_score + part2_total_score + part3_score, 2)

        summary = {
            "sheet_type": sheet_type,
            "student_code": student_code,
            "exam_code": exam_code,
            "total_score": total_score,
            "scores_by_section": {
                "part1_score": part1_score,
                "part2_score": round(part2_total_score, 2),
                "part3_score": part3_score
            },
            "part1_results": part1_results,
            "part2_results": part2_results,
            "part3_results": part3_results,
            "flagged_questions": flagged_questions,
            "engine_used": engine_used
        }

    if annotated is not None:
        summary["annotated_image_base64"] = encode_image_base64(annotated, quality=80)

    return summary
