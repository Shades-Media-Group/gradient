"""Shades sonic logo, round 3: eight ideas as different from one another as we can make them.

Each one is made the way a foley artist works: a voice, a breath, the mouth, paper, glass,
bottles, a felt piano. All of it is synthesised here (formant voices, resonators, modal objects),
so we still own every sound. Then each goes through the same finish a studio would give it:
human timing and pitch, tape saturation, EQ, glue compression and a real-sized room.

    .venv/bin/python ideas.py            # all eight
    .venv/bin/python ideas.py hum glass  # only those
"""

import json
import sys

import numpy as np
from scipy.ndimage import uniform_filter1d
from scipy.signal import butter, lfilter, sosfilt

from render import (OUT, RNG, SR, STRENGTH, TARGET_LUFS, VOICE, audit, csound, hz, master, mix,
                    place, release, spectrum_b, t_axis, write)

# ---- small tools ------------------------------------------------------------

def human(at, ms=7):
    """A player is never on the grid."""
    return max(0.0, at + RNG.normal(0, ms / 1000))


def cents(f, c):
    return f * 2 ** (c / 1200)


def env(n, attack, end, rel, decay=60.0):
    """Rise, hold, then a cosine outro from `end` over `rel` seconds."""
    t = np.arange(n) / SR
    return (1 - np.exp(-t / max(attack, 1e-4))) * np.exp(-t / decay) * 0.5 * (1 + np.cos(np.pi * release(t, end, rel)))


def pink(n):
    spec = np.fft.rfft(RNG.standard_normal(n))
    spec[1:] /= np.sqrt(np.arange(1, spec.size))
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-12)


def biquad(kind, f, q=0.707, db=0.0):
    """RBJ cookbook filters as one second-order section."""
    w, a = 2 * np.pi * f / SR, 10 ** (db / 40)
    cw, al = np.cos(w), np.sin(w) / (2 * q)
    if kind == "bp":
        b, A = [al, 0, -al], [1 + al, -2 * cw, 1 - al]
    elif kind == "peak":
        b, A = [1 + al * a, -2 * cw, 1 - al * a], [1 + al / a, -2 * cw, 1 - al / a]
    elif kind == "highshelf":
        s = 2 * np.sqrt(a) * al
        b = [a * ((a + 1) + (a - 1) * cw + s), -2 * a * ((a - 1) + (a + 1) * cw), a * ((a + 1) + (a - 1) * cw - s)]
        A = [(a + 1) - (a - 1) * cw + s, 2 * ((a - 1) - (a + 1) * cw), (a + 1) - (a - 1) * cw - s]
    b, A = np.array(b) / A[0], np.array(A) / A[0]
    return np.concatenate([b, A])[None, :]


def ring(x, f, q):
    """A resonator: what a bottle, a glass or a mouth does to the air pushed into it."""
    return sosfilt(biquad("bp", f, q), x)


# ---- sources: the mouth, hands and objects ----------------------------------

def breath(dur, f=1800, width=1.4, attack=0.12, end=None, rel=0.15):
    n = int(dur * SR)
    return ring(pink(n), f, width) * env(n, attack, end if end is not None else dur - rel, rel)


def snap():
    """Finger snap: a dry crack, a ringing skin tone and a little low knock."""
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    burst = RNG.standard_normal(n) * np.exp(-t / 0.004)
    crack = sosfilt(butter(2, 1500, "highpass", fs=SR, output="sos"), burst)
    tone = ring(burst, 2700, 6) * 3 + ring(burst, 1250, 4)
    knock = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.012) * 0.25
    return crack * 0.6 + tone + knock


def cheek_pop(f):
    """A finger flicked out of the cheek: a short pitched pop that falls as the mouth closes."""
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    fall = f * (1 - 0.06 * (1 - np.exp(-t / 0.05)))
    body = np.sin(2 * np.pi * np.cumsum(fall) / SR) * np.exp(-t / 0.045)
    air = ring(RNG.standard_normal(n) * np.exp(-t / 0.006), f * 2.1, 5) * 0.25
    return (body + air) * (1 - np.exp(-t / 0.0015))


