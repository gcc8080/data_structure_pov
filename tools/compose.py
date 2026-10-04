#!/usr/bin/env python3
"""
DATA STRUCTURES — original score, fully synthesized.

120 BPM, A minor, 150 bars = 300 s. Every musical event is written to
events.json so the visuals can hit the exact same beats.

    python3 tools/compose.py  ->  build/score.wav, src/events.js
"""
import json, os
import numpy as np
from scipy.signal import butter, lfilter, fftconvolve

SR = 44100
BPM = 120
BEAT = 60 / BPM            # 0.5 s
BAR = BEAT * 4             # 2.0 s
BARS = 150
DUR = BARS * BAR           # 300 s
N = int(DUR * SR) + SR * 4  # tail room, trimmed later
rng = np.random.default_rng(20261003)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def S(t): return int(round(t * SR))

# ------------------------------------------------------------------ buses
dryL = np.zeros(N); dryR = np.zeros(N)       # dry master
duckL = np.zeros(N); duckR = np.zeros(N)     # sidechained (pads/bass/arp)
revL = np.zeros(N); revR = np.zeros(N)       # reverb send

def put(bus, t, sig, gain=1.0):
    i = S(t)
    if i >= N: return
    n = min(len(sig), N - i)
    bus[i:i + n] += sig[:n] * gain

def put2(L, R, t, sig, gain=1.0, pan=0.0):
    gl = gain * np.cos((pan + 1) * np.pi / 4)
    gr = gain * np.sin((pan + 1) * np.pi / 4)
    put(L, t, sig, gl); put(R, t, sig, gr)

def lp(x, fc, order=2):
    b, a = butter(order, min(fc, SR / 2 * 0.95) / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)

def saw(f, n, phase0=None):
    ph = (np.arange(n) * f / SR + (rng.random() if phase0 is None else phase0)) % 1.0
    return 2 * ph - 1

def adsr(n, a, d, s, r, total):
    """total = gate length (s); n = samples incl. release"""
    t = np.arange(n) / SR
    env = np.where(t < a, t / max(a, 1e-4),
          np.where(t < a + d, 1 - (1 - s) * (t - a) / max(d, 1e-4), s))
    rel = np.clip((t - total) / max(r, 1e-4), 0, 1)
    return env * (1 - rel)

# ------------------------------------------------------------------ harmony
CH = {  # pad voicings (MIDI) + bass root
    'Am': ([57, 60, 64, 69, 72], 33), 'F': ([53, 57, 60, 65, 69], 29),
    'C':  ([55, 60, 64, 67, 72], 36), 'G': ([55, 59, 62, 67, 71], 31),
    'Dm': ([57, 62, 65, 69, 74], 38), 'E': ([56, 59, 64, 68, 71], 28),
    'Em': ([55, 59, 64, 67, 71], 28),
}
P1 = ['Am', 'F', 'C', 'G']
P2 = ['Am', 'F', 'Dm', 'E']
P3 = ['F', 'G', 'Em', 'Am']

