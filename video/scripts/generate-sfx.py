"""程序化合成 6 个拟音音效到 public/sfx/（只用 Python 标准库）：python3 scripts/generate-sfx.py
固定随机种子，每次生成结果一样。48kHz、16-bit、单声道。"""
import math, random, struct, wave, os

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
rng = random.Random(20261122)

def write(name, samples, peak=0.85):
    m = max(1e-9, max(abs(s) for s in samples))
    data = b''.join(struct.pack('<h', int(max(-1, min(1, s / m * peak)) * 32767)) for s in samples)
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)

def n(sec): return int(SR * sec)

def fade(xs, a=0.004, b=0.02):
    ia, ib = n(a), n(b)
    for i in range(min(ia, len(xs))): xs[i] *= i / ia
    for i in range(min(ib, len(xs))): xs[-1 - i] *= i / ib
    return xs

class Biquad:
    """RBJ 双二阶滤波器，可每个采样改中心频率。"""
    def __init__(self, kind, f, q):
        self.kind, self.q = kind, q; self.x1 = self.x2 = self.y1 = self.y2 = 0.0; self.set(f)
    def set(self, f):
        w = 2 * math.pi * f / SR; c, s = math.cos(w), math.sin(w); a = s / (2 * self.q)
        if self.kind == 'bp': b0, b1, b2 = a, 0, -a
        elif self.kind == 'lp': b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
        else: b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
        a0, a1, a2 = 1 + a, -2 * c, 1 - a
        self.b = (b0 / a0, b1 / a0, b2 / a0); self.a = (a1 / a0, a2 / a0)
    def __call__(self, x):
        y = self.b[0] * x + self.b[1] * self.x1 + self.b[2] * self.x2 - self.a[0] * self.y1 - self.a[1] * self.y2
        self.x2, self.x1, self.y2, self.y1 = self.x1, x, self.y1, y
        return y

def impact_sub():
    # 低频冲击：85→38Hz 下滑正弦 + 二次谐波，指数衰减；开头 6ms 低通噪声做“砸下”的瞬态
    L = n(0.45); lp = Biquad('lp', 900, 0.7); ph = 0; out = []
    for i in range(L):
        t = i / SR; f = 38 + 47 * math.exp(-t * 9); ph += 2 * math.pi * f / SR
        env = math.exp(-t * 7.5) * min(1, t / 0.003)
        body = math.sin(ph) + 0.25 * math.sin(2 * ph)
        click = lp(rng.uniform(-1, 1)) * math.exp(-t * 160) * 1.6
        out.append(body * env + click)
    return fade(out, 0.001, 0.05)

def whoosh_soft():
    # 空气扫风：白噪声过带通，中心频率 300→2400→900Hz 扫过，起伏包络
    L = n(0.35); bp = Biquad('bp', 400, 1.1); out = []
    for i in range(L):
        p = i / L; f = 300 + 2100 * math.sin(math.pi * min(1, p * 1.15)) ** 1.5
        bp.set(f); env = math.sin(math.pi * p) ** 1.8
        out.append(bp(rng.uniform(-1, 1)) * env)
    return fade(out, 0.01, 0.04)

def pop_glass():
    # 玻璃气泡：1500→1100Hz 快速下滑 + 不和谐泛音（×2.76），极快衰减
    L = n(0.12); ph1 = ph2 = 0; out = []
    for i in range(L):
        t = i / SR; f = 1100 + 400 * math.exp(-t * 60)
        ph1 += 2 * math.pi * f / SR; ph2 += 2 * math.pi * f * 2.76 / SR
        env = math.exp(-t * 42) * min(1, t / 0.0015)
        out.append((math.sin(ph1) + 0.35 * math.sin(ph2) * math.exp(-t * 40)) * env)
    return fade(out, 0.0005, 0.02)

def tick_clock():
    # 机械秒表：3ms 高通噪声 + 3.2kHz/5.1kHz 短促共振
    L = n(0.08); hp = Biquad('hp', 2500, 0.7); out = []
    for i in range(L):
        t = i / SR
        noise = hp(rng.uniform(-1, 1)) * math.exp(-t * 900)
        ring = (math.sin(2 * math.pi * 3200 * t) + 0.5 * math.sin(2 * math.pi * 5100 * t)) * math.exp(-t * 110) * 0.5
        out.append(noise + ring)
    return fade(out, 0.0003, 0.01)

def alarm_harsh():
    # 早八电子闹钟：2.0k/2.5k 双频交替的 4 声“嘀”，方波经低通去刺，克制但刺耳
    L = n(0.9); lp = Biquad('lp', 6000, 0.7); out = []
    beeps = [(0.00, 2000), (0.11, 2500), (0.30, 2000), (0.41, 2500), (0.60, 2000), (0.71, 2500)]
    for i in range(L):
        t = i / SR; s = 0.0
        for st, f in beeps:
            d = t - st
            if 0 <= d < 0.085:
                sq = 1 if math.sin(2 * math.pi * f * d) >= 0 else -1
                s += sq * min(1, d / 0.004) * min(1, (0.085 - d) / 0.006)
        out.append(lp(s) * 0.8)
    return fade(out, 0.001, 0.03)

def chime_warm():
    # 温暖钢琴泛音：A3（220Hz）为根，带轻微失谐的谐波 + 五度（330Hz）弱和声，长衰减
    L = n(1.4); out = []
    partials = [(1, 1.0, 2.2), (2, 0.45, 3.0), (3, 0.22, 4.2), (4, 0.12, 5.5), (5, 0.06, 7.0)]
    for i in range(L):
        t = i / SR; s = 0.0
        for k, a, d in partials:
            fk = 220 * k * (1 + 0.0004 * k * k)
            s += a * math.sin(2 * math.pi * fk * t) * math.exp(-t * d)
            s += 0.35 * a * math.sin(2 * math.pi * fk * 1.5 * t) * math.exp(-t * (d + 0.6))
        out.append(s * min(1, t / 0.006))
    return fade(out, 0.001, 0.12)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn, peak in [('impact_sub.wav', impact_sub, .9), ('whoosh_soft.wav', whoosh_soft, .8), ('pop_glass.wav', pop_glass, .8),
                           ('tick_clock.wav', tick_clock, .75), ('alarm_harsh.wav', alarm_harsh, .7), ('chime_warm.wav', chime_warm, .8)]:
        write(name, fn(), peak); print('写好 public/sfx/' + name)
