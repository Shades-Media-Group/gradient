"""Shades sonic logo: the Spectrum versions, synthesised from code.

Every sound is rebuilt exactly from this file: no samples, no generated audio.
The motif is three notes at the mark's three strengths (100 / 75 / 50 %).

    python3 -m venv .venv && .venv/bin/pip install numpy scipy pyloudnorm
    .venv/bin/python render.py            # writes directions/*.wav|m4a|mp3 and audit.json

Needs ffmpeg with libmp3lame on PATH.
"""

import json
import subprocess
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

SR = 48_000
TARGET_LUFS = -16.0  # rulebook 16-sound: logo and interface sounds
CEILING_DBTP = -1.2  # true peak stays under -1 dBTP with margin
STRENGTH = (1.0, 0.75, 0.5)  # the three bars
OUT = Path(__file__).parent / "directions"
RNG = np.random.default_rng(23)  # fixed seed: same file every run


def hz(note):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    return 440.0 * 2 ** ((names[note[:-1]] + 12 * (int(note[-1]) + 1) - 69) / 12)


def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def fade(sig, ms_in=2, ms_out=30):
    n_in, n_out = int(SR * ms_in / 1000), int(SR * ms_out / 1000)
    sig[:n_in] *= np.linspace(0, 1, n_in)
    sig[-n_out:] *= np.linspace(1, 0, n_out) ** 2
    return sig


# ---- voices -----------------------------------------------------------------

def warm(f, dur, vel, attack=0.012, decay=2.2, cut=(1.6, 6.6), open_at=0.0, open_time=1.0,
         detunes=(-0.0025, 0.0, 0.0025)):
    """The Spectrum voice, general form: a warm saw-like tone whose filter opens, dark blue to warm orange.

    f is a frequency in Hz or an array per sample (for a glide). cut is the filter's start and end,
    in multiples of the note.
    """
    t = t_axis(dur)
    f = np.broadcast_to(np.asarray(f, float), t.shape)
    env = (1 - np.exp(-t / attack)) * np.exp(-t / decay)
    cutoff = f * (cut[0] + (cut[1] - cut[0]) * np.clip((t - open_at) / open_time, 0, 1) ** 1.5)
    sig = np.zeros_like(t)
    for d in detunes:
        phase = 2 * np.pi * np.cumsum(f * (1 + d)) / SR
        for k in range(1, 32):
            if f.max() * (1 + d) * k > 16_000:
                break
            sig += 1 / np.sqrt(1 + (k * f / cutoff) ** 4) / k * np.sin(k * phase + k * d * 900)
    return fade(sig / len(detunes) * env * vel)


def glide(steps, dur, ms=45):
    """Frequency curve through (time, note) steps, each change gliding over `ms`."""
    t = t_axis(dur)
    curve = np.full(t.size, np.log(hz(steps[0][1])))
    for at, note in steps[1:]:
        target = np.log(hz(note))
        k = np.clip((t - at) / (ms / 1000), 0, 1)
        k = k * k * (3 - 2 * k)  # smoothstep
        curve = curve + (target - curve) * k
    return np.exp(curve)


def sine(f, dur, vel, attack=0.05):
    t = t_axis(dur)
    return fade(np.sin(2 * np.pi * f * t) * (1 - np.exp(-t / attack)) * np.exp(-t / 1.2) * vel)


# ---- space ------------------------------------------------------------------

def room(seconds=2.2, damp=4500):
    """Our own stereo impulse response: decorrelated decaying noise."""
    t = t_axis(seconds)
    ir = RNG.standard_normal((t.size, 2)) * np.exp(-t / (seconds / 6.9))[:, None]
    ir = sosfilt(butter(1, damp, fs=SR, output="sos"), ir, axis=0)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt((ir ** 2).sum(axis=0))


def place(track, sig, at, pan=0.0):
    i = int(at * SR)
    end = min(track.shape[0], i + sig.size)
    track[i:end, 0] += sig[: end - i] * np.sqrt((1 - pan) / 2)
    track[i:end, 1] += sig[: end - i] * np.sqrt((1 + pan) / 2)


def mix(dry, wet_amount, ir_seconds=2.2, damp=4500):
    ir = room(ir_seconds, damp)
    mono = dry.sum(axis=1)
    wet = np.stack([fftconvolve(mono, ir[:, c])[: dry.shape[0]] for c in (0, 1)], axis=1)
    return dry + wet * wet_amount


# ---- master -----------------------------------------------------------------

