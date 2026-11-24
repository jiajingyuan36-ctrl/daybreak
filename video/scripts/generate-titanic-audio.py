"""《两小时四十分》声音：python3 scripts/generate-titanic-audio.py
按 src/titanic/titanic-shots.json 的时间线写，输出 public/audio/titanic_mix.wav。照分镜脚本第六节：
不用配乐，只有环境声和音效；大楼梯的人声、乐手的小提琴用 Muse 素材自带的同期声（film-prep.py 抽成 public/footage/titanic/<id>.wav），
其余全部程序合成（numpy，无采样、无第三方素材）。最重的一拍：灯灭那一帧起整片静音，直到片名结束。
  深海低鸣（01–03、19） 风和海浪、汽笛（03–05） 发动机低频（03 起一直到 12 停掉） 飞越的低音铺底（04）
  三声钟（08） 车钟铃（09） 冰与钢的摩擦、断裂（10） 冰块砸甲板（11） 蒸汽轰鸣（12） 火箭升空、爆响、噼啪（13）
  船体呻吟、玻璃滑动、水流（14） 小提琴（15） 钢铁呻吟（16），灯灭 → 静音 → 海面合上的水声（17）→ 片名静音 → 黎明的水声（18）→ 深海低鸣（19）
"""
import json, os, wave
import numpy as np

SR = 48000
ROOT = os.path.join(os.path.dirname(__file__), '..')
cfg = json.load(open(os.path.join(ROOT, 'src', 'titanic', 'titanic-shots.json')))
FPS = cfg['fps']; TAIL = 12
FOOT = os.path.join(ROOT, 'public', 'footage', 'titanic')

# 时间线：和 src/titanic/Titanic.tsx 的 timeline() 同一个算法
at, sh = 0, {}
for i, s in enumerate(cfg['shots']):
    n = round(s['dur'] * FPS); at += s.get('gap', 0)
    if i > 0 and not s.get('gap'): at -= s['x']
    sh[s['id']] = (at / FPS, (at + n) / FPS, s); at += n
END = (at + TAIL) / FPS
S = lambda i: sh[i][0]
E = lambda i: sh[i][1]
OUT = S('s16') + round(sh['s16'][2]['lightsOut'] * FPS) / FPS     # 灯灭
print(f'total {END:.2f}s  lights out {OUT:.2f}s')

N = int(SR * END); t = np.arange(N) / SR
db = lambda x: 10 ** (x / 20)

def env(pts):
    return np.interp(t, [p[0] for p in pts], [0.0 if p[1] is None else db(p[1]) for p in pts])

def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x))

def norm(x): return x / (np.sqrt(np.mean(x ** 2)) + 1e-12)
def put(buf, sig, at_s, gain=1.0):
    i = int(at_s * SR)
    if i >= buf.shape[-1]: return
    if sig.ndim == 1: sig = np.stack([sig, sig])
    j = min(buf.shape[-1], i + sig.shape[-1]); buf[..., i:j] += sig[..., :j - i] * gain

def stereo(seed, lo, hi):
    r = np.random.default_rng(seed)
    return np.stack([norm(band(r.standard_normal(N), lo, hi)), norm(band(r.standard_normal(N), lo, hi))])

def burst(seed, dur, lo, hi, decay, attack=0.002):
    r = np.random.default_rng(seed); n = int(dur * SR); x = np.arange(n) / SR
    return norm(band(r.standard_normal(n), lo, hi)) * np.minimum(1, x / attack) * np.exp(-x * decay)

def ping(f0, dur, decay, partials=((1, 1),)):
    n = int(dur * SR); x = np.arange(n) / SR; s = np.zeros(n)
    for k, a in partials: s += a * np.sin(2 * np.pi * f0 * k * x) * np.exp(-x * decay * (1 + 0.4 * (k - 1)))
    return s * np.minimum(1, x / 0.002)

mix = np.zeros((2, N))

# ---- 深海低鸣 + 水压（片头、片尾）----
hum = np.sin(2 * np.pi * 48 * t) + 0.5 * np.sin(2 * np.pi * 96 * t + 1) + 0.25 * np.sin(2 * np.pi * 144.7 * t)
hum = hum * (0.8 + 0.2 * np.sin(2 * np.pi * t / 5.3))
press = stereo(1, 25, 220)
deep = env([(0, None), (S('s01'), None), (S('s01') + 1.2, -24), (S('s03') + 1.5, -24), (S('s03') + 4.5, None),
            (S('s19') - 0.5, None), (S('s19') + 0.8, -24), (E('s19') - 1.5, -26), (E('s19'), None), (END, None)])