def paper_swish(dur=0.42):
    """A sheet slid across a desk: noise that brightens as it speeds up, with small crinkles."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = pink(n)
    crinkle = uniform_filter1d((RNG.random(n) > 0.9993).astype(float) * RNG.random(n) * 6, 60)
    out = np.zeros(n)
    for i, f in enumerate(np.geomspace(700, 3600, 8)):  # the swept band, in eight overlapping slices
        w = np.exp(-((t / dur - i / 7) ** 2) / 0.03)
        out += ring(x, f, 1.2) * w
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return out * shape * (1 + crinkle)


def pen_click():
    """A ballpoint clicked: two plastic ticks, 28 ms apart."""
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for at, level in ((0, 1.0), (0.028, 0.6)):
        i = int(at * SR)
        b = RNG.standard_normal(n - i) * np.exp(-t[: n - i] / 0.0015)
        out[i:] += (ring(b, 3400, 9) + ring(b, 1700, 6) * 0.6) * level
    return out


def felt_piano(note, dur, vel, end, rel=0.35):
    """A felted upright: stretched partials, two strings beating, a soft hammer and a damper."""
    f = hz(note)
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    phases = RNG.random(18) * 6.28  # one hammer strikes both strings: same phase on each
    for detune in (-0.8, 0.8):
        for k in range(1, 18):
            fk = cents(f, detune) * k * np.sqrt(1 + 0.00035 * k * k)
            if fk > 9000:
                break
            felt = 1 / (1 + (fk / (f * 3.5)) ** 2)  # felt softens the hammer: highs fall away
            sig += felt / k ** 0.9 * np.sin(2 * np.pi * fk * t + phases[k]) * np.exp(-t / (3.2 / (1 + 0.25 * k)))
    hammer = sosfilt(butter(2, 900, fs=SR, output="sos"), RNG.standard_normal(n) * np.exp(-t / 0.003)) * 0.6
    damper = np.zeros(n)
    i = int(end * SR)
    if i < n:  # the felt lands on the strings: a soft thud at the outro
        damper[i:] = sosfilt(butter(2, 300, fs=SR, output="sos"), RNG.standard_normal(n - i) * np.exp(-t[: n - i] / 0.02)) * 0.15
    return (sig * env(n, 0.002, end, rel) * 0.25 + hammer + damper) * vel


def whistle(steps, dur, end, rel):
    """One person whistling: glides between notes, scoops, a late vibrato, breath on the tone,
    and the pitch falls away as the lips relax."""
    t = t_axis(dur)
    logf = np.full(t.size, np.log(hz(steps[0][1])))
    for at, note in steps[1:]:
        k = np.clip((t - at) / 0.05, 0, 1)
        logf += (np.log(hz(note)) - logf) * k * k * (3 - 2 * k)
    vib = np.clip((t - 0.5) / 0.4, 0, 1) * 0.006 * np.sin(2 * np.pi * 5.6 * t)
    wander = uniform_filter1d(RNG.standard_normal(t.size), 4000) * 0.04
    fall = -0.035 * release(t, end, rel) ** 1.5
    f = np.exp(logf) * (1 + vib + wander + fall)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    a = env(t.size, 0.025, end, rel)
    for at, _ in steps[1:]:  # the tongue moves between notes: a small dip
        a *= 1 - 0.35 * np.exp(-((t - at) / 0.018) ** 2)
    air = ring(pink(t.size), 2600, 1.0) * 0.07 + ring(RNG.standard_normal(t.size), float(np.median(f)), 6) * 0.06
    return (tone + air) * a


def bottle(note, dur, at_end, rel):
    """Blowing across a bottle: a jet of breath that the bottle's neck turns into one note."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = cents(hz(note), -15)
    jet = pink(n) * (1 + 1.8 * np.exp(-t / 0.08))  # harder at the start, as the lips find the edge
    tone = ring(jet, f, 70) * 9 + ring(jet, f * 2.9, 40) * 0.6
    rush = ring(jet, 1500, 0.9) * 0.18 * (0.4 + np.exp(-t / 0.15))
    return (tone + rush) * env(n, 0.06, at_end, rel)


