"""《两小时四十分》声音：python3 scripts/generate-titanic-audio.py
程序合成（numpy，无采样、无第三方素材），按 src/titanic/titanic-shots.json 的时间线写，输出 public/audio/titanic_mix.wav。
照分镜脚本第六节：不用配乐，只有环境声和音效；最重的一拍是灯灭那一帧起的整片静音。
  深海：低频嗡声 + 水压感      回到 1912：嗡声褪去，风、海浪、远处一声汽笛
  飞越：风、破浪、发动机低频，唯一一次「宏大」的低音铺底
  停船：蒸汽轰鸣               灯灭前：钢铁呻吟；灯灭那一帧全部静音
  海面合上：一声很低的水流      片名：静音      回到海底：嗡声回来，淡出
"""
import json, os, wave
import numpy as np

SR = 48000
ROOT = os.path.join(os.path.dirname(__file__), '..')
cfg = json.load(open(os.path.join(ROOT, 'src', 'titanic', 'titanic-shots.json')))
FPS = cfg['fps']; TAIL = 12

# 时间线：和 src/titanic/Titanic.tsx 的 timeline() 同一个算法
at, sh = 0, {}
for i, s in enumerate(cfg['shots']):
    n = round(s['dur'] * FPS); at += s.get('gap', 0)
    if i > 0 and not s.get('gap'): at -= s['x']
    sh[s['id']] = (at / FPS, (at + n) / FPS, s); at += n
END = (at + TAIL) / FPS
OUT = sh['t16'][0] + round(sh['t16'][2]['lightsOut'] * FPS) / FPS    # 灯灭
print(f'total {END:.2f}s  lights out {OUT:.2f}s')

N = int(SR * END); t = np.arange(N) / SR
rng = np.random.default_rng(1912)
db = lambda x: 10 ** (x / 20)
S = lambda i: sh[i][0]
E = lambda i: sh[i][1]

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
    j = min(buf.shape[-1], i + sig.shape[-1]); buf[..., i:j] += sig[..., :j - i] * gain

def stereo(seed, lo, hi):
    r = np.random.default_rng(seed)
    return np.stack([norm(band(r.standard_normal(N), lo, hi)), norm(band(r.standard_normal(N), lo, hi))])

mix = np.zeros((2, N))

# ---- 深海：低频嗡声 + 水压（片头和片尾）----
hum = np.sin(2 * np.pi * 48 * t) + 0.5 * np.sin(2 * np.pi * 96 * t + 1) + 0.25 * np.sin(2 * np.pi * 144.7 * t)
hum = hum * (0.8 + 0.2 * np.sin(2 * np.pi * t / 5.3))
press = stereo(1, 25, 220)
deep = env([(0, None), (0.3, -40), (S('t02'), -24), (S('t03') + 1.5, -24), (S('t03') + 4.5, None),
            (S('t19') - 1.0, None), (S('t19') + 0.6, -24), (E('t19') - 1.5, -26), (E('t19'), None), (END, None)])
mix += (press * 0.8 + hum * 0.35) * deep

# ---- 白天：风 + 海浪（回到 1912 起，到飞越结束）----
wind = stereo(2, 150, 1800)
gust = 0.75 + 0.25 * np.sin(2 * np.pi * t / 6.1)
sea = stereo(3, 80, 900) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * t / 3.7)))
day = env([(0, None), (S('t03') + 2.2, None), (S('t03') + 5.0, -24), (S('t04'), -22), (E('t04') - 0.6, -20), (E('t04') + 0.5, None), (END, None)])
mix += (wind * gust * 0.7 + sea) * day
# 远处的汽笛：两个低音同时响，3 秒
def horn(dur=3.2):
    n = int(dur * SR); x = np.arange(n) / SR; s = np.zeros(n)
    for f0 in (98.0, 123.5):
        for k in range(1, 9): s += np.sin(2 * np.pi * f0 * k * x) / k ** 1.3
    e = np.minimum(1, x / 0.35) * np.clip((dur - x) / 0.8, 0, 1)
    return band(s * e, 60, 1400)
