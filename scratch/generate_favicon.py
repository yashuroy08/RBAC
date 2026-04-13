from PIL import Image, ImageDraw, ImageOps
import os

def color_icon(input_path, output_png, output_ico):
    # Load image
    img = Image.open(input_path).convert("RGBA")
    
    # Crop the image to remove the watermark (watermark is at the bottom)
    # The icon seems to be in the upper 80% of the image
    width, height = img.size
    # Automatically find the bounding box of non-white pixels to crop
    # First, make white exactly white
    datas = img.getdata()
    newData = []
    for item in datas:
        # If it's very white, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # Get bounding box of the icon
    bbox = img.getbbox()
    if bbox:
        # Crop to icon only (this naturally removes the watermark text if it's separated)
        # But wait, if the watermark text is also non-white, we need to be careful.
        # Let's crop manually if we know the watermark is at the bottom.
        # usually watermarks are in the bottom 20%
        icon_img = img.crop((bbox[0], bbox[1], bbox[2], int(height * 0.85)))
        # Re-get bbox for the cropped version
        bbox_new = icon_img.getbbox()
        if bbox_new:
            icon_img = icon_img.crop(bbox_new)
    else:
        icon_img = img

    # Now color it.
    # Since we want different colors for shield and key, let's use flood fill or 
    # simple color replacement based on position.
    # Shield: #1E40AF (Blue 800)
    # Key: #F59E0B (Amber 500)
    
    # Convert to grayscale to work with masks
    gray = ImageOps.grayscale(icon_img)
    
    # Create a new RGBA image
    colored = Image.new("RGBA", icon_img.size, (255, 255, 255, 0))
    
    w, h = icon_img.size
    pixels = icon_img.load()
    colored_pixels = colored.load()
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a > 0: # If it was a black pixel (now it has transparency from my previous step)
                # Check if it's likely the key (center area) or shield (outer area)
                # This is a very rough heuristic. Key is centered horizontally.
                dist_from_center_x = abs(x - w/2)
                dist_from_center_y = abs(y - h/2)
                
                # The key is roughly in the middle third horizontally and center-ish vertically
                if dist_from_center_x < w * 0.15 and y > h * 0.25 and y < h * 0.75:
                    # Likely the key
                    colored_pixels[x, y] = (245, 158, 11, 255) # Amber 500
                else:
                    # Likely the shield
                    colored_pixels[x, y] = (30, 64, 175, 255) # Blue 800

    # Save PNG
    colored.save(output_png)
    
    # Save ICO (containing multiple sizes)
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    colored.save(output_ico, format='ICO', sizes=icon_sizes)

if __name__ == "__main__":
    input_file = r"C:\Users\hp\.gemini\antigravity\brain\59f7868b-c2ee-4f1a-9306-ec2dc3fcbf33\media__1776070134753.png"
    output_png = r"c:\Users\hp\RBAC\frontend\public\favicon.png"
    output_ico = r"c:\Users\hp\RBAC\frontend\public\favicon.ico"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_png), exist_ok=True)
    
    try:
        color_icon(input_file, output_png, output_ico)
        print(f"Success! Favicon created at {output_ico}")
    except Exception as e:
        print(f"Error: {e}")
