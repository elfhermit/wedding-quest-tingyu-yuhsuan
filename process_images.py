import os
from PIL import Image

def process_image(filepath):
    print(f"Processing: {filepath}")
    img = Image.open(filepath).convert("RGBA")
    datas = img.getdata()

    new_data = []
    # Tolerance for "white-ish" pixels
    tolerance = 240 
    
    for item in datas:
        # Check if the pixel is near-white (R, G, B > tolerance)
        if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
            new_data.append((255, 255, 255, 0)) # Set alpha to 0 (transparent)
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(filepath, "PNG")
    print(f"Successfully processed: {filepath}")

assets_dir = r"c:\Users\A9014\.gemini\antigravity\playground\twilight-aldrin\public\assets"
exclude_prefixes = ["bg_", "sunset_", "wedding_"]

for filename in os.listdir(assets_dir):
    if filename.endswith(".png"):
        should_process = True
        for prefix in exclude_prefixes:
            if filename.startswith(prefix):
                should_process = False
                break
        
        if should_process:
            process_image(os.path.join(assets_dir, filename))