mix += (press * 0.8 + hum * 0.35) * deep

# ---- 白天：风、海浪、汽笛 ----
wind = stereo(2, 150, 1800); gust = 0.75 + 0.25 * np.sin(2 * np.pi * t / 6.1)
sea = stereo(3, 80, 900) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * t / 3.7)))
day = env([(0, None), (S('s03') + 2.2, None), (S('s03') + 5.0, -24), (S('s04'), -22), (E('s05') - 0.6, -22), (E('s05') + 0.4, None), (END, None)])
mix += (wind * gust * 0.7 + sea) * day
def horn(dur=3.2):
    n = int(dur * SR); x = np.arange(n) / SR; s = np.zeros(n)
    for f0 in (98.0, 123.5):
        for k in range(1, 9): s += np.sin(2 * np.pi * f0 * k * x) / k ** 1.3
    return band(s * np.minimum(1, x / 0.35) * np.clip((dur - x) / 0.8, 0, 1), 60, 1400)
put(mix, norm(horn()), S('s03b') + 0.6, db(-30))
# 破浪：飞越时中等，船头劈浪时最近最响
bow = stereo(4, 250, 6000)
mix += bow * env([(0, None), (S('s04'), None), (S('s04') + 0.4, -26), (E('s04'), -25), (S('s05'), -17), (E('s05') - 0.4, -17), (E('s05') + 0.3, None), (END, None)])
# 飞越的低音铺底（全片唯一一次「宏大」）：D 小调和弦慢起慢收
swell = np.zeros(N)
for m in (38, 45, 50, 53):
    f0 = 440 * 2 ** ((m - 69) / 12)
    for k in range(1, 7): swell += np.sin(2 * np.pi * f0 * k * (1 + 0.002 * (k % 2)) * t) / k ** 1.5
mix += band(swell, 40, 1200) * env([(0, None), (S('s04') - 0.5, None), (S('s04') + 2.5, -26), (E('s04') - 0.3, -21), (E('s05') - 1, -30), (E('s05'), None), (END, None)])

# ---- 发动机低频：从 1912 年的甲板一直到停船 ----
eng = (np.sin(2 * np.pi * 36 * t) + 0.6 * np.sin(2 * np.pi * 72 * t) + 0.2 * np.sin(2 * np.pi * 108 * t)) * (0.85 + 0.15 * np.sin(2 * np.pi * 1.6 * t))
mix += np.stack([eng, eng]) * env([(0, None), (S('s03b'), None), (S('s03b') + 1, -30), (E('s05'), -28), (S('s06'), -32), (S('s07'), -36),
                                    (S('s10'), -30), (S('s12') - 0.05, -30), (S('s12') + 0.5, None), (END, None)])

# ---- 大楼梯：同期声（人声、脚步） ----
def native(i, gain_db, fade=0.4):
    p = os.path.join(FOOT, i + '.wav')
    if not os.path.exists(p): print('missing', p); return
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).T.astype(float) / 32768
    n = int((E(i) - S(i)) * SR); x = x[:, :n]; xx = np.arange(x.shape[1]) / SR
    e = np.minimum(1, xx / fade) * np.clip((xx[-1] - xx) / fade, 0, 1)
    put(mix, norm(x) * e, S(i), db(gain_db))
native('s06', -27)

