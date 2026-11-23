"""《光，退回山顶》声音：python3 scripts/generate-everest-audio.py
程序合成（numpy，无采样、无第三方素材），按 src/everest/everest-shots.json 的时间线写，输出 public/audio/everest_mix.wav。
结构照分镜脚本第六、七节：
  风（底层，全片）+ 局部音效（雪粒嘶声、冰体咔声）
  配乐 D 小调、60 BPM：低频长音 → 弦乐铺底 → 高音泛音 → 心跳脉动 → 低音弦乐 → 上行旋律
  → 日照金山、金色北壁是顶点 → 回落 → 峰尖熄灭那一帧全部切断 → 只剩风 → 星空时一个钢琴单音 D
"""
import json, os, wave
import numpy as np

SR = 48000
ROOT = os.path.join(os.path.dirname(__file__), '..')
cfg = json.load(open(os.path.join(ROOT, 'src', 'everest', 'everest-shots.json')))
FPS = cfg['fps']

# 时间线：和 src/everest/Everest.tsx 的 timeline() 同一个算法
FIRST, TITLE_GAP, TITLE_LEN, TAIL = 36, 12, 72, 12
at, sh = FIRST, {}
for i, s in enumerate(cfg['shots']):
    n = round(s['dur'] * FPS)
    if i > 0: at -= s['x']
    sh[s['id']] = (at / FPS, (at + n) / FPS, s)
    at += n
END = (at + TITLE_GAP + TITLE_LEN + TAIL) / FPS
EMBER = sh['11'][0] + sh['11'][2]['ember']          # 峰尖熄灭：音乐在这一刻切断
STARS = sh['13'][0]
PEAK_A, PEAK_B = sh['09'][0], sh['10'][1]           # 顶点：日照金山 + 金色北壁
print(f'total {END:.2f}s  ember {EMBER:.2f}s  stars {STARS:.2f}s  peak {PEAK_A:.2f}-{PEAK_B:.2f}s')

N = int(SR * END); t = np.arange(N) / SR
rng = np.random.default_rng(20261123)
db = lambda x: 10 ** (x / 20)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def env_points(pts):
    """[(秒, dB), ...] 折线包络，None 表示静音"""
    xs = [p[0] for p in pts]; ys = [0.0 if p[1] is None else db(p[1]) for p in pts]
    return np.interp(t, xs, ys)

def fft_filter(x, lo, hi, soft=0.15):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x))

def put(buf, sig, at_s, gain=1.0):
    i = int(at_s * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(sig)); buf[i:j] += sig[:j - i] * gain

# ---------- 风 ----------
def wind_layer(seed):
    r = np.random.default_rng(seed)
    w = r.standard_normal(N)
    body = fft_filter(w, 80, 700)
    hiss = fft_filter(w, 1500, 6000) * 0.25
    # 阵风：几条慢正弦 + 平滑随机
    g = 0.65 + 0.2 * np.sin(2 * np.pi * t / 7.3 + seed) + 0.12 * np.sin(2 * np.pi * t / 2.9 + 2 * seed)
    sm = fft_filter(r.standard_normal(N), 0, 0.4); sm /= np.abs(sm).max()
    g = np.clip(g + 0.25 * sm, 0.2, 1.3)
    x = (body + hiss) * g
    return x / np.sqrt(np.mean(x ** 2))

wind = np.stack([wind_layer(1), wind_layer(2)])
def S(i): return sh[i][0]
wenv = env_points([
    (0, -60), (2, -24), (S('02') + 1, -22), (S('03'), -22), (S('03') + 0.5, -26),
    (S('04') - 0.05, -26), (S('04') + 0.15, -19), (S('06') - 0.3, -20), (S('06') + 0.5, -24),
    (S('08'), -24), (S('08') + 1, -28), (S('09') + 1, -30), (S('10'), -28), (EMBER, -28),
    (EMBER + 0.5, -27), (S('12') + 1, -30), (S('13') + 1, -32), (END - 3, -32), (END, -70)])
# 云旗：叠一层低频的高空轰鸣
roar = fft_filter(rng.standard_normal(N), 30, 160); roar /= np.sqrt(np.mean(roar ** 2))
renv = env_points([(0, None), (S('04') - 0.05, None), (S('04') + 0.2, -25), (S('04') + 7.5, -27), (S('06') + 0.5, None), (END, None)])
wind = wind * wenv + roar * renv

