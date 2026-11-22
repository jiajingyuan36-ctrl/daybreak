"""《星巴克：不付利息的「银行」》原创配乐：python3 scripts/generate-bgm.py
程序合成（numpy 加法合成，无采样、无第三方素材），按 src/sbux-timeline.json 的分幕时间写结构，
输出 public/audio/bgm_business.mp3（StarbucksBank 检测到这个文件会自动以 0.12 音量混入）。

96 BPM，D 小调，克制的商业纪录片底乐：
  第 1 幕  暗色长音铺底 + 每两拍一下心跳低音（悬念）
  第 2 幕  加入八分音符贝斯脉冲和底鼓，和弦 Dm–B♭–F–C 循环
  第 3 幕  再加十六分音符细碎的“滴答”；切到金库时鼓全部抽空，一记低频重击，只留紧张的长音
  第 4 幕  鼓回来，略亮一点
  第 5 幕  转 D 大调：D–G–D 的暖色长音 + 慢速钢琴分解和弦，没有鼓，最后 2.5 秒淡出
"""
import json, os, subprocess
import numpy as np

SR = 44100
ROOT = os.path.join(os.path.dirname(__file__), '..')
tl = json.load(open(os.path.join(ROOT, 'src', 'sbux-timeline.json')))
starts, acc = [], 0.0
for s in tl['scenes']:
    starts.append(acc); acc += round(s['length'] * 30) / 30
TOTAL = acc
S1, S2, S3, S4, S5 = starts
VAULT = S3 + tl['scenes'][2]['cues'][5]['from']   # 第 3 幕切到金库插镜
BPM = 96; BEAT = 60 / BPM; BAR = 4 * BEAT
N = int(SR * (TOTAL + 0.5)); t = np.arange(N) / SR
out = np.zeros(N)
rng = np.random.default_rng(20261122)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def put(sig, at, gain=1.0):
    i = int(at * SR)
    if i >= N: return
    j = min(N, i + len(sig)); out[i:j] += sig[:j - i] * gain

def tone(freq, dur, harm=8, slope=1.5, decay=None, attack=0.01, detune=0.0):
    n = int(dur * SR); x = np.arange(n) / SR; s = np.zeros(n)
    for k in range(1, harm + 1):
        for d in ((0,) if not detune else (-detune, detune)):
            s += np.sin(2 * np.pi * freq * k * (1 + d) * x) / k ** slope
    env = np.minimum(1, x / attack)
    env *= np.exp(-x * decay) if decay else np.minimum(1, (dur - x) / 0.3).clip(0, 1)
    return s * env

def pad(chord, at, dur, gain):
    for m in chord: put(tone(hz(m), dur, harm=6, slope=1.8, attack=0.8, detune=0.003), at, gain / len(chord))

def kick(at, gain):
    n = int(0.3 * SR); x = np.arange(n) / SR
    f = 45 + 75 * np.exp(-x * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    put(np.sin(ph) * np.exp(-x * 11), at, gain)

def hat(at, gain):
    n = int(0.05 * SR); x = np.arange(n) / SR; w = rng.uniform(-1, 1, n)
    put(np.diff(w, prepend=0) * np.exp(-x * 90), at, gain)

def bass(m, at, gain):
    put(tone(hz(m), BEAT / 2, harm=4, slope=1.2, decay=7, attack=0.005), at, gain)

def piano(m, at, gain):
    put(tone(hz(m), 2.2, harm=6, slope=1.6, decay=2.4, attack=0.004), at, gain)

MINOR = [[50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [48, 52, 55, 60]]   # Dm B♭ F C
ROOTS = [38, 34, 41, 36]

# 第 1 幕：暗色长音 + 心跳
pad([38, 45, 50, 53], S1, S2 - S1 + 0.6, 0.55)
b = S1 + 0.4
while b < S2 - 0.3: kick(b, 0.35); kick(b + 0.22, 0.18); b += 2 * BEAT

# 第 2–4 幕：按小节铺和弦 + 节奏层（金库段抽空鼓）
bar, i = S2, 0
while bar < S5 - 0.01:
    c = i % 4; end = min(bar + BAR, S5)
    pad(MINOR[c], bar, end - bar + 0.5, 0.42 if bar < S4 else 0.48)
    for k in range(8):
        at = bar + k * BEAT / 2
        if at >= end: break
        in_vault = VAULT <= at < S4
        if not in_vault:
            bass(ROOTS[c] + (12 if k % 4 == 3 else 0), at, 0.28)
            if k % 2 == 0: kick(at, 0.42 if k % 4 == 0 else 0.3)
        if (S3 <= at < VAULT) or at >= S4:
            hat(at, 0.05); hat(at + BEAT / 4, 0.035)
    bar += BAR; i += 1

# 金库：一记低频重击 + 持续的紧张低音
kick(VAULT, 0.9); put(tone(hz(26), S4 - VAULT + 0.4, harm=3, slope=1.0, attack=0.05), VAULT, 0.35)

# 第 5 幕：D 大调暖色收尾 + 钢琴分解和弦
MAJOR = [([50, 54, 57, 62], [62, 66, 69, 74]), ([43, 50, 55, 59], [67, 71, 74, 79]), ([50, 54, 57, 62], [62, 66, 69, 74])]
seg = (TOTAL - S5) / 3
for j, (ch, arp) in enumerate(MAJOR):
    at0 = S5 + j * seg
    pad(ch, at0, seg + 0.8, 0.5)
    k = 0; at = at0 + 0.3
    while at < at0 + seg - 0.2:
        piano(arp[k % 4], at, 0.16); at += BEAT; k += 1

# 收尾淡出、整体归一化到 -1 dBFS
fade = np.clip((TOTAL - t) / 2.5, 0, 1); out *= fade
out /= max(1e-9, np.abs(out).max()); out *= 10 ** (-1 / 20)
wav = os.path.join(ROOT, 'public', 'audio', 'bgm_business.wav')
import wave
with wave.open(wav, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes())
mp3 = wav[:-4] + '.mp3'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '2', '-b:a', '192k', mp3], check=True)
os.remove(wav)
print('写好 public/audio/bgm_business.mp3', round(TOTAL, 2), '秒')