h = norm(horn()); put(mix, np.stack([h, h * 0.9]), S('t03b') + 0.6, db(-30))

# ---- 飞越：破浪、发动机低频、低音铺底 ----
bow = stereo(4, 300, 5000) * env([(0, None), (S('t04'), None), (S('t04') + 0.4, -24), (E('t04') - 0.5, -24), (E('t04'), None), (END, None)])
eng = (np.sin(2 * np.pi * 36 * t) + 0.6 * np.sin(2 * np.pi * 72 * t)) * (0.85 + 0.15 * np.sin(2 * np.pi * 1.6 * t))
eng = eng * env([(0, None), (S('t03b'), None), (S('t03b') + 1, -30), (E('t04') - 0.5, -26), (E('t04') + 0.3, None), (END, None)])
mix += bow + np.stack([eng, eng])
# 宏大低音铺底：D 小调和弦（D2 A2 D3 F3），慢起慢收
swell = np.zeros(N)
for m in (38, 45, 50, 53):
    f0 = 440 * 2 ** ((m - 69) / 12)
    for k in range(1, 7): swell += np.sin(2 * np.pi * f0 * k * (1 + 0.002 * (k % 2)) * t) / k ** 1.5
swell = band(swell, 40, 1200) * env([(0, None), (S('t04') - 0.5, None), (S('t04') + 2.5, -26), (E('t04') - 0.6, -22), (E('t04') + 0.4, None), (END, None)])
mix += np.stack([swell, swell * 0.95])

# ---- 夜：几乎全静的海 ----
night = stereo(5, 100, 700) * env([(0, None), (S('t12') - 0.5, None), (S('t12'), -38), (OUT, -38), (OUT + 0.001, None), (END, None)])
mix += night
# 停船：蒸汽轰鸣
steam = stereo(6, 250, 7000) * (0.9 + 0.1 * np.sin(2 * np.pi * 7 * t))
mix += steam * env([(0, None), (S('t12'), None), (S('t12') + 0.25, -20), (E('t12') - 0.3, -21), (E('t12') + 0.15, None), (END, None)])
# 灯灭前：钢铁呻吟（低频、慢慢滑音）
def groan(dur, f0, f1, seed):
    n = int(dur * SR); x = np.arange(n) / SR; r = np.random.default_rng(seed)
    f = np.linspace(f0, f1, n) * (1 + 0.03 * norm(band(r.standard_normal(n), 0, 6)))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    grit = band(r.standard_normal(n), 80, 900) * 0.25
    e = np.minimum(1, x / 0.6) * np.clip((dur - x) / 0.8, 0, 1)
    return (s + grit) * e
for k, (off, dur, f0, f1) in enumerate(((0.4, 2.6, 62, 48), (2.4, 2.8, 55, 41))):
    g = groan(dur, f0, f1, 10 + k); put(mix, np.stack([g, g * 0.85]), S('t16') + off, db(-24))

# ---- 灯灭那一帧：全部静音 ----
cut = np.ones(N); i0 = int(OUT * SR); cut[i0:] = 0
cut[i0 - 96:i0] = np.linspace(1, 0, 96)              # 2 毫秒防爆音
mix = mix * np.maximum(cut, (t >= S('t19') - 1.0))  # 片尾海底嗡声重新进来

# 海面合上：一声很低的水流
wr = band(np.random.default_rng(7).standard_normal(int(2.6 * SR)), 40, 500)
x = np.arange(len(wr)) / SR; wr = norm(wr) * np.minimum(1, x / 0.3) * np.exp(-x * 1.4)
put(mix, np.stack([wr, wr * 0.9]), S('t17b') - 0.2, db(-26))

mix /= np.abs(mix).max() / db(-3)
pcm = (mix.T * 32767).astype('<i2')
dst = os.path.join(ROOT, 'public', 'audio', 'titanic_mix.wav')
with wave.open(dst, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', dst)