# ---------- 局部音效 ----------
sfx = np.zeros((2, N))
# 雪粒嘶声（山的肌理）
hs = fft_filter(rng.standard_normal(N), 3000, 11000)
hs /= np.sqrt(np.mean(hs ** 2))
henv = env_points([(0, None), (S('03'), None), (S('03') + 0.6, -30), (S('03') + 5.5, -30), (S('04'), None), (END, None)])
mod = 0.6 + 0.4 * np.abs(np.sin(2 * np.pi * t / 1.7))
sfx += hs * henv * mod
# 冰体咔声（冰塔林）两次
def crack(dur=2.4):
    n = int(dur * SR); x = np.arange(n) / SR
    f = 95 * np.exp(-x * 0.6) + 40
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.2)
    click = fft_filter(rng.standard_normal(n), 200, 2500) * np.exp(-x * 30) * 0.6
    return (s + click) / 1.2
for k, off in enumerate((1.8, 5.0)):
    c = crack(); put(sfx[0], c, S('06') + off, db(-28) * (1 if k else .8)); put(sfx[1], c, S('06') + off + 0.012, db(-29))

# ---------- 配乐 ----------
mus = np.zeros((2, N))
def saw(freq, dur, harm=12, detune=0.0025, vib=0.0, attack=0.6, release=0.8, bright=1.0):
    n = int(dur * SR); x = np.arange(n) / SR
    out = np.zeros(n)
    ph_v = vib * np.sin(2 * np.pi * 5.2 * x) if vib else 0
    for d in (-detune, 0, detune):
        fr = freq * (1 + d) * (1 + ph_v)
        ph = 2 * np.pi * np.cumsum(fr) / SR
        for k in range(1, harm + 1):
            if freq * k > 9000: break
            out += np.sin(k * ph) / k ** (1.6 / bright)
    e = np.minimum(1, x / attack) * np.clip((dur - x) / release, 0, 1)
    return out * e / 3

def add(sig, at_s, gain, pan=0.0):
    put(mus[0], sig, at_s, gain * np.cos((pan + 1) * np.pi / 4) * 1.414)
    put(mus[1], sig, at_s, gain * np.sin((pan + 1) * np.pi / 4) * 1.414)

BAR = 4.0
CHORDS = [[50, 53, 57, 62], [46, 50, 53, 58], [41, 48, 53, 57], [48, 52, 55, 60]]   # Dm  B♭  F  C

# 低频长音 D + A，从 1.5 秒进来
drone_end = EMBER
d = saw(hz(38), drone_end - 1.5, harm=8, attack=6, release=0.05) + 0.6 * saw(hz(45), drone_end - 1.5, harm=6, attack=6, release=0.05)
dl = env_points([(0, None), (1.5, -36), (8, -28), (PEAK_A, -24), (PEAK_A + 2, -16), (PEAK_B, -18), (EMBER, -26), (END, -26)])
seg = np.zeros(N); put(seg, d, 1.5); seg *= dl
mus += np.stack([seg, seg])

# 弦乐铺底：每小节一个和弦
pad = np.zeros(N)
start = 3.0; k = 0
while start < EMBER:
    dur = min(BAR + 1.2, EMBER - start + 0.05)
    bright = 1.0 + (0.6 if PEAK_A - 1 <= start <= PEAK_B else 0)
    for m in CHORDS[k % 4]:
        put(pad, saw(hz(m), dur, harm=10, attack=1.4, release=1.2, vib=0.002, bright=bright), start, 1 / 4)
        if PEAK_A - 1 <= start <= PEAK_B: put(pad, saw(hz(m + 12), dur, harm=6, attack=1.0, release=1.2, vib=0.003), start, 1 / 7)
    start += BAR; k += 1
pl = env_points([(0, None), (3, -40), (S('03'), -28), (S('06'), -24), (S('08'), -20), (PEAK_A, -14), (PEAK_A + 1.5, -7), (PEAK_B, -8), (EMBER - 0.5, -24), (EMBER, -26), (END, -26)])
pad = fft_filter(pad, 60, 5000) * pl
mus += np.stack([pad * 0.95, pad])