def chord_at(bar):
    if bar < 12: return P1[bar % 4] if bar >= 8 else ['Am', 'Am', 'F', 'F', 'Am', 'Am', 'G', 'E'][bar]
    if 56 <= bar < 72: return (P1 if (bar // 4) % 2 == 0 else P2)[bar % 4]
    if 72 <= bar < 80: return ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'][bar - 72]
    if 90 <= bar < 100: return P2[bar % 4]
    if 100 <= bar < 120: return P3[bar % 4]
    if 120 <= bar < 130: return ['Am', 'Am', 'F', 'F', 'Dm', 'Dm', 'E', 'E', 'E', 'E'][bar - 120]
    if 130 <= bar < 138: return P3[(bar - 130) % 4]
    if bar >= 138: return (['Am', 'F'] + P3 + P3 + ['Am', 'Am'])[bar - 138]
    return P1[bar % 4]

# ------------------------------------------------------------------ arrangement
IMPACTS = [8, 12, 28, 42, 56, 72, 90, 100, 120, 130, 138, 144]

def drum_level(bar):
    if bar < 12: return 0
    if bar < 20: return 1
    if bar < 42: return 2
    if bar < 56: return 2
    if bar < 72: return 3
    if bar < 80: return 0
    if bar < 82: return 1
    if bar < 120: return 3
    if bar < 124: return 0
    if bar < 130: return 1
    if bar < 138: return 3
    return 0

def pad_cut(bar):
    if bar < 8: return 500 + bar * 120
    if bar < 12: return 4200
    if bar < 28: return 1200 + (bar - 12) * 90
    if 72 <= bar < 80: return 1600
    if 100 <= bar < 120 or 130 <= bar < 138: return 5200
    if 120 <= bar < 130: return 700 + (bar - 120) * 250
    if bar >= 138: return 3000
    return 3200

def pad_gain(bar):
    if bar < 8: return 0.10 + bar * 0.018
    if bar < 12: return 0.30
    if 100 <= bar < 120 or 130 <= bar < 138: return 0.26
    if bar >= 146: return 0.22 * (150 - bar) / 4
    return 0.20

events = {"bpm": BPM, "bar": BAR, "kicks": [], "snares": [], "hats": [], "impacts": [b * BAR for b in IMPACTS],
          "bells": [], "arps": [], "risers": [], "lead": []}

# ---------------------------------------------------------------- one-shots
def make_kick():
    n = S(0.55); t = np.arange(n) / SR
    f = 42 + 120 * np.exp(-t * 28) + 300 * np.exp(-t * 160)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5.5)
    click = hp(rng.standard_normal(n), 3000) * np.exp(-t * 300) * 0.25
    return np.tanh((s + click) * 1.6)
def make_snare():
    n = S(0.4); t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22) * 0.6
    nz = bp(rng.standard_normal(n), 1200, 9000) * np.exp(-t * 13)
    cl = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.023]):
        i = S(off); m = n - i
        cl[i:] += bp(rng.standard_normal(m), 900, 4000) * np.exp(-np.arange(m) / SR * (60 if k < 2 else 16)) * 0.6
    return tone + nz * 0.7 + cl
def make_hat(open_=False):
    n = S(0.35 if open_ else 0.08); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500, 4) * np.exp(-t * (9 if open_ else 70))
def make_crash():
    n = S(4.5); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 4500, 2) * (np.exp(-t * 1.3) * 0.9 + np.exp(-t * 12) * 0.5)
def make_boom():
    n = S(4.0); t = np.arange(n) / SR
    f = 28 + 70 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.9)
    nz = lp(rng.standard_normal(n), 900) * np.exp(-t * 4) * 0.8
    return np.tanh((s + nz) * 1.5)
def make_tom(f0):
    n = S(0.45); t = np.arange(n) / SR
    f = f0 * (1 + 0.6 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)

KICK, SNARE, HAT, OHAT, CRASH, BOOM = make_kick(), make_snare(), make_hat(), make_hat(True), make_crash(), make_boom()
TOMS = [make_tom(f) for f in (180, 140, 110, 85)]

def riser(t0, bars, gain=0.35):
    n = S(bars * BAR); t = np.arange(n) / SR; x = t / t[-1]
    nz = rng.standard_normal(n)
    # time-varying one-pole lowpass (cutoff sweeps up)
    fc = 300 + 9000 * x ** 2
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty(n); z = 0.0
    for i in range(n):
        z = (1 - a[i]) * nz[i] + a[i] * z; y[i] = z
    y = hp(y, 200)
    pitch = 110 * 2 ** (x * 3)
    tone = np.sin(2 * np.pi * np.cumsum(pitch) / SR) * 0.15
    sig = (y * 1.6 + tone) * x ** 1.6
    put2(dryL, dryR, t0, sig, gain * 0.7, -0.2); put2(dryL, dryR, t0 + 0.01, sig, gain * 0.7, 0.2)
    put2(revL, revR, t0, sig, gain * 0.5)
    events["risers"].append([t0, t0 + bars * BAR])

def reverse_crash(t_hit, length=BAR):
    sig = CRASH[:S(length)][::-1] * np.linspace(0, 1, S(length)) ** 2
    put2(dryL, dryR, t_hit - length, sig, 0.35); put2(revL, revR, t_hit - length, sig, 0.2)

