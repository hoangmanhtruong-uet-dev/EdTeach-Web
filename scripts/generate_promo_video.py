"""
Script to generate a 25-second high-definition promotional video for EdTeach v2.0.0
incorporating REAL web application screenshots in a sleek browser mockup!
Resolution: 1280x720, 30 FPS, 750 Frames
"""
import os
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH = 1280
HEIGHT = 720
FPS = 30
TOTAL_FRAMES = 750  # 25 seconds
PROMO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "promo_assets")
OUTPUT_PATH = os.path.join(PROMO_DIR, "edteach_v2_promo_25s.mp4")

# Load real screenshots
def load_and_prep_screenshot(filename, target_w=640, target_h=400):
    p = os.path.join(PROMO_DIR, filename)
    if os.path.exists(p):
        im = Image.open(p).convert("RGB")
        im = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
        return im
    return Image.new("RGB", (target_w, target_h), (30, 41, 59))

img_landing = load_and_prep_screenshot("01_real_landing_page.png")
img_grading = load_and_prep_screenshot("05_real_grading_room.png")
img_studio = load_and_prep_screenshot("04_real_exam_studio.png")
img_pricing = load_and_prep_screenshot("02_real_pricing_tiers.png")
img_dashboard = load_and_prep_screenshot("03_real_teacher_dashboard.png")

FONT_BOLD_PATH = "C:\\Windows\\Fonts\\segoeuib.ttf"
FONT_REGULAR_PATH = "C:\\Windows\\Fonts\\segoeui.ttf"
FONT_SEMIBOLD_PATH = "C:\\Windows\\Fonts\\segoeuisb.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

font_title = get_font(FONT_BOLD_PATH, 38)
font_subtitle = get_font(FONT_SEMIBOLD_PATH, 20)
font_body = get_font(FONT_REGULAR_PATH, 17)
font_badge = get_font(FONT_BOLD_PATH, 14)
font_tag = get_font(FONT_BOLD_PATH, 13)
font_cta = get_font(FONT_BOLD_PATH, 18)

SCENES = [
    {
        "id": 0,
        "badge": "PHIÊN BẢN v2.0.0 BETA (03/11 - 17/11/2026)",
        "badge_color": (16, 185, 129),
        "title": "EDUTEACH AI - NỀN TẢNG GIÁO DỤC",
        "subtitle": "Giải Pháp Trợ Lý AI Chuyển Đổi Số Toàn Diện",
        "bullets": [
            "⚡ Tối ưu 80% thời gian soạn đề & chấm kiểm tra",
            "🎯 Chuẩn hóa theo khung GDPT 2025 của Bộ GD&ĐT",
            "🚀 Giao diện trực quan, tốc độ xử lý tức thì"
        ],
        "screenshot": img_landing,
        "accent": (16, 185, 129)
    },
    {
        "id": 1,
        "badge": "TÍNH NĂNG 1: CHẤM THI THÔNG MINH",
        "badge_color": (6, 182, 212),
        "title": "Chấm Phiếu Trắc Nghiệm OMR 1s",
        "subtitle": "Biến Điện Thoại Thành Máy Quét Chấm Chuyên Nghiệp",
        "bullets": [
            "📷 Quét liên tục hàng chục bài không cần chạm máy",
            "⚡ Tự động nhận diện mã đề, tính điểm & lưu trữ",
            "🛡️ Hỗ trợ 4 định dạng: 4 lựa chọn, Đúng/Sai, Trả lời ngắn"
        ],
        "screenshot": img_grading,
        "accent": (6, 182, 212)
    },
    {
        "id": 2,
        "badge": "TÍNH NĂNG 2: AI EXAM STUDIO",
        "badge_color": (245, 158, 11),
        "title": "Soạn Đề Thông Minh & Live Clone",
        "subtitle": "Số Hóa Đề Từ PDF & Sinh Câu Hỏi Biến Thể Tức Thì",
        "bullets": [
            "📄 Trích xuất đề thi từ file PDF, ảnh chụp & link web",
            "🔄 Live Clone: Sinh câu hỏi biến thể chỉ với 1 chạm",
            "📐 Xuất file Word (DOCX) chuẩn form kèm lời giải chi tiết"
        ],
        "screenshot": img_studio,
        "accent": (245, 158, 11)
    },
    {
        "id": 3,
        "badge": "TÍNH NĂNG 3: BẢNG GIÁ & GÓI DỊCH VỤ",
        "badge_color": (168, 85, 247),
        "title": "Phân Tầng Gói Dịch Vụ Tối Ưu",
        "subtitle": "Gói FREE Đầy Đủ & Gói PRO/MAX Nâng Cao Chuyên Sâu",
        "bullets": [
            "🎁 FREE: Tạo đề cơ bản, chấm thủ công & tặng 5.000 credits",
            "💎 PRO: Chấm OMR tự động, số hóa từ URL web & xuất Word",
            "👑 MAX: Trợ lý giải toán đa phương pháp & bài tập bù đắp"
        ],
        "screenshot": img_pricing,
        "accent": (168, 85, 247)
    },
    {
        "id": 4,
        "badge": "THỬ NGHIỆM MIỄN PHÍ 2 TUẦN (03/11 - 17/11)",
        "badge_color": (239, 68, 68),
        "title": "Tham Gia Trải Nghiệm Ngay Hôm Nay!",
        "subtitle": "Đồng Hành Cùng Hơn 1.000+ Thầy Cô Đổi Mới Dạy Học",
        "bullets": [
            "🎁 Tặng ngay 5.000 Credits cho tài khoản mới",
            "💬 Nhóm Zalo hỗ trợ kỹ thuật trực tiếp từ Admin",
            "🔗 Link tham gia: zalo.me/g/e6xf6xhazoa18qiodfxr"
        ],
        "screenshot": img_dashboard,
        "accent": (16, 185, 129)
    }
]