# ---- 夜：几乎全静的海 ----
mix += stereo(5, 100, 700) * env([(0, None), (S('s07') - 0.5, None), (S('s07'), -38), (OUT, -38), (OUT + 0.001, None), (END, None)])
# 瞭望台：风 + 三声钟
mix += wind * env([(0, None), (S('s08'), None), (S('s08') + 0.3, -28), (E('s08'), -28), (E('s08') + 0.2, None), (END, None)])
BELL = ((1, 1), (2.0, .6), (2.76, .45), (5.4, .25), (8.9, .12))
for k in range(3): put(mix, ping(780, 2.2, 2.2, BELL), S('s08') + 2.4 + 0.36 * k, db(-17))
# 车钟：手柄的金属声 + 两下铃
put(mix, burst(21, 0.25, 800, 6000, 30), S('s09') + 1.3, db(-24))
for k in range(2): put(mix, ping(1320, 1.4, 3.0, ((1, 1), (2.4, .4), (3.9, .2))), S('s09') + 1.6 + 0.25 * k, db(-20))
# 冰山擦过：一长声冰与钢的摩擦 + 几下断裂
r = np.random.default_rng(31); n = int((E('s10') - S('s10')) * SR); xx = np.arange(n) / SR
grind = norm(band(r.standard_normal(n), 60, 900)) * (0.6 + 0.4 * np.abs(norm(band(r.standard_normal(n), 0, 9)))).clip(0, 1.6)
grind *= np.minimum(1, xx / 0.8) * np.clip((xx[-1] - xx) / 0.8, 0, 1)
put(mix, grind, S('s10'), db(-19))
for k, off in enumerate((2.0, 4.6, 6.2)): put(mix, burst(40 + k, 1.2, 80, 5000, 5), S('s10') + off, db(-18))
# 冰块砸甲板
put(mix, burst(50, 1.0, 100, 9000, 6), S('s11') + 0.55, db(-14))
r = np.random.default_rng(51)
for k in range(26): put(mix, ping(r.uniform(2500, 6000), 0.4, r.uniform(9, 18)), S('s11') + 0.6 + r.exponential(0.6), db(-32))
# 停船：蒸汽轰鸣（发动机声在这里停掉）
steam = stereo(6, 250, 7000) * (0.9 + 0.1 * np.sin(2 * np.pi * 7 * t))
mix += steam * env([(0, None), (S('s12'), None), (S('s12') + 0.3, -19), (E('s12') - 0.3, -20), (E('s12') + 0.3, None), (END, None)])
# 求救火箭：升空的嘶声 → 爆响 → 噼啪
n = int(2.0 * SR); xx = np.arange(n) / SR; r = np.random.default_rng(61)
whoosh = norm(band(r.standard_normal(n), 1500, 7000)) * np.minimum(1, xx / 1.5) * np.clip((2.0 - xx) / 0.1, 0, 1)
put(mix, whoosh, S('s13') + 2.0, db(-28))
put(mix, burst(62, 2.5, 40, 4000, 2.2), S('s13') + 4.0, db(-12))
for k in range(40): put(mix, burst(70 + k, 0.08, 1500, 9000, 60), S('s13') + 4.15 + r.uniform(0, 2.4), db(-30 + r.uniform(-4, 2)))
mix += stereo(7, 60, 500) * env([(0, None), (S('s13'), None), (S('s13') + 0.5, -34), (E('s13'), -34), (E('s13') + 0.3, None), (END, None)])
# 钢铁呻吟（餐厅、灯灭前）
def groan(dur, f0, f1, seed):
    n = int(dur * SR); x = np.arange(n) / SR; rr = np.random.default_rng(seed)
    f = np.linspace(f0, f1, n) * (1 + 0.03 * norm(band(rr.standard_normal(n), 0, 6)))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return (s + band(rr.standard_normal(n), 80, 900) * 0.25) * np.minimum(1, x / 0.6) * np.clip((dur - x) / 0.8, 0, 1)
put(mix, groan(3.2, 58, 44, 80), S('s14') + 0.2, db(-24))
for k, off in enumerate((0.6, 1.4, 2.1)): put(mix, ping(3100 + 400 * k, 0.6, 7, ((1, 1), (2.7, .3))), S('s14') + off, db(-30))
mix += stereo(8, 300, 3000) * env([(0, None), (S('s14') + 3.2, None), (S('s14') + 4.0, -32), (E('s14'), -32), (E('s14') + 0.2, None), (END, None)])
# 乐手：同期声（小提琴）
native('s15', -20, fade=0.6)
for k, (off, dur, f0, f1) in enumerate(((0.3, 2.8, 62, 48), (2.6, 3.0, 55, 41))):
    put(mix, groan(dur, f0, f1, 90 + k), S('s16') + off, db(-23))

# ---- 灯灭那一帧：全部静音，直到片名结束；片尾海底低鸣再进来 ----
i0 = int(OUT * SR); cut = np.ones(N); cut[i0:] = 0; cut[i0 - 96:i0] = np.linspace(1, 0, 96)
mix *= np.maximum(cut, (t >= S('s18') - 0.2))
# 海面合上：一声很低的水流
wr = band(np.random.default_rng(9).standard_normal(int(2.6 * SR)), 40, 500); xx = np.arange(len(wr)) / SR
put(mix, norm(wr) * np.minimum(1, xx / 0.3) * np.exp(-xx * 1.4), S('s17b') - 0.2, db(-26))
# 黎明：很轻的水声
mix += stereo(10, 100, 1500) * env([(0, None), (S('s18'), None), (S('s18') + 1.0, -38), (E('s18') - 1.5, -40), (E('s18'), None), (END, None)])

mix /= np.abs(mix).max() / db(-3)
pcm = (mix.T * 32767).astype('<i2')
dst = os.path.join(ROOT, 'public', 'audio', 'titanic_mix.wav')
with wave.open(dst, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', dst)
