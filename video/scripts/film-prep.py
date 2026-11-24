"""短片素材预处理：python3 scripts/film-prep.py <项目名> <素材目录> [镜头号…]
例：python3 scripts/film-prep.py everest <目录>；python3 scripts/film-prep.py titanic <目录>
按 src/<项目>/<项目>-shots.json 裁出每个镜头要用的那段，降噪、调色、（需要时）补帧放慢，
再用 lanczos 放大到 1920×1080 并轻度锐化，写到 public/footage/<项目>/<id>.mp4（不含声音，声音在 Remotion 里另配）。
"""
import json, os, subprocess, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
PROJ, RAW = sys.argv[1], sys.argv[2]
cfg = json.load(open(os.path.join(ROOT, 'src', PROJ, PROJ + '-shots.json')))
OUT = os.path.join(ROOT, 'public', 'footage', PROJ); os.makedirs(OUT, exist_ok=True)
only = set(sys.argv[3:])
for s in cfg['shots']:
    if only and s['id'] not in only: continue
    slow = s.get('slow', 1)
    take = s['dur'] / slow + 0.3          # 多取一点，给交叠留余量
    src = os.path.join(RAW, s['src'] + '.mp4')
    w = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width',
                            '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.strip())
    hd = w >= 1000                         # 原片（1248/1280 宽）只轻降噪；压缩过的 640 宽才重降噪
    cy = s.get('cropY', 0.5)                # 原片比 16:9 高时（如 3:2），从哪里裁：0=顶部，0.5=居中
    vf = [f'crop=iw:trunc(iw*9/16/2)*2:0:(ih-trunc(iw*9/16/2)*2)*{cy}', 'hqdn3d=1:1:2:2' if hd else 'hqdn3d=2:1.5:3:3']
    if slow > 1:
        vf += [f'setpts={slow}*PTS', 'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1']
    vf += [f"eq=saturation={s.get('sat',1)}:gamma={s.get('gam',1)}:brightness={s.get('bri',0)}:contrast={s.get('con',1)}",
           'scale=1920:1080:flags=lanczos', 'unsharp=5:5:0.35:5:5:0' if hd else 'unsharp=5:5:0.55:5:5:0', 'fps=24', 'format=yuv420p']
    dst = os.path.join(OUT, s['id'] + '.mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(s['in']), '-t', str(take), '-i', src,
           '-an', '-vf', ','.join(vf), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', dst]
    subprocess.run(cmd, check=True)
    print(s['id'], s['src'], f'{w}px', '->', dst)
