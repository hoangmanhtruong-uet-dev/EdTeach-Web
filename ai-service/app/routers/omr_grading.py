"""
API Endpoints for High Performance Computer Vision OMR Grading with OpenCV.
"""

from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict, Any, List
import structlog
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel, Field

from app.core.dependencies import verify_internal_api_key
from app.omr.template_matcher import (
    grade_exam_sheet,
    decode_image_base64,
    GEOMETRIES
)
from app.omr.sheet_generator import generate_printable_pdf

logger = structlog.get_logger()

router = APIRouter(
    prefix="/ai/omr",
    tags=["OpenCV OMR Grading"],
    dependencies=[Depends(verify_internal_api_key)],
)


class SingleGradeRequest(BaseModel):
    image_base64: str = Field(..., description="Ảnh bài thi chụp từ camera hoặc scan (Base64 hoặc Data URI)")
    sheet_type: str = Field("bgd_2025", description="Mẫu phiếu: 'bgd_2025_math', 'bgd_2025_science', 'bgd_2025_social', 'sheet_20', 'sheet_40', 'sheet_50', 'bgd_2025' hoặc 'classic_50'")
    answer_key: Dict[str, Any] = Field(default_factory=dict, description="Đáp án chuẩn của đề thi")
    return_annotated_image: bool = Field(True, description="Có trả về ảnh nắn kèm vòng tròn xanh/đỏ/vàng không")


class BatchItemRequest(BaseModel):
    id: str = Field(..., description="ID bài thi hoặc tên file")
    image_base64: str = Field(..., description="Chuỗi Base64 ảnh")
    student_name: Optional[str] = Field(None, description="Tên học sinh nếu có")


class BatchGradeRequest(BaseModel):
    items: List[BatchItemRequest] = Field(..., description="Danh sách các ảnh bài thi cần chấm")
    sheet_type: str = Field("bgd_2025", description="Mẫu phiếu: 'bgd_2025_math', 'bgd_2025_science', 'bgd_2025_social', 'sheet_20', 'sheet_40', 'sheet_50', 'bgd_2025' hoặc 'classic_50'")
    answer_key: Dict[str, Any] = Field(default_factory=dict, description="Đáp án chuẩn")
    return_annotated_images: bool = Field(False, description="Có trả về ảnh annotated cho từng bài không")


class TemplatePdfRequest(BaseModel):
    sheet_type: str = Field("bgd_2025", description="Mẫu phiếu: 'bgd_2025_math', 'bgd_2025_science', 'bgd_2025_social', 'sheet_20', 'sheet_40', 'sheet_50', 'bgd_2025' hoặc 'classic_50'")
    exam_title: str = Field("KỲ THI TRẮC NGHIỆM ĐỊNH KỲ", description="Tiêu đề kỳ thi in trên đầu phiếu")
    school_name: Optional[str] = Field("TRƯỜNG THPT CHUYÊN EDU", description="Tên trường")


@router.get("/templates")
async def get_supported_templates():
    """Lấy danh sách các mẫu phiếu trắc nghiệm hệ thống hỗ trợ."""
    templates = []
    for k, geom in GEOMETRIES.items():
        if k == "bgd_2025_math":
            features = ["Phần I (12 câu MCQ)", "Phần II (4 câu Đúng/Sai)", "Phần III (6 câu Điền số chuẩn -/,)"]
        elif k == "bgd_2025_science":
            features = ["Phần I (18 câu MCQ)", "Phần II (4 câu Đúng/Sai)", "Phần III (6 câu Điền số chuẩn -/,)"]
        elif k == "bgd_2025_social":
            features = ["Phần I (24 câu MCQ)", "Phần II (4 câu Đúng/Sai)", "Không có Phần III (Khu chữ ký)"]
        elif k == "sheet_20":
            features = ["20 câu trắc nghiệm 4 lựa chọn (2 cột x 10 hàng, 0.5đ/câu)"]
        elif k == "sheet_40":
            features = ["40 câu trắc nghiệm 4 lựa chọn (4 cột x 10 hàng, 0.25đ/câu)"]
        elif k == "sheet_50":
            features = ["50 câu trắc nghiệm 4 lựa chọn (5 cột x 10 hàng, 0.2đ/câu)"]
        elif k == "bgd_2025":
            features = ["Phần I (40 câu MCQ)", "Phần II (8 câu Đúng/Sai)", "Phần III (6 câu Điền số)"]
        else:
            features = ["50 câu trắc nghiệm 4 lựa chọn (A, B, C, D)"]
        templates.append({
            "id": k,
            "name": geom.get("name"),
            "width": geom.get("width"),
            "height": geom.get("height"),
            "features": features
        })
    return {"templates": templates}


