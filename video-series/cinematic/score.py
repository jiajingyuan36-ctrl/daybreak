"""Original Daybreak score for a 45-second film. Generates audio locally."""
import math
import sys
import wave

import numpy as np

RATE = 48000
LENGTH = 45
PULSE = .625
CHASE = 60 / 108
RISE = 18 + 20 * CHASE
rng = np.random.default_rng(31)
track = np.zeros((RATE * LENGTH, 2), dtype=np.float32)


def time(duration):
    return np.arange(round(duration * RATE), dtype=np.float32) / RATE


def frequency(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def add(start, signal, pan=0):
    begin = round(start * RATE)
    end = min(begin + len(signal), len(track))
    signal = signal[:end-begin]
    track[begin:end, 0] += signal * math.sqrt((1 - pan) / 2)
    track[begin:end, 1] += signal * math.sqrt((1 + pan) / 2)


def piano(start, note, power=.09, pan=0):
    t = time(3.5)
    f = frequency(note)
    signal = np.zeros_like(t)
    for harmonic, gain, decay in [(1,.74,1.05),(2,.21,.47),(3,.09,.32),(5,.026,.22)]:
        signal += gain * np.sin(2*np.pi*f*harmonic*t) * np.exp(-t/decay)
    signal *= power * np.minimum(1, t/.016)
    add(start, signal, pan)
    add(start+.185, signal*.15, -pan)
    add(start+.32, signal*.073, pan*.3)


def bowl(start, root, power, decay=2.4):
    t = time(6)
    f = frequency(root)
    signal = (
        .71*np.sin(2*np.pi*f*t)
        + .29*np.sin(2*np.pi*f*2.01*t)
        + .11*np.sin(2*np.pi*f*3.08*t)
        + .05*np.sin(2*np.pi*f*4.95*t)
    )
    add(start, power * signal * np.minimum(1, t/.08) * np.exp(-t/decay), .18)


def strings(start, duration, chord, power, swell=.34):
    t = time(duration)
    shape = np.minimum(1, t/1.1) * np.minimum(1, (duration-t)/1.35)
    shape *= swell + (1-swell)*np.sin(np.pi*.5*t/duration)**1.45
    for i, note in enumerate(chord):
        f = frequency(note)
        vibrato = .16*np.sin(2*np.pi*(4.5+i*.22)*t)
        signal = np.zeros_like(t)
        for partial in range(1, 8):
            phase = 2*np.pi*f*partial*t + vibrato*partial
            signal += (np.sin(phase) + .27*np.sin(phase*1.004)) / partial**1.75
        add(start, signal * shape * power / (1+i*.21), -.42 + i*.26)


def kick(start, power):
    t = time(.45)
    phase = 2*np.pi*(43*t + 39*.035*(1-np.exp(-t/.035)))
    signal = np.sin(phase)*np.exp(-t/.095) + .11*np.sin(2*phase)*np.exp(-t/.041)
    add(start, power * signal * np.minimum(1, t/.009))


def paper(start, power, pan, duration=.12):
    t = time(duration)
    white = rng.normal(0, 1, len(t)).astype(np.float32)
    colored = np.convolve(white, np.ones(11)/11, mode='same')
    noise = .83 * colored + .12 * white
    add(start, power * noise * np.sin(np.pi*t/duration)**1.8, pan)


bowl(.24, 50, .072)
piano(3, 38, .136, -.12)  # D2, rack focus
piano(4.88, 57, .07, .26)
strings(0, 8.5, [38,45,53,57], .036)
strings(6, 8.5, [38,45,50,53], .061)
strings(12.75, 6.3, [34,41,50,53], .057)

for beat in range(20):
    at = 6 + PULSE * beat
    if at >= 18:
        break
    kick(at, .16 if beat % 4 == 0 else .118)
    if beat % 2 == 0:
        piano(at+.14, [50,57,62,65,62,57,53,60][beat//2 % 8], .054, (-1)**(beat//2)*.27)
for i in range(36):
    paper(7.1 + i*.118, .072 + (i % 5)*.008, (-1)**i * .41)
for i in range(24):
    piano(10.45 + i*.094, [50,53,57,62,65,69][i%6], .024 + i*.0009, (i%6-2.5)*.12)

strings(17.5, 6.4, [38,45,53,62], .088)
strings(22.1, 7.4, [33,43,52,61], .094, .47)
for beat in range(20):
    at = 18 + CHASE*beat
    kick(at, .20 if beat % 4 == 0 else .137)
    for step in range(2):
        p = (beat * 2 + step) % 8
        piano(at + step * CHASE / 2, [50,57,62,65,69,65,62,57][p], .063 + .021*(step==0), (p-3.5)*.10)
    if beat in (4,8,12,16):
        paper(at-.08, .2, .25*(-1)**(beat//4), .31)

# D minor to D major, with F sharp taking over at the flip.
strings(RISE, 9.4, [38,45,54,62,69], .106, .87)
strings(34.25, 10.75, [38,45,54,57,64], .068, .73)
for offset, note in [(0,50),(.31,54),(.62,57),(.95,62),(2.5,66),(5.89,62),(6.52,57),(7.14,54),(8.39,50),(9.64,57),(12.89,74)]:
    piano(RISE+offset, note, .11 if offset < 1 else .064, .21)
bowl(42, 86, .073, 1.5)

track[-RATE*2:] *= np.linspace(1, 0, RATE*2)[:,None]
samples = (np.tanh(track * 1.03) * 32767).astype('<i2')
with wave.open(sys.argv[1], 'wb') as out:
    out.setnchannels(2)
    out.setsampwidth(2)
    out.setframerate(RATE)
    out.writeframes(samples.tobytes())