def impact(t, big=True):
    put2(dryL, dryR, t, BOOM, 0.9 if big else 0.6)
    put2(dryL, dryR, t, CRASH, 0.35, -0.3); put2(dryL, dryR, t, CRASH[::1], 0.35, 0.3)
    put2(revL, revR, t, BOOM, 0.35); put2(revL, revR, t, CRASH, 0.35)
    put2(dryL, dryR, t, KICK, 0.9)

# ---------------------------------------------------------------- drums
for bar in range(BARS):
    lvl = drum_level(bar); t0 = bar * BAR
    if lvl == 0: continue
    for b in range(4):
        tb = t0 + b * BEAT
        if lvl == 1 and b in (0, 2) or lvl >= 2:
            put2(dryL, dryR, tb, KICK, 0.78); events["kicks"].append(tb)
        if lvl >= 2 and b in (1, 3):
            put2(dryL, dryR, tb, SNARE, 0.42); put2(revL, revR, tb, SNARE, 0.18); events["snares"].append(tb)
        if lvl >= 1:
            put2(dryL, dryR, tb + BEAT / 2, OHAT if lvl >= 2 else HAT, 0.12 if lvl >= 2 else 0.10, 0.25)
        if lvl >= 3:
            for s in (0, 1, 3):
                ts = tb + s * BEAT / 4
                put2(dryL, dryR, ts, HAT, 0.07 + 0.03 * (s == 0), -0.3)
                events["hats"].append(ts)
            if b == 3 and bar % 2 == 1:
                put2(dryL, dryR, tb + BEAT * 0.75, KICK, 0.6); events["kicks"].append(tb + BEAT * 0.75)
    # fills on the bar before a section impact
    if (bar + 1) in IMPACTS and lvl >= 2:
        for s in range(8):
            ts = t0 + 2 * BEAT + s * BEAT / 4
            put2(dryL, dryR, ts, TOMS[s // 2], 0.45, -0.5 + s / 7)
            put2(revL, revR, ts, TOMS[s // 2], 0.1)
# snare roll builds
for start, bars in [(18, 2), (70, 2), (80, 2), (118, 2), (128, 2)]:
    t = start * BAR; i = 0
    while t < (start + bars) * BAR - 1e-6:
        frac = (t - start * BAR) / (bars * BAR)
        put2(dryL, dryR, t, SNARE, 0.10 + 0.35 * frac ** 1.5)
        put2(revL, revR, t, SNARE, 0.08 * frac)
        events["snares"].append(t)
        t += BEAT / 2 if frac < 0.25 else BEAT / 4 if frac < 0.6 else BEAT / 8 if frac < 0.88 else BEAT / 16

# ---------------------------------------------------------------- impacts & risers
for b in IMPACTS:
    impact(b * BAR, big=b in (8, 56, 100, 130, 144))
    reverse_crash(b * BAR, BAR if b not in (8, 144) else BAR * 2)
for b, n in [(6, 2), (26, 2), (54, 2), (70, 2), (80, 2), (98, 2), (118, 2), (126, 4), (142, 2)]:
    riser(b * BAR, n, 0.32)

# ---------------------------------------------------------------- pads (supersaw)
DET = np.array([-14, -8, -3, 0, 3, 8, 14]) / 100
for bar in range(BARS):
    if bar >= 150: break
    name = chord_at(bar); notes, _ = CH[name]
    t0 = bar * BAR; gate = BAR; rel = 1.2 if bar < 138 else 2.5
    n = S(gate + rel)
    att = 1.2 if bar < 12 or bar >= 138 or 120 <= bar < 124 else 0.25
    env = adsr(n, att, 0.6, 0.85, rel, gate)
    L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for k, d in enumerate(DET):
            v = saw(f * 2 ** (d / 12), n)
            if k % 2: L += v
            else: R += v
            if d == 0: L += v * 0.5; R += v * 0.5
    cut = pad_cut(bar)
    L = lp(L, cut, 2) * env; R = lp(R, cut, 2) * env
    g = 2.1 * pad_gain(bar) / (len(notes) * 4)
    put(duckL, t0, L, g); put(duckR, t0, R, g)
    put(revL, t0, L, g * 0.6); put(revR, t0, R, g * 0.6)

# ---------------------------------------------------------------- sub + bass
for bar in range(BARS):
    name = chord_at(bar); _, root = CH[name]; t0 = bar * BAR
    if bar >= 148: continue
    f = mtof(root + 12)  # sub one octave above the stored root (A1 -> 55Hz region)
    f = f / 2 if f > 70 else f
    n = S(BAR + 0.3); t = np.arange(n) / SR
    env = adsr(n, 0.02, 0.1, 0.9, 0.3, BAR)
    sub = np.sin(2 * np.pi * f * t) * env
    sg = 0.19 if bar >= 12 else 0.13
    put(duckL, t0, sub, sg); put(duckR, t0, sub, sg)
    lvl = drum_level(bar)
    if lvl >= 2 or (bar >= 16 and lvl >= 1):
        # rolling offbeat bass (8ths, the offbeat style)
        for e in range(8):
            if lvl < 3 and e % 2 == 0: continue
            te = t0 + e * BEAT / 2
            n2 = S(BEAT / 2); tt = np.arange(n2) / SR
            fb = f * 2
            v = (saw(fb, n2) + saw(fb * 1.005, n2)) * 0.5
            v = lp(v, 900, 2)
            v *= np.exp(-tt * 9) * np.minimum(1, tt / 0.004)
            put(duckL, te, v, 0.17); put(duckR, te, v, 0.17)

# ---------------------------------------------------------------- arpeggio
def arp_on(bar):
    return (12 <= bar < 72) or (82 <= bar < 120) or (124 <= bar < 138)
PAT = [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 2, 1, 3, 4, 3]
for bar in range(BARS):
    if not arp_on(bar): continue
    notes, _ = CH[chord_at(bar)]; t0 = bar * BAR
    cut = 1400 + min(1, max(0, (bar - 12) / 16)) * 2600
    if bar >= 100: cut = 5000
    for s in range(16):
        ts = t0 + s * BEAT / 4
        m = notes[PAT[s]] + 12
        n = S(0.22); t = np.arange(n) / SR
        v = (saw(mtof(m), n) * 0.6 + np.sign(np.sin(2 * np.pi * mtof(m) * t)) * 0.4)
        v = lp(v, cut * (0.4 + 0.6 * np.exp(-t * 20)), 2) if False else lp(v, cut, 2)
        v *= np.exp(-t * 16) * np.minimum(1, t / 0.002)
        pan = 0.45 * np.sin(s * np.pi / 4)
        g = 0.10 * (1.0 if s % 4 == 0 else 0.75)
        put2(duckL, duckR, ts, v, g, pan)
        # ping-pong delay 3/16
        for k in range(1, 4):
            put2(duckL, duckR, ts + k * 0.375, v, g * 0.42 ** k, -pan if k % 2 else pan)
        put2(revL, revR, ts, v, g * 0.5)
        events["arps"].append(round(ts, 4))

# ---------------------------------------------------------------- bells (intro "bits", tree breakdown, outro)
PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88]
def bell(t, m, g=0.12, pan=0.0):
    n = S(2.5); tt = np.arange(n) / SR; f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * tt) * 2.2 * np.exp(-tt * 3)
    v = np.sin(2 * np.pi * f * tt + mod) * np.exp(-tt * 2.2) * np.minimum(1, tt / 0.003)
    put2(dryL, dryR, t, v, g, pan); put2(revL, revR, t, v, g * 0.9, pan)
    events["bells"].append(round(t, 4))
# intro: sparse -> dense
t = 0.5
while t < 15.5:
    dens = t / 16
    bell(t, int(rng.choice(PENTA[:5 + int(dens * 4)])), 0.08 + 0.06 * dens, float(rng.uniform(-0.7, 0.7)))
    step = rng.choice([1.0, 0.75, 0.5]) if t < 6 else rng.choice([0.5, 0.25, 0.25]) if t < 12 else 0.125
    t += step
# piano-like broken chords in tree breakdown & outro
def piano(t, m, g=0.1, pan=0.0):
    n = S(2.0); tt = np.arange(n) / SR; f = mtof(m)
    v = sum(np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (2.0 + h * 1.4)) / h for h in (1, 2, 3, 4))
    v *= np.minimum(1, tt / 0.002)
    put2(dryL, dryR, t, v, g, pan); put2(revL, revR, t, v, g * 0.8, pan)
for bar in list(range(72, 82)) + list(range(138, 148)):
    notes, _ = CH[chord_at(bar)]
    for s, idx in enumerate([0, 2, 4, 3, 1, 2, 4, 2]):
        piano(bar * BAR + s * BEAT / 2, notes[idx] + 12, 0.09, -0.4 + 0.1 * s)
        events["bells"].append(round(bar * BAR + s * BEAT / 2, 4))

# ---------------------------------------------------------------- lead melody (graph climax + equation)
MEL = [(72, 2), (69, 1), (72, 1), (74, 2), (71, 1), (74, 1), (76, 3), (79, 1), (76, 2), (72, 1), (71, 1),
       (72, 2), (69, 1), (72, 1), (74, 2), (76, 1), (74, 1), (71, 3), (67, 1), (69, 4)]
def lead_phrase(bar0, reps, g=0.12):
    t = bar0 * BAR
    for _ in range(reps):
        for m, beats in MEL:
            dur = beats * BEAT; n = S(dur + 0.35); tt = np.arange(n) / SR
            f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt) * np.clip((tt - 0.25) * 3, 0, 1))
            v = np.zeros(n)
            for d in (-0.09, 0, 0.09):
                ph = np.cumsum(f * 2 ** (d / 12)) / SR
                v += 2 * (ph % 1) - 1
            v = lp(v, 3800, 2) * adsr(n, 0.01, 0.2, 0.75, 0.3, dur)
            put2(dryL, dryR, t, v, g, 0.0); put2(revL, revR, t, v, g * 0.9)
            for k in (1, 2):
                put2(dryL, dryR, t + k * 0.375, v, g * 0.35 ** k, 0.6 if k == 1 else -0.6)
            events["lead"].append([round(t, 4), m])
            t += dur