@router.post("/grade-single")
async def grade_single_sheet(req: SingleGradeRequest):
    """
    Chấm 1 bài thi trắc nghiệm bằng OpenCV:
    - Bắt 4 điểm neo cữ góc hoặc mép giấy A4.
    - Nắn phẳng góc phối cảnh (Perspective Transform).
    - Quét ô bong bóng, lọc vết tẩy mờ, tính điểm.
    - Trả về điểm, chi tiết từng câu, cờ cảnh báo và ảnh minh họa trực quan.
    """
    try:
        raw_img = decode_image_base64(req.image_base64)
    except Exception as e:
        logger.error("Decode image error", error=str(e))
        raise HTTPException(status_code=400, detail=f"Không thể giải mã dữ liệu ảnh: {str(e)}")

    try:
        result = grade_exam_sheet(
            raw_image=raw_img,
            sheet_type=req.sheet_type,
            answer_key=req.answer_key,
            generate_annotated_image=req.return_annotated_image
        )
        return {
            "status": "success",
            "data": result
        }
    except ValueError as ve:
        logger.warning("OMR processing warning", error=str(ve))
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception("OMR processing unexpected error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý ảnh OpenCV: {str(e)}")


def _process_batch_item(item: BatchItemRequest, sheet_type: str, answer_key: dict, return_annotated: bool):
    try:
        raw_img = decode_image_base64(item.image_base64)
        res = grade_exam_sheet(
            raw_image=raw_img,
            sheet_type=sheet_type,
            answer_key=answer_key,
            generate_annotated_image=return_annotated
        )
        return {
            "id": item.id,
            "student_name": item.student_name,
            "status": "success",
            "data": res
        }
    except Exception as e:
        return {
            "id": item.id,
            "student_name": item.student_name,
            "status": "error",
            "error": str(e)
        }


@router.post("/grade-batch")
async def grade_batch_sheets(req: BatchGradeRequest):
    """
    Chấm hàng loạt 50 - 100 bài thi song song bằng ThreadPoolExecutor đa luồng.
    Tốc độ cực nhanh: 50 bài chỉ mất 2 - 4 giây.
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="Danh sách ảnh rỗng")

    max_workers = min(16, len(req.items))
    results = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(
                _process_batch_item,
                item,
                req.sheet_type,
                req.answer_key,
                req.return_annotated_images
            )
            for item in req.items
        ]
        for f in futures:
            results.append(f.result())

    # Calculate overall class statistics
    scores = []
    flagged_sheets = []
    success_count = 0

    for r in results:
        if r["status"] == "success":
            success_count += 1
            sc = r["data"].get("total_score", 0.0)
            scores.append(sc)
            if r["data"].get("flagged_questions"):
                flagged_sheets.append({
                    "id": r["id"],
                    "student_code": r["data"].get("student_code"),
                    "flagged_count": len(r["data"]["flagged_questions"]),
                    "flags": r["data"]["flagged_questions"]
                })

    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    highest_score = max(scores) if scores else 0.0
    lowest_score = min(scores) if scores else 0.0

    return {
        "status": "success",
        "total_submitted": len(req.items),
        "success_count": success_count,
        "failed_count": len(req.items) - success_count,
        "statistics": {
            "average_score": avg_score,
            "highest_score": highest_score,
            "lowest_score": lowest_score,
            "flagged_sheets_count": len(flagged_sheets)
        },
        "flagged_sheets": flagged_sheets,
        "items": results
    }


@router.post("/generate-sheet-pdf")
async def generate_template_pdf(req: TemplatePdfRequest):
    """
    Sinh file PDF phiếu trắc nghiệm chuẩn in ấn A4 (ReportLab).
    Khớp 100% tọa độ với ma trận quét OpenCV.
    """
    if req.sheet_type not in GEOMETRIES:
        raise HTTPException(status_code=400, detail=f"Không hỗ trợ mẫu phiếu: {req.sheet_type}")

    geom = GEOMETRIES[req.sheet_type]
    pdf_bytes = generate_printable_pdf(geom, exam_title=req.exam_title)

    filename = f"phieu_trac_nghiem_{req.sheet_type}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

