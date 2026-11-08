import os
from PIL import Image

paths = [
    (r"C:/Users/ADMIN/.gemini/antigravity/brain/e2d44b3c-49d0-4fcb-9b49-34c1612ee2b1/.user_uploaded/media_1793654074056_26c39051.png", "web_cropped_01_phong_thi_nghiem_3d.png"),
    (r"C:/Users/ADMIN/.gemini/antigravity/brain/e2d44b3c-49d0-4fcb-9b49-34c1612ee2b1/.user_uploaded/media_1793654082405_df432c2b.png", "web_cropped_02_whiteboard_buc_giang.png"),
    (r"C:/Users/ADMIN/.gemini/antigravity/brain/e2d44b3c-49d0-4fcb-9b49-34c1612ee2b1/.user_uploaded/media_1793654086401_dbe1b760.png", "web_cropped_03_cho_de_thi_marketplace.png")
]

output_dir = r"D:\Go-Live\Web\EdTeach\promo_assets"

# Crop boundaries:
# left=136 (cuts off Chrome vertical tab strip on left)
# top=33 (cuts off Chrome tabs, address bar, bookmarks)
# right=1020 (cuts off browser right border / scrollbar)
# bottom=543 (cuts off Windows taskbar at bottom)
box = (136, 33, 1020, 543)

for src, out_name in paths:
    im = Image.open(src)
    cropped = im.crop(box)
    out_path = os.path.join(output_dir, out_name)
    cropped.save(out_path, format="PNG", optimize=True)
    print(f"Saved {out_name}: size={cropped.size}, saved to {out_path}")
