"""《光，退回山顶》素材预处理：python3 scripts/everest-prep.py <Muse 素材里 videos-round2 目录>
按 src/everest/everest-shots.json 裁出每个镜头要用的那段，降噪、调色、（需要时）补帧放慢，
再用 lanczos 放大到 1920×1080 并轻度锐化，写到 public/footage/everest/<id>.mp4（不含声音，声音在 Remotion 里另配）。
"""
import json, os, subprocess, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
RAW = sys.argv[1]
cfg = json.load(open(os.path.join(ROOT, 'src', 'everest', 'everest-shots.json')))
OUT = os.path.join(ROOT, 'public', 'footage', 'everest'); os.makedirs(OUT, exist_ok=True)
only = set(sys.argv[2:])
for s in cfg['shots']:
    if only and s['id'] not in only: continue
    slow = s.get('slow', 1)
    take = s['dur'] / slow + 0.3          # 多取一点，给交叠留余量
    vf = ['crop=640:360:0:(ih-360)/2', 'hqdn3d=2:1.5:3:3']
    if slow > 1:
        vf += [f'setpts={slow}*PTS', 'minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1']
    vf += [f"eq=saturation={s.get('sat',1)}:gamma={s.get('gam',1)}:brightness={s.get('bri',0)}:contrast={s.get('con',1)}",
           'scale=1920:1080:flags=lanczos', 'unsharp=5:5:0.55:5:5:0', 'fps=24', 'format=yuv420p']
    dst = os.path.join(OUT, s['id'] + '.mp4')
    cmd = ['ffmpeg', '-v', 'error', '-y', '-ss', str(s['in']), '-t', str(take), '-i', os.path.join(RAW, s['src'] + '.mp4'),
           '-an', '-vf', ','.join(vf), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', dst]
    subprocess.run(cmd, check=True)
    print(s['id'], s['src'], '->', dst)
