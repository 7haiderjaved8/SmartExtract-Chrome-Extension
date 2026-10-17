import os
from PIL import Image, ImageDraw

os.makedirs("icons", exist_ok=True)

def create_icon(size):
    # Create image with RGBA
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    s = size / 128.0
    
    # Background rounded rect
    # Deep navy background #0F172A
    corner_radius = int(24 * s)
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        fill=(15, 23, 42, 255),
        outline=(20, 184, 166, 255),
        width=max(1, int(3 * s))
    )
    
    # Draw glowing teal scanner / extraction layers
    # Outer diamond / target ring or extraction chevron
    teal_glow = (0, 242, 254, 255)
    teal_dark = (13, 148, 136, 255)
    
    # Top layer (data shelf / document)
    margin = int(24 * s)
    top_w = size - 2 * margin
    
    # Draw 3 stacked data shelves with a laser/target beam
    # Shelf 1
    y1 = int(32 * s)
    h_bar = max(2, int(8 * s))
    draw.rounded_rectangle(
        [(margin, y1), (size - margin, y1 + h_bar)],
        radius=max(1, int(4 * s)),
        fill=teal_dark
    )
    
    # Shelf 2
    y2 = int(50 * s)
    draw.rounded_rectangle(
        [(margin + int(8 * s), y2), (size - margin - int(8 * s), y2 + h_bar)],
        radius=max(1, int(4 * s)),
        fill=(20, 184, 166, 255)
    )
    
    # Bottom Extraction Spark / Pointer
    # A lightning bolt / extraction arrow
    cx = size // 2
    arrow_pts = [
        (cx, int(106 * s)),
        (cx - int(18 * s), int(74 * s)),
        (cx - int(4 * s), int(74 * s)),
        (cx - int(7 * s), int(64 * s)),
        (cx + int(18 * s), int(64 * s)),
        (cx + int(4 * s), int(78 * s)),
        (cx + int(14 * s), int(78 * s)),
    ]
    draw.polygon(arrow_pts, fill=teal_glow)
    
    return img

for sz in [16, 32, 48, 128]:
    icon = create_icon(sz)
    icon.save(f"icons/icon{sz}.png")
    print(f"Generated icons/icon{sz}.png")

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="navyBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B132B" />
      <stop offset="100%" stop-color="#1C2541" />
    </linearGradient>
    <linearGradient id="tealGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F2FE" />
      <stop offset="100%" stop-color="#14B8A6" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect x="2" y="2" width="124" height="124" rx="24" fill="url(#navyBg)" stroke="#14B8A6" stroke-width="3" />
  <rect x="24" y="30" width="80" height="9" rx="4.5" fill="#0D9488" />
  <rect x="32" y="48" width="64" height="9" rx="4.5" fill="#14B8A6" />
  <polygon points="64,106 46,74 60,74 57,64 82,64 68,78 78,78" fill="url(#tealGlow)" filter="url(#glow)" />
</svg>"""

with open("icons/icon.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)
print("Generated icons/icon.svg")
