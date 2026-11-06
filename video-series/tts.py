"""本地中文配音：sherpa-onnx + Kokoro v1.1-zh（Apache-2.0），不联网、不调用任何外部服务。

用法：python tts.py <模型目录> <输入.json> <输出目录> [sid] [speed]
输入是 [{"id": "...", "text": "..."}]，每段写一个 <id>.wav，并输出 durations.json（秒）。
"""
import json
import os
import sys

import numpy as np
import sherpa_onnx
import soundfile as sf

model_dir, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
sid = int(sys.argv[4]) if len(sys.argv) > 4 else 3
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
os.makedirs(out, exist_ok=True)
p = lambda n: os.path.join(model_dir, n)
config = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=p("model.onnx"), voices=p("voices.bin"), tokens=p("tokens.txt"),
            data_dir=p("espeak-ng-data"), dict_dir=p("dict"),
            lexicon=p("lexicon-us-en.txt") + "," + p("lexicon-zh.txt"),
        ),
        num_threads=4,
    ),
    rule_fsts=",".join(p(n) for n in ("date-zh.fst", "number-zh.fst", "phone-zh.fst")),
)
if not config.validate():
    raise SystemExit("TTS 配置无效，检查模型目录")
tts = sherpa_onnx.OfflineTts(config)
durations = {}
for item in json.load(open(src, encoding="utf-8")):
    audio = tts.generate(text=item["text"], sid=sid, speed=speed)
    samples = np.asarray(audio.samples, dtype=np.float32)
    # 去掉首尾静音，节奏由时间轴统一控制
    nz = np.nonzero(np.abs(samples) > 0.01)[0]
    if len(nz):
        samples = samples[max(0, nz[0] - 1200): nz[-1] + 2400]
    sf.write(os.path.join(out, item["id"] + ".wav"), samples, audio.sample_rate)
    durations[item["id"]] = round(len(samples) / audio.sample_rate, 3)
    print(item["id"], durations[item["id"]], "s", flush=True)
json.dump(durations, open(os.path.join(out, "durations.json"), "w"), indent=1)