def rubbed_glass(note, dur, end, rel):
    """A wet finger round a wine glass: a pure, slowly beating tone with a faint squeak."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(note)
    rub = 1 + 0.12 * uniform_filter1d(RNG.standard_normal(n), 2400) * 8  # the finger's pressure changes
    tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * (f + 0.9) * t + 1)  # split mode: beating
            + 0.06 * np.sin(2 * np.pi * f * 2.32 * t) + 0.02 * np.sin(2 * np.pi * f * 4.25 * t))
    squeak = ring(RNG.standard_normal(n), 3000, 2) * 0.012
    return (tone * rub + squeak) * env(n, 0.45, end, rel)


# ---- the finish: what turns a raw take into a produced sound -----------------

def tape(x, drive=1.6, mix_=0.35, wow=0.0):
    """Asymmetric saturation (warmth, even harmonics) and, optionally, slow tape wow."""
    if wow:
        t = np.arange(x.shape[0]) / SR
        delay = (wow / 1200) / (2 * np.pi * 0.55) * np.sin(2 * np.pi * 0.55 * t) * SR + 30
        idx = np.clip(np.arange(x.shape[0]) - delay, 0, x.shape[0] - 1)
        x = np.stack([np.interp(idx, np.arange(x.shape[0]), x[:, c]) for c in (0, 1)], axis=1)
    peak = np.abs(x).max() + 1e-12
    y = x / peak
    sat = np.tanh(drive * (y + 0.08)) - np.tanh(drive * 0.08)
    sat = sosfilt(butter(1, 20, "highpass", fs=SR, output="sos"), sat, axis=0)
    return (y * (1 - mix_) + sat / np.abs(sat).max() * mix_) * peak


def eq(x, mud=-2.5, presence=1.5, air=2.0):
    for sos in (butter(2, 55, "highpass", fs=SR, output="sos"), biquad("peak", 280, 1.0, mud),
                biquad("peak", 3200, 0.8, presence), biquad("highshelf", 9000, 0.7, air)):
        x = sosfilt(sos, x, axis=0)
    return x


def glue(x, ratio=2.2, below_peak_db=12):
    """A slow bus compressor: the parts sit together, transients still come through."""
    level = np.sqrt(uniform_filter1d((x ** 2).mean(axis=1), int(0.01 * SR)) + 1e-12)
    thresh = level.max() * 10 ** (-below_peak_db / 20)
    over = np.maximum(level / thresh, 1)
    gain = over ** (1 / ratio - 1)
    a = np.exp(-1 / (0.12 * SR))
    gain = lfilter([1 - a], [1, -a], gain, zi=[a * gain[0]])[0]  # 120 ms release, starting at the first gain, not at silence
    return x * gain[:, None]


def finish(x, wet=0.25, hall=2.0, damp=5500, close=0.12, drive=1.6, sat=0.35, wow=0.0, **tone):
    x = np.pad(x, ((0, int(0.7 * SR)), (0, 0)))  # room for the room to ring out
    x = tape(x, drive, sat, wow)
    x = eq(x, **tone)
    x = glue(x)
    x = mix(x, close, 0.45, 8000)  # a real room's first reflections: the sound is somewhere
    return mix(x, wet, hall, damp)


def stage(seconds):
    return np.zeros((int(seconds * SR), 2))


# ---- the eight ideas ---------------------------------------------------------

NOTES = ("F#4", "B4", "C#5")


def hum():
    """Hum: one person hums the three notes, double-tracked, after a breath in.
    The lips part as the colour opens: mm, then oo."""
    end, rel, dur = 2.0, 1.1, 3.6
    x = stage(dur)
    place(x, breath(0.32, 1500, 1.2, 0.2) * 0.25, 0.0)
    score = []
    for take, pan in ((0, 0.35), (1, 0.65)):
        for n, at, s in zip(NOTES, (0.3, 0.48, 0.78), STRENGTH):
            a = human(at, 12)
            score.append((VOICE, a, dur - a, (n, RNG.normal(0, 5)), 0.5 * s, pan, end, rel, 0.5, 1.2, 0.07, 0.55))
    x += csound(score, dur, room=(0.0, 0.5, 5000))  # dry: the finish adds the room
    return finish(x, wet=0.28, hall=1.8)


def choir():
    """Choir: sixteen voices on a wide B chord swell from oo to ah and settle."""
    end, rel, dur = 2.0, 1.2, 3.9
    score = []
    for n, lvl in (("B2", 0.6), ("F#3", 0.5), ("B3", 0.55), ("F#4", 0.45), ("B4", 0.4), ("C#5", 0.3)):
        for v in range(3):
            a = human(0.05 + v * 0.03, 25)
            score.append((VOICE, a, dur - a, (n, RNG.normal(0, 7)), lvl * 0.4, RNG.uniform(0.1, 0.9),
                          end + RNG.normal(0, 0.05), rel, 0.6, 1.4, 0.55, 0.95))
    x = csound(score, dur, room=(0.0, 0.5, 5000))
    return finish(x, wet=0.45, hall=3.2, damp=4500, mud=-3)


def whistled():
    """Whistle: a finger snap, then the three notes whistled, short-short-long."""
    end, rel, dur = 1.55, 0.55, 2.7
    x = stage(dur)
    place(x, snap() * 0.5, 0.0, -0.2)
    w = whistle([(0, "F#5"), (human(0.15, 5) - 0.12, "B5"), (human(0.33, 5) - 0.12, "C#6")], dur - 0.12, end - 0.12, rel)
    place(x, w * 0.5, 0.12, 0.1)
    return finish(x, wet=0.2, hall=1.4, close=0.18, presence=0.5, air=0.5)


def bottles():
    """Bottles: three bottles blown one after another, each a breath, held as a chord."""
    end, rel, dur = 2.3, 0.9, 3.6
    x = stage(dur)
    for (n, at, s), pan in zip(zip(NOTES, (0.0, 0.32, 0.64), STRENGTH), (-0.4, 0.4, 0.0)):
        a = human(at, 15)
        place(x, bottle(n, dur - a, end - a, rel) * s, a, pan)
    return finish(x, wet=0.22, hall=1.6, close=0.2, sat=0.25)


def glass():
    """Glass: three wine glasses rubbed into song, one by one, beating gently."""
    end, rel, dur = 2.2, 1.1, 4.0
    x = stage(dur)
    for (n, at, s), pan in zip(zip(("F#5", "B5", "C#6"), (0.0, 0.38, 0.76), STRENGTH), (-0.5, 0.5, 0.0)):
        a = human(at, 20)
        place(x, rubbed_glass(n, dur - a, end - a, rel) * s, a, pan)
    return finish(x, wet=0.4, hall=3.0, damp=7000, sat=0.2, presence=0.0, air=1.0)


def paper():
    """Ink and paper: a sheet slides, a pen clicks, a felt piano rolls the three notes over a low B."""
    end, rel, dur = 2.1, 0.45, 3.2
    x = stage(dur)
    place(x, paper_swish() * 0.35, 0.0, -0.3)
    place(x, pen_click() * 0.5, 0.44, 0.25)
    chord = (("B2", 0.3), ("F#4", 1.0), ("B4", 0.75), ("C#5", 0.5))
    for i, (n, v) in enumerate(chord):
        a = human(0.5 + i * 0.045, 4)
        place(x, felt_piano(n, dur - a, v, end - a, rel), a, (i - 1.5) * 0.25)
    return finish(x, wet=0.18, hall=1.2, close=0.2, sat=0.4, mud=-1.5, air=1.0)


def mouth():
    """Mouth: three cheek pops at the three notes, then a hummed low B holds and fades."""
    end, rel, dur = 1.9, 1.0, 3.2
    x = stage(dur)
    for (n, at, s), pan in zip(zip(("F#5", "B5", "C#6"), (0.0, 0.13, 0.3), STRENGTH), (-0.2, 0.2, 0.0)):
        place(x, cheek_pop(cents(hz(n), RNG.normal(0, 8))) * s, human(at, 5), pan)
    score = [(VOICE, 0.28, dur - 0.28, ("B3", 0), 0.35, 0.45, end, rel, 0.5, 1.0, 0.12, 0.35),
             (VOICE, 0.3, dur - 0.3, ("F#4", 4), 0.2, 0.6, end, rel, 0.5, 1.0, 0.15, 0.35)]
    x += csound(score, dur, room=(0.0, 0.5, 5000))
    return finish(x, wet=0.22, hall=1.5, close=0.15)


def spectrum_tape():
    """Spectrum, produced: the Owner's favourite with a felt piano under each note,
    printed to tape."""
    x = spectrum_b()
    dur = x.shape[0] / SR
    for (n, at, s) in zip(NOTES, (0.0, 0.14, 0.34), STRENGTH):
        place(x, felt_piano(n, dur - at, 0.04 * s, 1.9 - at, 0.6), at)
    return finish(x, wet=0.12, hall=1.8, close=0.1, sat=0.45, wow=6)


IDEAS = {"i1-hum": hum, "i2-choir": choir, "i3-whistle": whistled, "i4-bottles": bottles,
         "i5-glass": glass, "i6-paper": paper, "i7-mouth": mouth, "i8-spectrum-tape": spectrum_tape}


def run(table):
    """Render the ideas named on the command line (all when none), audit and record each one."""
    todo = {k: v for k, v in table.items() if len(sys.argv) < 2 or any(a in k for a in sys.argv[1:])}
    path = OUT / "audit.json"
    report = json.loads(path.read_text()) if path.exists() else {}
    for name, build in todo.items():
        report = {k: v for k, v in report.items() if not k.startswith(f"shades-logo-{name}-")}
        x = master(build())
        stem = write(name, x)
        report[stem.name] = a = audit(x)
        assert a["true_peak_dbtp"] <= -1.0 and abs(a["lufs"] - TARGET_LUFS) < 0.5, stem.name
        b = a["band_energy_pct"]
        print(f"{stem.name:34} {a['lufs']:6} tp {a['true_peak_dbtp']:5} phone {a['phone_speaker_lufs']:6} "
              f"sub {b['sub <120']:4} low {b['low 120-400']:4} mid {b['mid 400-2k']:4} pres {b['presence 2k-6k']:4} "
              f"air {b['air >6k']:4} last50 {a['last_50ms_peak_db']}")
    path.write_text(json.dumps(dict(sorted(report.items())), indent=2) + "\n")


if __name__ == "__main__":
    run(IDEAS)