def true_peak_db(x):
    return 20 * np.log10(np.abs(resample_poly(x, 4, 1, axis=0)).max() + 1e-12)


def limit(x, ceiling_db):
    """Look-ahead peak limiter on the 4x true-peak envelope: 1.5 ms ahead, 80 ms release."""
    look = int(0.0015 * SR)
    env = np.abs(resample_poly(x, 4, 1, axis=0)).max(axis=1).reshape(-1, 4).max(axis=1)[: x.shape[0]]
    need = np.minimum(1.0, 10 ** (ceiling_db / 20) / np.maximum(maximum_filter1d(env, 2 * look + 1), 1e-9))
    need = uniform_filter1d(need, look + 1)
    gain, g, rel = np.empty_like(need), 1.0, 1 / (0.08 * SR)
    for n, v in enumerate(need):
        g = v if v < g else min(v, g + rel)
        gain[n] = g
    return x * gain[:, None]


def master(x):
    x = sosfilt(butter(2, 40, "highpass", fs=SR, output="sos"), x, axis=0)
    meter = pyln.Meter(SR, block_size=0.4)
    for _ in range(10):
        x = x * 10 ** ((TARGET_LUFS - meter.integrated_loudness(x)) / 20)
        if true_peak_db(x) <= CEILING_DBTP:
            break
        x = limit(x, CEILING_DBTP - 0.3)
    n = int(0.3 * SR)  # held tones: a long fade, so the tail settles instead of stopping
    x[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    return x


# ---- the versions -----------------------------------------------------------
# Round 1 kept only B; struck glass (A) and plucked string (C) were rejected by the Owner.
# Round 2: five new versions of B. Notes stay in B major's colour: F#, B, C#.

NOTES_B = ("F#4", "B4", "C#5")
WIDE = (-0.006, -0.003, 0.0, 0.003, 0.006)


def spectrum_b():
    """Round 1 B, unchanged: short, short, long, then the colour opens."""
    track = np.zeros((int(2.9 * SR), 2))
    for n, at, s, p in zip(NOTES_B, (0.0, 0.14, 0.34), STRENGTH, (-0.3, 0.3, 0.0)):
        place(track, warm(hz(n), 2.9 - at, s, open_at=0.4 - at, open_time=1.1), at, p)
    place(track, sine(hz("B2"), 2.5, 0.35, attack=0.2), 0.34)
    return mix(track, 0.3, 2.4, 5000)


def wide():
    """B with a fuller voice: five detuned strings of light, a slower bloom, a deeper floor."""
    track = np.zeros((int(3.2 * SR), 2))
    for n, at, s, p in zip(NOTES_B, (0.0, 0.14, 0.34), STRENGTH, (-0.35, 0.35, 0.0)):
        place(track, warm(hz(n), 3.2 - at, s, attack=0.03, decay=2.6, cut=(1.3, 8.0),
                          open_at=0.35 - at, open_time=1.3, detunes=WIDE), at, p)
    place(track, sine(hz("B2"), 2.8, 0.4, attack=0.25), 0.34)
    place(track, sine(hz("B1"), 2.8, 0.25, attack=0.4), 0.34)
    return mix(track, 0.35, 2.8, 5000)


def arc():
    """Up a fifth, then a step down to rest: F#, C#, B. Ends at home instead of leaning on."""
    track = np.zeros((int(3.0 * SR), 2))
    for n, at, s, p in zip(("F#4", "C#5", "B4"), (0.0, 0.16, 0.38), STRENGTH, (-0.3, 0.3, 0.0)):
        place(track, warm(hz(n), 3.0 - at, s, attack=0.02, decay=2.4, cut=(1.5, 7.0),
                          open_at=0.42 - at, open_time=1.2, detunes=WIDE), at, p)
    place(track, sine(hz("B2"), 2.6, 0.38, attack=0.2), 0.38)
    return mix(track, 0.32, 2.6, 5000)


def bloom():
    """No attack at all: three notes swell in one after another and open as a single chord."""
    track = np.zeros((int(3.4 * SR), 2))
    for n, at, s, p in zip(("B3", "F#4", "C#5"), (0.0, 0.22, 0.44), STRENGTH, (0.0, -0.35, 0.35)):
        place(track, warm(hz(n), 3.4 - at, s, attack=0.16, decay=2.8, cut=(1.3, 9.0),
                          open_at=0.5 - at, open_time=1.6, detunes=WIDE), at, p)
    place(track, sine(hz("B2"), 3.2, 0.18, attack=0.4), 0.0)
    return mix(track, 0.4, 3.0, 4500)


def stroke():
    """One voice glides F#, B, C# like a single stroke; each note it passes stays behind, fading like the bars."""
    dur = 3.1
    track = np.zeros((int(dur * SR), 2))
    times = (0.0, 0.18, 0.4)
    lead = warm(glide(list(zip(times, NOTES_B)), dur), dur, 0.7, attack=0.015, decay=2.4,
                cut=(1.5, 7.5), open_at=0.45, open_time=1.2, detunes=WIDE)
    place(track, lead, 0.0)
    for n, at, s, p in zip(NOTES_B, times, STRENGTH, (-0.4, 0.4, 0.0)):
        place(track, warm(hz(n), dur - at, s * 0.55, attack=0.08, decay=2.2, cut=(1.2, 5.0),
                          open_at=0.45 - at, open_time=1.2), at, p)
    place(track, sine(hz("B2"), 2.6, 0.35, attack=0.2), 0.4)
    return mix(track, 0.32, 2.6, 5000)


def cinema():
    """For the TV open: B's notes over a slow low swell, the colour opening further and longer."""
    dur = 3.8
    track = np.zeros((int(dur * SR), 2))
    for n, at, s, p in zip(NOTES_B, (0.25, 0.42, 0.66), STRENGTH, (-0.35, 0.35, 0.0)):
        place(track, warm(hz(n), dur - at, s, attack=0.025, decay=3.0, cut=(1.2, 10.0),
                          open_at=0.7 - at, open_time=2.0, detunes=WIDE), at, p)
    place(track, sine(hz("B1"), dur, 0.45, attack=0.5), 0.0)
    place(track, sine(hz("B2"), dur - 0.2, 0.3, attack=0.5), 0.2)
    return mix(track, 0.45, 3.4, 4500)


DIRECTIONS = {"b-spectrum": spectrum_b, "b2-wide": wide, "b3-arc": arc, "b4-bloom": bloom,
              "b5-stroke": stroke, "b6-cinema": cinema}


# ---- audit ------------------------------------------------------------------

def audit(x):
    mono = x.mean(axis=1)
    spec = np.abs(np.fft.rfft(mono)) ** 2
    freqs = np.fft.rfftfreq(mono.size, 1 / SR)
    bands = {"sub <120": (0, 120), "low 120-400": (120, 400), "mid 400-2k": (400, 2000),
             "presence 2k-6k": (2000, 6000), "air >6k": (6000, SR / 2)}
    phone = sosfilt(butter(4, [400, 7000], "bandpass", fs=SR, output="sos"), x, axis=0)
    meter = pyln.Meter(SR, block_size=0.4)
    return {
        "seconds": round(x.shape[0] / SR, 2),
        "lufs": round(meter.integrated_loudness(x), 2),
        "true_peak_dbtp": round(true_peak_db(x), 2),
        "clipped_samples": int((np.abs(x) >= 1.0).sum()),
        "band_energy_pct": {k: round(100 * spec[(freqs >= lo) & (freqs < hi)].sum() / spec.sum(), 1)
                            for k, (lo, hi) in bands.items()},
        "phone_speaker_lufs": round(meter.integrated_loudness(phone), 2),
        "last_50ms_peak_db": round(20 * np.log10(np.abs(x[-int(0.05 * SR):]).max() + 1e-12), 1),
    }


def write(name, x):
    OUT.mkdir(exist_ok=True)
    stem = OUT / f"shades-logo-{name}-{x.shape[0] / SR:.1f}s"
    raw = stem.with_suffix(".f32")
    np.clip(x, -1, 1).astype("<f4").tofile(raw)
    base = ["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(raw)]
    subprocess.run(base + ["-c:a", "pcm_s24le", f"{stem}.wav"], check=True)
    subprocess.run(base + ["-c:a", "aac", "-b:a", "256k", f"{stem}.m4a"], check=True)
    subprocess.run(base + ["-c:a", "libmp3lame", "-b:a", "256k", f"{stem}.mp3"], check=True)
    raw.unlink()
    return stem


if __name__ == "__main__":
    report = {}
    for name, build in DIRECTIONS.items():
        x = master(build())
        stem = write(name, x)
        report[stem.name] = audit(x)
        assert report[stem.name]["true_peak_dbtp"] <= -1.0, stem.name
        assert abs(report[stem.name]["lufs"] - TARGET_LUFS) < 0.5, stem.name
    (OUT / "audit.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
