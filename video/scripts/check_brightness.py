# 亮度自查：每秒抽一帧，量「聚光区域」（以画面中心偏下 (960,560) 为圆心、半径 528px＝聚光半径的一半）的平均亮度，以及四角 120×120 的平均亮度。
# 用法（在 video/ 里）：python3 scripts/check_brightness.py out/xxx.mp4 [起始秒]
import subprocess, sys, tempfile, glob, os
from PIL import Image, ImageDraw, ImageStat
src = sys.argv[1]; t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0
d = tempfile.mkdtemp()
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', 'fps=1', f'{d}/%04d.png'], check=True)
mask = Image.new('L', (1920, 1080), 0); ImageDraw.Draw(mask).ellipse((960-528, 560-528, 960+528, 560+528), fill=255)
spots = []
for i, p in enumerate(sorted(glob.glob(d + '/*.png'))):
    im = Image.open(p).convert('L')
    s = ImageStat.Stat(im, mask).mean[0]
    c = sum(ImageStat.Stat(im.crop(b)).mean[0] for b in [(0,0,120,120),(1800,0,1920,120),(0,960,120,1080),(1800,960,1920,1080)]) / 4
    spots.append(s); print(f'{t0+i:5.1f}s  聚光区 {s:5.1f}  四角 {c:4.1f}')
print(f'聚光区平均 {sum(spots)/len(spots):.1f}，最低 {min(spots):.1f}，最高 {max(spots):.1f}')