def render_frame(frame_idx):
    frames_per_scene = TOTAL_FRAMES // len(SCENES)
    scene_idx = min(frame_idx // frames_per_scene, len(SCENES) - 1)
    scene_progress = (frame_idx % frames_per_scene) / frames_per_scene
    scene = SCENES[scene_idx]

    # Create dark canvas
    img = Image.new("RGB", (WIDTH, HEIGHT), (11, 15, 25))
    draw = ImageDraw.Draw(img)

    # Ambient glow
    accent_r, accent_g, accent_b = scene["accent"]
    glow_intensity = int(35 + 15 * math.sin(scene_progress * math.pi))
    for r in range(450, 0, -50):
        alpha = int((glow_intensity / 450.0) * (450 - r))
        glow_color = (
            min(255, 11 + int(accent_r * alpha / 255)),
            min(255, 15 + int(accent_g * alpha / 255)),
            min(255, 25 + int(accent_b * alpha / 255))
        )
        draw.ellipse([WIDTH - 350 - r, 300 - r, WIDTH - 350 + r, 300 + r], fill=glow_color)

    # Top Navbar
    draw.rectangle([0, 0, WIDTH, 65], fill=(15, 23, 42))
    draw.line([0, 65, WIDTH, 65], fill=(30, 41, 59), width=1)
    draw.text((40, 18), "EduTest AI", font=font_subtitle, fill=(255, 255, 255))
    
    badge_w = 110
    draw.rounded_rectangle([165, 20, 165 + badge_w, 46], radius=6, outline=scene["badge_color"], fill=(15, 23, 42), width=1)
    draw.text((177, 24), "v2.0.0 BETA", font=font_badge, fill=scene["badge_color"])
    draw.text((WIDTH - 360, 24), "Zalo: zalo.me/g/e6xf6xhazoa18qiodfxr", font=font_tag, fill=(148, 163, 184))

    # Entry transition (Slide Up)
    anim_factor = min(1.0, scene_progress * 4.0)
    offset_y = int(18 * (1.0 - anim_factor))

    # LEFT PANEL: Text & Highlights (Width 520px)
    left_x = 50

    # Badge Pill
    badge_text = scene["badge"]
    badge_bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    pill_w = badge_bbox[2] - badge_bbox[0] + 24
    pill_y = 100 + offset_y
    draw.rounded_rectangle([left_x, pill_y, left_x + pill_w, pill_y + 28], radius=14, fill=(20, 30, 50), outline=scene["badge_color"], width=1)
    draw.text((left_x + 12, pill_y + 5), badge_text, font=font_badge, fill=scene["badge_color"])

    # Title & Subtitle
    draw.text((left_x, 142 + offset_y), scene["title"], font=font_title, fill=(255, 255, 255))
    draw.text((left_x, 195 + offset_y), scene["subtitle"], font=font_subtitle, fill=(148, 163, 184))

    # Bullet points cards
    bullet_y = 250 + offset_y
    for b_idx, text in enumerate(scene["bullets"]):
        by = bullet_y + b_idx * 75
        # Card box
        draw.rounded_rectangle([left_x, by, left_x + 500, by + 62], radius=12, fill=(18, 26, 45), outline=(40, 53, 75), width=1)
        # Bullet indicator
        draw.ellipse([left_x + 16, by + 22, left_x + 34, by + 40], fill=scene["accent"])
        draw.text((left_x + 48, by + 18), text, font=font_body, fill=(241, 245, 249))

    # Bottom Call to Action inside left panel
    draw.rounded_rectangle([left_x, 505 + offset_y, left_x + 500, 570 + offset_y], radius=12, fill=(15, 23, 42), outline=scene["accent"], width=1)
    draw.text((left_x + 20, 523 + offset_y), "👉 Tham gia ngay Nhóm Zalo Giáo Viên để nhận quà tặng!", font=font_badge, fill=(52, 211, 153))

    # RIGHT PANEL: Browser Window Mockup with REAL Screenshot
    mockup_x = 580
    mockup_y = 105 + offset_y
    mockup_w = 650
    mockup_h = 475
    titlebar_h = 32

    # Outer browser window
    draw.rounded_rectangle([mockup_x - 1, mockup_y - 1, mockup_x + mockup_w + 1, mockup_y + mockup_h + 1], radius=16, fill=(15, 23, 42), outline=(51, 65, 85), width=2)

    # Titlebar
    draw.rounded_rectangle([mockup_x, mockup_y, mockup_x + mockup_w, mockup_y + titlebar_h], radius=16, fill=(30, 41, 59))
    draw.rectangle([mockup_x, mockup_y + 16, mockup_x + mockup_w, mockup_y + titlebar_h], fill=(30, 41, 59))

    # Traffic light dots
    draw.ellipse([mockup_x + 15, mockup_y + 10, mockup_x + 27, mockup_y + 22], fill=(239, 68, 68))
    draw.ellipse([mockup_x + 35, mockup_y + 10, mockup_x + 47, mockup_y + 22], fill=(245, 158, 11))
    draw.ellipse([mockup_x + 55, mockup_y + 10, mockup_x + 67, mockup_y + 22], fill=(16, 185, 129))

    # Simulated URL bar
    draw.rounded_rectangle([mockup_x + 90, mockup_y + 6, mockup_x + mockup_w - 20, mockup_y + 26], radius=6, fill=(15, 23, 42))
    draw.text((mockup_x + 105, mockup_y + 8), "https://ed-teach.vercel.app - Bản Web Thật v2.0", font=font_tag, fill=(100, 116, 139))

    # Paste real screenshot inside mockup
    ss_img = scene["screenshot"].resize((mockup_w, mockup_h - titlebar_h), Image.Resampling.LANCZOS)
    img.paste(ss_img, (mockup_x, mockup_y + titlebar_h))

    # Bottom Progress Bar
    overall_progress = frame_idx / TOTAL_FRAMES
    bar_width = int(WIDTH * overall_progress)
    draw.rectangle([0, HEIGHT - 7, WIDTH, HEIGHT], fill=(15, 23, 42))
    draw.rectangle([0, HEIGHT - 7, bar_width, HEIGHT], fill=scene["accent"])

    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

def main():
    print(f"Re-rendering promo video with REAL screenshots at {WIDTH}x{HEIGHT}...")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(OUTPUT_PATH, fourcc, FPS, (WIDTH, HEIGHT))

    for i in range(TOTAL_FRAMES):
        frame = render_frame(i)
        out.write(frame)
        if i % 100 == 0:
            print(f"Progress: {i}/{TOTAL_FRAMES} frames ({int(i*100/TOTAL_FRAMES)}%)")

    out.release()
    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"Enhanced promo video created successfully at: {OUTPUT_PATH} ({size_mb:.2f} MB)")

if __name__ == "__main__":
    main()