# 高音泛音（山的肌理）
hx = np.arange(int(7 * SR)) / SR
harmo = np.sin(2 * np.pi * hz(86) * hx * (1 + 0.002 * np.sin(2 * np.pi * 4.5 * hx))) * np.minimum(1, hx / 2) * np.clip((7 - hx) / 2.5, 0, 1)
add(harmo, S('03') - 0.5, db(-34), pan=0.3)

# 心跳脉动：每小节两拍，从云旗到河谷暗下
def thump():
    n = int(0.9 * SR); x = np.arange(n) / SR
    f = 42 + 30 * np.exp(-x * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 5.5)
bt = S('04')
while bt < sh['10'][1]:
    g = db(-24) if bt < PEAK_A else db(-19)
    add(thump(), bt, g); add(thump() * 0.45, bt + 0.32, g)
    bt += 2.0

# 低音弦乐（冰塔林起）
cello = np.zeros(N); bs = S('06'); k = 0
BASS = [38, 34, 41, 36]
while bs < EMBER:
    put(cello, saw(hz(BASS[k % 4]), min(BAR + 0.8, EMBER - bs + 0.05), harm=14, attack=1.0, release=0.8, vib=0.003), bs, 1)
    bs += BAR; k += 1
cl = env_points([(0, None), (S('06'), -28), (S('08'), -22), (PEAK_A, -15), (PEAK_A + 1.5, -12), (PEAK_B, -13), (EMBER, -26), (END, -26)])
cello = fft_filter(cello, 40, 1800) * cl
mus += np.stack([cello, cello * 0.9])

# 上行旋律（河谷暗下）→ 顶点长音 → 回落
MEL = [(S('08') + 0.2, 57, 1.9), (S('08') + 2.1, 60, 1.9), (S('08') + 4.0, 62, 1.6), (S('09') - 0.2, 64, 1.6),
       (S('09') + 1.4, 69, 4.2), (S('09') + 5.6, 74, 5.6), (S('10b') + 0.6, 72, 3.2), (S('10b') + 3.8, 69, EMBER - S('10b') - 3.8 + 0.05)]
for st, m, du in MEL:
    g = db(-26) if st < PEAK_A else db(-13)
    add(fft_filter(saw(hz(m), du + 0.4, harm=10, attack=0.35, release=0.6, vib=0.006), 150, 4500), st, g, pan=-0.2)

# 混响（只给配乐）：衰减噪声做冲激响应
def reverb(x, rt=3.2, wet=0.32, seed=7):
    r = np.random.default_rng(seed); n = int(rt * SR); xx = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = r.standard_normal(n) * np.exp(-6.9 * xx / rt); ir = fft_filter(ir, 200, 6000); ir /= np.sqrt(np.sum(ir ** 2))
        L = len(x[ch]) + n; F = 1 << (L - 1).bit_length()
        out[ch] = np.fft.irfft(np.fft.rfft(x[ch], F) * np.fft.rfft(ir, F), F)[:len(x[ch])]
    return (1 - wet) * x + wet * out
mus = reverb(mus)

# 峰尖熄灭：全部切断（20 毫秒防爆音）
cut = np.clip((EMBER - t) / 0.02, 0, 1)
mus *= cut

# 星空：一个钢琴单音 D，长混响
def piano(m, dur=9.0):
    n = int(dur * SR); x = np.arange(n) / SR; f0 = hz(m); s = np.zeros(n)
    for k in range(1, 9):
        fk = f0 * k * np.sqrt(1 + 0.0004 * k * k)
        s += np.sin(2 * np.pi * fk * x) * np.exp(-x * (0.45 + 0.35 * k)) / k ** 1.1
    s *= np.minimum(1, x / 0.004)
    return s
pn = np.zeros((2, N))
for m, off, g in ((62, 0.0, db(-26)), (50, 0.0, db(-32)), (74, 6.5, db(-34))):
    p = piano(m); put(pn[0], p, STARS + off, g); put(pn[1], p, STARS + off + 0.004, g * 0.95)
pn = reverb(pn, rt=5.0, wet=0.5, seed=11)
pn *= np.clip((END - t) / 2.5, 0, 1)

mix = wind + sfx + mus + pn
mix /= np.abs(mix).max() / db(-3)
pcm = (mix.T * 32767).astype('<i2')
dst = os.path.join(ROOT, 'public', 'audio', 'everest_mix.wav')
with wave.open(dst, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', dst, f'{END:.2f}s')
