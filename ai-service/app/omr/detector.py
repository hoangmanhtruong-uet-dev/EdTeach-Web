"""
OpenCV Document Edge & Anchor Detection for OMR Sheet.
Handles perspective transform, corner alignment, solid-anchor validation,
auto-scale resolution invariance, and 90°/180° auto-orientation.
"""

import math
from typing import Tuple, Optional, List
import cv2
import numpy as np
import structlog

logger = structlog.get_logger()


def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Sort 4 coordinates in consistent order:
    0: Top-Left
    1: Top-Right
    2: Bottom-Right
    3: Bottom-Left
    """
    pts = np.asarray(pts, dtype="float32").reshape((4, 2))
    rect = np.zeros((4, 2), dtype="float32")

    # Sum of coordinates: Top-Left has smallest sum, Bottom-Right has largest
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    # Difference (y - x): Top-Right has smallest diff, Bottom-Left has largest
    diff = np.diff(pts, axis=1)  # y - x
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]

    return rect


def _is_valid_sheet_quad(pts: np.ndarray, total_area: float) -> Tuple[bool, float]:
    """
    Checks whether ordered 4 corners [TL, TR, BR, BL] form a plausible sheet quad:
    - Convex polygon with sufficient enclosed area
    - Reasonable opposite edge balance & interior angles (40°..140°)
    - Plausible A4 / perspective aspect ratio
    Returns (is_valid, quad_area).
    """
    pts = np.asarray(pts, dtype="float32").reshape((4, 2))
    if not cv2.isContourConvex(pts):
        return False, 0.0

    quad_area = float(cv2.contourArea(pts))
    if quad_area < 0.08 * total_area:
        return False, 0.0

    # Edge lengths: top, right, bottom, left
    e_top = float(np.linalg.norm(pts[1] - pts[0]))
    e_right = float(np.linalg.norm(pts[2] - pts[1]))
    e_bot = float(np.linalg.norm(pts[2] - pts[3]))
    e_left = float(np.linalg.norm(pts[3] - pts[0]))

    if min(e_top, e_right, e_bot, e_left) < 20.0:
        return False, 0.0

    w_balance = min(e_top, e_bot) / max(e_top, e_bot)
    h_balance = min(e_left, e_right) / max(e_left, e_right)
    if w_balance < 0.50 or h_balance < 0.50:
        return False, 0.0

    # Check interior angles at all 4 corners
    for i in range(4):
        p_prev = pts[(i - 1) % 4]
        p_curr = pts[i]
        p_next = pts[(i + 1) % 4]
        v1 = p_prev - p_curr
        v2 = p_next - p_curr
        denom = float(np.linalg.norm(v1) * np.linalg.norm(v2))
        if denom < 1e-6:
            return False, 0.0
        cos_ang = np.clip(float(np.dot(v1, v2)) / denom, -1.0, 1.0)
        angle_deg = math.degrees(math.acos(cos_ang))
        if angle_deg < 45.0 or angle_deg > 135.0:
            return False, 0.0

    avg_w = 0.5 * (e_top + e_bot)
    avg_h = 0.5 * (e_left + e_right)
    aspect = max(avg_w, avg_h) / max(1.0, min(avg_w, avg_h))
    # A4 ratio is ~1.414; allow perspective distortion within [1.05, 2.2]
    if aspect < 1.05 or aspect > 2.2:
        return False, 0.0

    return True, quad_area


def _is_solid_anchor_core(gray: np.ndarray, x: int, y: int, w: int, h: int) -> bool:
    """
    Verifies that a candidate square bounding box is genuinely filled solid dark ink,
    rejecting hollow rectangular write-in boxes (such as SBD or Part III boxes).
    Works across dim and bright lighting by contrasting against local outer ring.
    """
    h_img, w_img = gray.shape

    # Inner core: shrunk 20% from each edge to exclude thin hollow borders
    pad_x = max(1, int(round(w * 0.20)))
    pad_y = max(1, int(round(h * 0.20)))
    ix1, iy1 = max(0, x + pad_x), max(0, y + pad_y)
    ix2, iy2 = min(w_img, x + w - pad_x), min(h_img, y + h - pad_y)
    if ix2 <= ix1 or iy2 <= iy1:
        core = gray[max(0, y):min(h_img, y + h), max(0, x):min(w_img, x + w)]
    else:
        core = gray[iy1:iy2, ix1:ix2]

    if core.size == 0:
        return False

    core_mean = float(np.mean(core))
    core_p80 = float(np.percentile(core, 80))

    # Measure brightness of surrounding paper ring
    ring_pad = max(4, int(round(max(w, h) * 0.65)))
    rx1, ry1 = max(0, x - ring_pad), max(0, y - ring_pad)
    rx2, ry2 = min(w_img, x + w + ring_pad), min(h_img, y + h + ring_pad)
    outer_patch = gray[ry1:ry2, rx1:rx2]

    # Mask out the inner square itself (plus 2px margin)
    mask = np.ones(outer_patch.shape, dtype=bool)
    mx1 = max(0, (x - 2) - rx1)
    my1 = max(0, (y - 2) - ry1)
    mx2 = min(outer_patch.shape[1], (x + w + 2) - rx1)
    my2 = min(outer_patch.shape[0], (y + h + 2) - ry1)
    mask[my1:my2, mx1:mx2] = False

    ring_pixels = outer_patch[mask]
    if ring_pixels.size < 10:
        outer_p75 = 240.0
    else:
        outer_p75 = float(np.percentile(ring_pixels, 75))

    # Solid black anchor must be markedly darker than nearby paper throughout its core
    if core_mean > 165.0:
        return False
    if (outer_p75 - core_mean) < 40.0:
        return False
    if (outer_p75 - core_p80) < 28.0:
        return False

    return True


def _extract_square_candidates(
    gray: np.ndarray,
    min_area: float,
    max_area: float
) -> List[Tuple[float, float, float, float]]:
    """
    Extracts solid black square anchor candidates: [(cX, cY, area, max_side), ...].
    Uses resolution-scaled adaptive thresholding and an Otsu fallback pass.
    """
    h_img, w_img = gray.shape
    total_area = float(h_img * w_img)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Scale blockSize with image resolution so high-DPI anchors (e.g. 300-400 DPI) do not hollow out
    scaled_block = int(round(min(h_img, w_img) * 0.045))
    block_size = max(25, min(101, scaled_block | 1))

    thresh_passes = [
        cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, 10
        )
    ]

    # Larger block pass (handles dark shadows or thicker anchors) + Otsu pass
    candidates: List[Tuple[float, float, float, float]] = []

    def scan_thresh(thresh_img: np.ndarray, eps_factor: float):
        # Use RETR_LIST (never RETR_EXTERNAL) so anchors inside a dark-desk paper border are never swallowed!
        contours, _ = cv2.findContours(thresh_img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        for c in contours:
            area = cv2.contourArea(c)
            if area < min_area or area > max_area or area > 0.05 * total_area:
                continue

            peri = cv2.arcLength(c, True)
            if peri <= 0:
                continue
            approx = cv2.approxPolyDP(c, eps_factor * peri, True)

            if len(approx) == 4:
                # Filter out circular filled OMR bubbles that degenerate into 4-gons at relaxed eps or skew
                (_, _), (rw, rh), _ = cv2.minAreaRect(c)
                rot_area = rw * rh
                if rot_area <= 0:
                    continue
                rot_extent = area / float(rot_area)
                if rot_extent < 0.82:
                    continue
                if min(rw, rh) / max(1.0, max(rw, rh)) < 0.65:
                    continue
                circularity = (4.0 * math.pi * area) / (peri * peri)
                if eps_factor > 0.045 and circularity > 0.86:
                    continue

                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = float(w) / max(1, h)
                if 0.68 <= aspect_ratio <= 1.45:
                    rect_area = w * h
                    solidity = area / float(rect_area) if rect_area > 0 else 0.0
                    if solidity >= 0.72 and _is_solid_anchor_core(gray, x, y, w, h):
                        M = cv2.moments(c)
                        if M["m00"] != 0:
                            cX = float(M["m10"] / M["m00"])
                            cY = float(M["m01"] / M["m00"])
                            # Deduplicate nearby detections across passes
                            side = float(max(w, h))
                            if not any(
                                abs(cX - ex[0]) < side * 0.6 and abs(cY - ex[1]) < side * 0.6
                                for ex in candidates
                            ):
                                candidates.append((cX, cY, float(area), side))

    scan_thresh(thresh_passes[0], 0.04)

    if len(candidates) < 4:
        _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
        scan_thresh(otsu, 0.04)

    if len(candidates) < 4:
        # Relax slightly for motion blur / rounded anchor corners at low res
        scan_thresh(thresh_passes[0], 0.06)

    return candidates


def _select_best_anchor_quad(
    candidates: List[Tuple[float, float, float, float]],
    w_img: int,
    h_img: int
) -> Optional[Tuple[np.ndarray, float]]:
    """
    Finds the best geometrically consistent 4-anchor quad among candidates.
    Prevents picking stray dark objects on a table over true corner anchors.
    Returns (ordered_pts [4x2], mean_anchor_side) or None.
    """
    if len(candidates) < 4:
        return None

    total_area = float(w_img * h_img)
    corners_target = [
        (0.0, 0.0),
        (float(w_img), 0.0),
        (float(w_img), float(h_img)),
        (0.0, float(h_img)),
    ]

    # Up to top 3 candidates closest to each corner
    pools: List[List[int]] = []
    for tx, ty in corners_target:
        ranked = sorted(
            range(len(candidates)),
            key=lambda idx: (candidates[idx][0] - tx) ** 2 + (candidates[idx][1] - ty) ** 2
        )
        pools.append(ranked[:3])

    best_score = -1e9
    best_result: Optional[Tuple[np.ndarray, float]] = None

    for i0 in pools[0]:
        for i1 in pools[1]:
            if i1 == i0:
                continue
            for i2 in pools[2]:
                if i2 in (i0, i1):
                    continue
                for i3 in pools[3]:
                    if i3 in (i0, i1, i2):
                        continue

                    chosen = [candidates[i0], candidates[i1], candidates[i2], candidates[i3]]
                    areas = [c[2] for c in chosen]
                    area_ratio = max(areas) / max(1.0, min(areas))
                    if area_ratio > 2.1:
                        continue

                    raw_pts = np.array([[c[0], c[1]] for c in chosen], dtype="float32")
                    ordered = order_points(raw_pts)
                    is_ok, quad_area = _is_valid_sheet_quad(ordered, total_area)
                    if not is_ok:
                        continue

                    # Aspect similarity bonus (A4 = 1.414)
                    e_top = float(np.linalg.norm(ordered[1] - ordered[0]))
                    e_bot = float(np.linalg.norm(ordered[2] - ordered[3]))
                    e_left = float(np.linalg.norm(ordered[3] - ordered[0]))
                    e_right = float(np.linalg.norm(ordered[2] - ordered[1]))
                    avg_w = 0.5 * (e_top + e_bot)
                    avg_h = 0.5 * (e_left + e_right)
                    aspect = max(avg_w, avg_h) / max(1.0, min(avg_w, avg_h))
                    aspect_err = abs(aspect - 1.414)

                    score = (
                        (quad_area / total_area) * 4.0
                        - 0.35 * (area_ratio - 1.0)
                        - 0.50 * aspect_err
                    )
                    if score > best_score:
                        best_score = score
                        mean_side = float(np.mean([c[3] for c in chosen]))
                        best_result = (ordered, mean_side)

    return best_result


def _try_recover_4th_anchor(
    gray: np.ndarray,
    candidates: List[Tuple[float, float, float, float]]
) -> Optional[Tuple[np.ndarray, float]]:
    """
    If exactly 3 true corner anchors are detected (and 1 corner was obscured/shadowed),
    checks if a faint anchor exists around the predicted 4th parallelogram corner.
    """
    if len(candidates) != 3:
        return None

    areas = [c[2] for c in candidates]
    if max(areas) / max(1.0, min(areas)) > 3.0:
        return None

    pts = np.array([[c[0], c[1]] for c in candidates], dtype="float32")
    mean_side = float(np.mean([c[3] for c in candidates]))
    mean_area = float(np.mean(areas))
    h_img, w_img = gray.shape

    # Identify which vertex is the right-angle pivot (~70°..110°) between the other 2
    best_p4 = None
    best_ang_err = 999.0
    for pivot in range(3):
        o1, o2 = (pivot + 1) % 3, (pivot + 2) % 3
        v1 = pts[o1] - pts[pivot]
        v2 = pts[o2] - pts[pivot]
        n1, n2 = float(np.linalg.norm(v1)), float(np.linalg.norm(v2))
        if n1 < 30.0 or n2 < 30.0:
            continue
        aspect = max(n1, n2) / min(n1, n2)
        if not (1.15 <= aspect <= 1.75):
            continue
        ang = math.degrees(math.acos(np.clip(float(np.dot(v1, v2)) / (n1 * n2), -1.0, 1.0)))
        ang_err = abs(ang - 90.0)
        if ang_err <= 22.0 and ang_err < best_ang_err:
            best_ang_err = ang_err
            best_p4 = pts[o1] + pts[o2] - pts[pivot]

    if best_p4 is None:
        return None

    px, py = float(best_p4[0]), float(best_p4[1])
    search_r = int(max(mean_side * 2.5, 0.05 * min(w_img, h_img)))
    rx1 = max(0, int(px - search_r))
    ry1 = max(0, int(py - search_r))
    rx2 = min(w_img, int(px + search_r))
    ry2 = min(h_img, int(py + search_r))
    if rx2 - rx1 < 12 or ry2 - ry1 < 12:
        return None

    patch = gray[ry1:ry2, rx1:rx2]
    _, otsu = cv2.threshold(cv2.GaussianBlur(patch, (3, 3), 0), 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    cnts, _ = cv2.findContours(otsu, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for c in cnts:
        area = cv2.contourArea(c)
        if not (0.35 * mean_area <= area <= 2.4 * mean_area):
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.06 * peri, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            if 0.65 <= (float(w) / max(1, h)) <= 1.50 and _is_solid_anchor_core(gray, rx1 + x, ry1 + y, w, h):
                M = cv2.moments(c)
                if M["m00"] != 0:
                    c4x = rx1 + float(M["m10"] / M["m00"])
                    c4y = ry1 + float(M["m01"] / M["m00"])
                    all4 = np.vstack([pts, np.array([[c4x, c4y]], dtype="float32")])
                    ordered = order_points(all4)
                    ok, _ = _is_valid_sheet_quad(ordered, float(h_img * w_img))
                    if ok:
                        return ordered, mean_side

    return None


def _find_anchor_marks_with_meta(
    gray: np.ndarray,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None
) -> Optional[Tuple[np.ndarray, float]]:
    h_img, w_img = gray.shape
    total_area = float(h_img * w_img)
    eff_min = float(min_area) if min_area is not None else max(36.0, 0.00004 * total_area)
    eff_max = float(max_area) if max_area is not None else 0.025 * total_area

    candidates = _extract_square_candidates(gray, eff_min, eff_max)
    res = _select_best_anchor_quad(candidates, w_img, h_img)
    if res is not None:
        return res

    if len(candidates) == 3:
        rec = _try_recover_4th_anchor(gray, candidates)
        if rec is not None:
            return rec

    return None


def find_anchor_marks(
    gray: np.ndarray,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None
) -> Optional[np.ndarray]:
    """
    Attempt to find 4 solid black square anchor markers printed at 4 corners.
    Returns sorted 4 center points (TL, TR, BR, BL) if found, else None.
    """
    res = _find_anchor_marks_with_meta(gray, min_area=min_area, max_area=max_area)
    return res[0] if res is not None else None


def find_paper_boundary(gray: np.ndarray) -> Optional[np.ndarray]:
    """
    Fallback Engine: Find the largest 4-sided contour (paper boundary).
    Tries multiple edge/contrast strategies to cope with wooden desks and light backgrounds.
    """
    h_img, w_img = gray.shape
    total_area = float(h_img * w_img)
    min_paper_area = 0.18 * total_area
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))

    edge_maps = []
    for low_t, high_t in [(35, 135), (20, 80)]:
        e = cv2.Canny(blurred, low_t, high_t)
        e = cv2.morphologyEx(e, cv2.MORPH_CLOSE, kernel_close)
        e = cv2.dilate(e, kernel_dilate, iterations=1)
        edge_maps.append(e)

    # Also add bright-paper Otsu mask for textured backgrounds
    _, otsu_paper = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    otsu_paper = cv2.morphologyEx(otsu_paper, cv2.MORPH_OPEN, kernel_close)
    edge_maps.append(otsu_paper)

    for edge_img in edge_maps:
        contours, _ = cv2.findContours(edge_img, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:8]

        for c in contours:
            area = cv2.contourArea(c)
            if area < min_paper_area:
                continue
            # Skip full-frame border contour (e.g. Otsu when entire frame is white paper)
            x_b, y_b, w_b, h_b = cv2.boundingRect(c)
            if w_b >= w_img - 2 and h_b >= h_img - 2 and area > 0.96 * total_area:
                continue

            for target_c in (c, cv2.convexHull(c)):
                peri = cv2.arcLength(target_c, True)
                for eps in (0.02, 0.03, 0.045):
                    approx = cv2.approxPolyDP(target_c, eps * peri, True)
                    if len(approx) == 4:
                        ordered = order_points(approx.reshape(4, 2).astype("float32"))
                        ok, _ = _is_valid_sheet_quad(ordered, total_area)
                        if ok:
                            return ordered

    return None


def _ensure_upright_orientation(warped: np.ndarray) -> np.ndarray:
    """
    Ensures the warped portrait sheet is upright (0° rather than 180° upside-down).
    Checks legacy top-left notch first, then 4-quadrant OMR bubble balance
    so notchless sheets both WITH Part III (Math/KHTN) and WITHOUT Part III (KHXH)
    flip reliably from 180° upside-down back to 0°.
    """
    h, w = warped.shape[:2]
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY) if len(warped.shape) == 3 else warped

    # Strategy 1: Legacy orientation notch near Top-Left [85:135, 180:220]
    # Require adjacent paper ring to stay bright so a localized corner shadow cannot trigger a false flip.
    if h >= 2300 and w >= 1600:
        notch_tl = float(np.mean(gray[85:135, 180:220]))
        ring_tl = float(np.mean(gray[85:135, 232:272]))
        notch_br = float(np.mean(gray[h - 135:h - 85, w - 220:w - 180]))
        ring_br = float(np.mean(gray[h - 135:h - 85, w - 272:w - 232]))
        if notch_tl < 95.0 and ring_tl > 165.0 and notch_br > 180.0:
            return warped
        if notch_br < 95.0 and ring_br > 165.0 and notch_tl > 180.0:
            return cv2.rotate(warped, cv2.ROTATE_180)

    # Strategy 2: 4-quadrant circular OMR bubble symmetry check
    # All upright layouts place SBD + Exam Code bubbles (90-110 circles) in TR while TL is info text (0-6 circles),
    # and bottom-left vs bottom-right are balanced (both ~0 on KHXH, or both ~70-125 on Math/KHTN/Classic).
    total_area = float(h * w)
    min_b = max(20.0, 0.00005 * total_area)
    max_b = max(300.0, 0.0006 * total_area)
    b_block = max(21, min(61, int(round(min(h, w) * 0.02)) | 1))

    def count_bubbles(roi: np.ndarray) -> int:
        if roi.size == 0:
            return 0
        th = cv2.adaptiveThreshold(roi, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, b_block, 8)
        cnts, _ = cv2.findContours(th, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        cnt = 0
        for c in cnts:
            a = cv2.contourArea(c)
            if min_b <= a <= max_b:
                _, _, bw, bh = cv2.boundingRect(c)
                if 0.68 <= (bw / max(1, bh)) <= 1.45:
                    peri = cv2.arcLength(c, True)
                    if peri > 0 and (4.0 * math.pi * a / (peri * peri)) >= 0.58:
                        cnt += 1
        return cnt

    y_top1, y_top2 = int(0.11 * h), int(0.35 * h)
    y_bot1, y_bot2 = int(0.65 * h), int(0.89 * h)
    x_l1, x_l2 = int(0.06 * w), int(0.49 * w)
    x_r1, x_r2 = int(0.51 * w), int(0.94 * w)

    tl_bubbles = count_bubbles(gray[y_top1:y_top2, x_l1:x_l2])
    tr_bubbles = count_bubbles(gray[y_top1:y_top2, x_r1:x_r2])
    bl_bubbles = count_bubbles(gray[y_bot1:y_bot2, x_l1:x_l2])
    br_bubbles = count_bubbles(gray[y_bot1:y_bot2, x_r1:x_r2])

    orientation_score = (tr_bubbles - tl_bubbles) + (br_bubbles - bl_bubbles)
    if orientation_score < -25:
        return cv2.rotate(warped, cv2.ROTATE_180)

    return warped


def detect_and_warp_sheet(
    image: np.ndarray,
    target_w: int = 1654,
    target_h: int = 2338,
    anchor_centers: Optional[np.ndarray] = None
) -> Tuple[np.ndarray, np.ndarray, str]:
    """
    Detects 4 corners and performs perspective transform.
    Supports both legacy synthetic anchors (110px margin center) and official A4
    5x5mm @ 8mm anchors (82.7px margin center), plus 90°/180° auto-orientation.
    Returns:
        warped: Transformed upright portrait image (target_w, target_h, 3)
        corners: Detected 4 corners in original image (4, 2)
        engine_used: "anchor_marks" or "paper_boundary" or "identity"
    """
    if image is None or image.size == 0:
        raise ValueError("Ảnh rỗng hoặc không hợp lệ")

    orig_h, orig_w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Engine 1: Anchor Marks
    anchor_res = _find_anchor_marks_with_meta(gray)
    mean_anchor_side = 0.0
    if anchor_res is not None:
        corners, mean_anchor_side = anchor_res
        engine_used = "anchor_marks"
    else:
        corners = None
        engine_used = "paper_boundary"

    # Engine 2: Paper Boundary
    if corners is None:
        corners = find_paper_boundary(gray)
        engine_used = "paper_boundary"

    # Engine 3: Identity fallback ONLY for full-page clean digital scans (no crop margin)
    if corners is None:
        aspect_p = orig_h / float(orig_w) if orig_w > 0 else 0.0
        aspect_l = orig_w / float(orig_h) if orig_h > 0 else 0.0
        if 1.25 <= aspect_p <= 1.55 or 1.25 <= aspect_l <= 1.55:
            corners = np.array([
                [0, 0],
                [orig_w - 1, 0],
                [orig_w - 1, orig_h - 1],
                [0, orig_h - 1]
            ], dtype="float32")
            engine_used = "identity"
        else:
            raise ValueError(
                "Không nhận diện được 4 góc của phiếu trắc nghiệm. "
                "Vui lòng đảm bảo chụp rõ 4 góc cữ hoặc đặt phiếu trên mặt bàn có độ tương phản."
            )

    # Check if paper in photo is rotated 90° sideways (landscape orientation)
    top_w = float(np.linalg.norm(corners[1] - corners[0]))
    bot_w = float(np.linalg.norm(corners[2] - corners[3]))
    left_h = float(np.linalg.norm(corners[3] - corners[0]))
    right_h = float(np.linalg.norm(corners[2] - corners[1]))
    avg_w = 0.5 * (top_w + bot_w)
    avg_h = 0.5 * (left_h + right_h)
    is_landscape = avg_w > avg_h * 1.15

    # Build portrait destination coordinates [TL, TR, BR, BL]
    if engine_used == "anchor_marks":
        if anchor_centers is not None:
            dst_portrait = np.asarray(anchor_centers, dtype="float32").reshape((4, 2))
        else:
            # Auto-detect official 5mm @ 8mm anchors (ratio ~0.018) vs legacy 80px @ 70px (ratio ~0.038)
            long_span = max(avg_w, avg_h, 1.0)
            anchor_ratio = mean_anchor_side / long_span
            if anchor_ratio < 0.028:
                # Official A4 PDF (5mm x 5mm square at 8mm margin -> center at 10.5mm)
                cx_l = (10.5 / 210.0) * target_w
                cx_r = ((210.0 - 10.5) / 210.0) * target_w
                cy_t = (10.5 / 297.0) * target_h
                cy_b = ((297.0 - 10.5) / 297.0) * target_h
            else:
                # Legacy synthetic canvas (margin 70px, size 80px -> center 110px)
                cx_l, cx_r = 110.0, float(target_w - 110)
                cy_t, cy_b = 110.0, float(target_h - 110)
            dst_portrait = np.array([
                [cx_l, cy_t],
                [cx_r, cy_t],
                [cx_r, cy_b],
                [cx_l, cy_b],
            ], dtype="float32")
    else:
        dst_portrait = np.array([
            [0.0, 0.0],
            [float(target_w - 1), 0.0],
            [float(target_w - 1), float(target_h - 1)],
            [0.0, float(target_h - 1)],
        ], dtype="float32")

    if is_landscape:
        # Rotate portrait dst 90° clockwise into (target_h x target_w) frame:
        # (x_p, y_p) -> (target_h - 1 - y_p, x_p), where portrait [TL, TR, BR, BL]
        # occupies landscape positions [TR, BR, BL, TL] respectively -> reorder to match `corners` [TL, TR, BR, BL]
        p_tl, p_tr, p_br, p_bl = dst_portrait
        dst_land = np.array([
            [float(target_h - 1) - p_bl[1], p_bl[0]],  # land TL <- portrait BL
            [float(target_h - 1) - p_tl[1], p_tl[0]],  # land TR <- portrait TL
            [float(target_h - 1) - p_tr[1], p_tr[0]],  # land BR <- portrait TR
            [float(target_h - 1) - p_br[1], p_br[0]],  # land BL <- portrait BR
        ], dtype="float32")
        M = cv2.getPerspectiveTransform(corners, dst_land)
        warped_land = cv2.warpPerspective(image, M, (target_h, target_w))
        warped = cv2.rotate(warped_land, cv2.ROTATE_90_COUNTERCLOCKWISE)
    else:
        M = cv2.getPerspectiveTransform(corners, dst_portrait)
        warped = cv2.warpPerspective(image, M, (target_w, target_h))

    warped = _ensure_upright_orientation(warped)
    return warped, corners, engine_used
