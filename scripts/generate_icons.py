import math
from PIL import Image, ImageDraw, ImageFilter

def create_bible_icon():
    # Render at 1024x1024 for pristine antialiasing
    S = 1024
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Shadow underneath
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    # Elliptical soft shadow
    s_draw.ellipse([140, 820, 884, 940], fill=(0, 0, 0, 160))
    shadow = shadow.filter(ImageFilter.GaussianBlur(35))
    img.paste(shadow, (0, 0), shadow)

    # 2. Main Bible Cover Dimensions
    # Front-facing elegant Bible
    x0, y0 = 180, 120
    x1, y1 = 844, 850
    radius = 64

    # Gilded Page edges (visible on right and bottom)
    page_offset = 36
    # Page block background
    page_img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(page_img)
    p_draw.rounded_rectangle(
        [x0 + page_offset, y0 + page_offset, x1 + page_offset, y1 + page_offset],
        radius=radius,
        fill=(245, 230, 180, 255)
    )
    # Page edge lines (gold textured lines)
    for i in range(x1 - 10, x1 + page_offset - 4, 4):
        p_draw.line([(i, y0 + 60), (i, y1 + 30)], fill=(217, 119, 6, 120), width=2)
    for j in range(y1 - 10, y1 + page_offset - 4, 4):
        p_draw.line([(x0 + 60, j), (x1 + 30, j)], fill=(217, 119, 6, 120), width=2)
    img.paste(page_img, (0, 0), page_img)

    # 3. Ribbon Bookmark (Cinta roja/escarlata que cuelga por abajo)
    ribbon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ribbon)
    # Ribbon hanging down
    rx = 480
    r_points = [
        (rx, y1 - 20),
        (rx + 64, y1 - 20),
        (rx + 64, y1 + 95),
        (rx + 32, y1 + 75),  # Notch
        (rx, y1 + 95)
    ]
    r_draw.polygon(r_points, fill=(185, 28, 28, 255))
    # Ribbon golden tip outline
    r_draw.line([(rx, y1 + 95), (rx + 32, y1 + 75), (rx + 64, y1 + 95)], fill=(245, 158, 11, 255), width=6)
    # Soft ribbon shadow
    r_shadow = ribbon.filter(ImageFilter.GaussianBlur(8))
    img.paste(r_shadow, (4, 8), r_shadow)
    img.paste(ribbon, (0, 0), ribbon)

    # 4. Front Cover Leather (Rich dark obsidian / dark espresso leather)
    cover = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(cover)
    c_draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(28, 25, 23, 255)) # stone-900

    # Spine binding strip on the left
    spine_w = 90
    c_draw.rounded_rectangle([x0, y0, x0 + spine_w, y1], radius=radius, fill=(20, 18, 16, 255))
    c_draw.rectangle([x0 + 40, y0, x0 + spine_w, y1], fill=(20, 18, 16, 255))
    # Gold spine ribs
    for ry in [260, 420, 580, 740]:
        c_draw.line([(x0 + 15, ry), (x0 + spine_w - 10, ry)], fill=(217, 119, 6, 220), width=6)
        c_draw.line([(x0 + 15, ry - 3), (x0 + spine_w - 10, ry - 3)], fill=(251, 191, 36, 240), width=2)

    # Spine separator line
    c_draw.line([(x0 + spine_w, y0 + 10), (x0 + spine_w, y1 - 10)], fill=(245, 158, 11, 180), width=4)

    # 5. Golden Filigree & Decorative Border on Cover
    inset = 28
    c_draw.rounded_rectangle(
        [x0 + spine_w + inset, y0 + inset, x1 - inset, y1 - inset],
        radius=radius - 20,
        outline=(217, 119, 6, 230),
        width=5
    )
    # Inner thin border
    inset2 = inset + 12
    c_draw.rounded_rectangle(
        [x0 + spine_w + inset2, y0 + inset2, x1 - inset2, y1 - inset2],
        radius=radius - 28,
        outline=(245, 158, 11, 160),
        width=2
    )

    # Corner corner florets / brackets
    cw = 30
    for cx, cy, dx, dy in [
        (x0 + spine_w + inset2 + 8, y0 + inset2 + 8, 1, 1),
        (x1 - inset2 - 8, y0 + inset2 + 8, -1, 1),
        (x0 + spine_w + inset2 + 8, y1 - inset2 - 8, 1, -1),
        (x1 - inset2 - 8, y1 - inset2 - 8, -1, -1)
    ]:
        c_draw.line([(cx, cy), (cx + dx * cw, cy)], fill=(251, 191, 36, 255), width=4)
        c_draw.line([(cx, cy), (cx, cy + dy * cw)], fill=(251, 191, 36, 255), width=4)

    # 6. Central Majestic Golden Latin Cross (✝)
    cross_cx = x0 + spine_w + (x1 - (x0 + spine_w)) // 2
    cross_cy = (y0 + y1) // 2 - 20

    # Cross dimensions
    vert_h = 320
    vert_w = 46
    horiz_w = 200
    horiz_h = 46
    cross_top = cross_cy - 120

    # Cross Glow
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse([cross_cx - 160, cross_cy - 160, cross_cx + 160, cross_cy + 160], fill=(245, 158, 11, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    cover.paste(glow, (0, 0), glow)

    # Cross drop shadow
    c_shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cs_draw = ImageDraw.Draw(c_shadow)
    cs_draw.rectangle([cross_cx - vert_w//2, cross_top, cross_cx + vert_w//2, cross_top + vert_h], fill=(0, 0, 0, 180))
    cs_draw.rectangle([cross_cx - horiz_w//2, cross_top + 70, cross_cx + horiz_w//2, cross_top + 70 + horiz_h], fill=(0, 0, 0, 180))
    c_shadow = c_shadow.filter(ImageFilter.GaussianBlur(12))
    cover.paste(c_shadow, (4, 8), c_shadow)

    # Draw gold cross base
    c_draw.rectangle([cross_cx - vert_w//2, cross_top, cross_cx + vert_w//2, cross_top + vert_h], fill=(217, 119, 6, 255))
    c_draw.rectangle([cross_cx - horiz_w//2, cross_top + 70, cross_cx + horiz_w//2, cross_top + 70 + horiz_h], fill=(217, 119, 6, 255))

    # Inner bright gold cross highlight
    bw = 6
    c_draw.rectangle([cross_cx - vert_w//2 + bw, cross_top + bw, cross_cx + vert_w//2 - bw, cross_top + vert_h - bw], fill=(251, 191, 36, 255))
    c_draw.rectangle([cross_cx - horiz_w//2 + bw, cross_top + 70 + bw, cross_cx + horiz_w//2 - bw, cross_top + 70 + horiz_h - bw], fill=(251, 191, 36, 255))

    # Center jewel / radiant highlight
    c_draw.ellipse([cross_cx - 14, cross_top + 70 + horiz_h//2 - 14, cross_cx + 14, cross_top + 70 + horiz_h//2 + 14], fill=(254, 243, 199, 255))

    # Combine cover onto main image
    img.paste(cover, (0, 0), cover)

    return img

if __name__ == '__main__':
    icon = create_bible_icon()
    # Save 512x512 PNG
    icon512 = icon.resize((512, 512), Image.Resampling.LANCZOS)
    icon256 = icon.resize((256, 256), Image.Resampling.LANCZOS)
    
    import os
    os.makedirs('build', exist_ok=True)
    os.makedirs('public', exist_ok=True)
    
    icon512.save('build/icon.png', format='PNG')
    icon256.save('public/icon.png', format='PNG')
    
    # Generate multi-resolution Windows ICO
    icon.save('build/icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    icon.save('public/icon.ico', format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print("Icons generated successfully!")