lead_phrase(104, 2)            # graph climax, bars 104-119
lead_phrase(130, 1, 0.11)      # equation drop, bars 130-137
lead_phrase(140, 1, 0.07)

# ---------------------------------------------------------------- sidechain
kicks = np.array(sorted(set(events["kicks"])))
tt = np.arange(N) / SR
idx = np.searchsorted(kicks, tt, side='right') - 1
since = np.where(idx >= 0, tt - kicks[np.clip(idx, 0, None)], 10)
duck = 1 - 0.62 * np.exp(-since / 0.11)
duckL *= duck; duckR *= duck

# ---------------------------------------------------------------- reverb
ir_n = S(3.2); it = np.arange(ir_n) / SR
irL = lp(rng.standard_normal(ir_n), 6000) * np.exp(-it * 2.1)
irR = lp(rng.standard_normal(ir_n), 6000) * np.exp(-it * 2.1)
irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
wetL = fftconvolve(revL + duckL * 0.15, irL)[:N]
wetR = fftconvolve(revR + duckR * 0.15, irR)[:N]

L = dryL + duckL + wetL * 0.55
R = dryR + duckR + wetR * 0.55
L = hp(L, 25); R = hp(R, 25)

# ---------------------------------------------------------------- master
Ntot = int(DUR * SR)
L, R = L[:Ntot], R[:Ntot]
fade = np.ones(Ntot); fo = S(6); fade[-fo:] = np.linspace(1, 0, fo) ** 2
L *= fade; R *= fade
pk = max(np.abs(L).max(), np.abs(R).max())
L /= pk; R /= pk
drive = 2.6
L = np.tanh(L * drive) / np.tanh(drive); R = np.tanh(R * drive) / np.tanh(drive)
pk = max(np.abs(L).max(), np.abs(R).max()); L *= 0.93 / pk; R *= 0.93 / pk

from scipy.io import wavfile
wavfile.write(os.path.join(ROOT, "build", "score.wav"), SR,
              (np.stack([L, R], 1) * 32767).astype(np.int16))

for k in ("kicks", "snares", "hats", "impacts", "bells", "arps"):
    events[k] = sorted(set(round(x, 4) for x in events[k]))
os.makedirs(os.path.join(ROOT, "src"), exist_ok=True)
with open(os.path.join(ROOT, "src", "events.js"), "w") as f:
    f.write("// generated by tools/compose.py — exact musical event times (seconds)\n")
    f.write("window.EVENTS = " + json.dumps(events) + ";\n")
print("ok", {k: len(v) if isinstance(v, list) else v for k, v in events.items()})
