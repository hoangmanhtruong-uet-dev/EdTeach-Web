"""
EduTest OMR (Optical Mark Recognition) Module.
High performance computer vision grading engine powered by OpenCV.
"""

from app.omr.detector import detect_and_warp_sheet, order_points
from app.omr.bubble_evaluator import (
    evaluate_single_choice,
    evaluate_digit_column,
    extract_bubble_stats
)
from app.omr.sheet_generator import (
    generate_printable_pdf,
    synthesize_filled_exam,
    build_bgd_2025_geometry,
    build_classic_50_geometry
)
from app.omr.template_matcher import (
    grade_exam_sheet,
    decode_image_base64,
    encode_image_base64
)

__all__ = [
    "detect_and_warp_sheet",
    "order_points",
    "evaluate_single_choice",
    "evaluate_digit_column",
    "extract_bubble_stats",
    "generate_printable_pdf",
    "synthesize_filled_exam",
    "build_bgd_2025_geometry",
    "build_classic_50_geometry",
    "grade_exam_sheet",
    "decode_image_base64",
    "encode_image_base64"
]

