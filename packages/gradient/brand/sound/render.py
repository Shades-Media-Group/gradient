"""Shades sonic logo: three directions, synthesised from code.

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

def glass(f, dur, vel):
    """Struck glass bar: inharmonic bar modes, the high ones die fast."""
    t = t_axis(dur)
    modes = [(1.0, 1.0, 1.6), (2.756, 0.32, 0.55), (5.404, 0.12, 0.22), (8.933, 0.05, 0.1)]
    sig = sum(a * np.exp(-t / d) * np.sin(2 * np.pi * f * r * t) for r, a, d in modes)
    contact = sosfilt(butter(2, [800, 5000], "bandpass", fs=SR, output="sos"), RNG.standard_normal(t.size))
    sig += 0.35 * np.exp(-t / 0.004) * contact * vel  # mallet contact
    return fade(sig * vel)


def spectrum(f, dur, vel, open_at=0.0, open_time=1.0):
    """Warm saw-like voice whose filter opens over time: blue to orange."""
    t = t_axis(dur)
    env = (1 - np.exp(-t / 0.012)) * np.exp(-t / 2.2)
    cutoff = f * (1.6 + 5.0 * np.clip((t - open_at) / open_time, 0, 1) ** 1.5)
    sig = np.zeros_like(t)
    for detune in (-0.0025, 0.0, 0.0025):
        fk = f * (1 + detune)
        for k in range(1, 24):
            if fk * k > 16_000:
                break
            lp = 1 / np.sqrt(1 + (k * fk / cutoff) ** 4)
            sig += lp / k * np.sin(2 * np.pi * fk * k * t + k * detune * 900)
    return fade(sig / 3 * env * vel)


def pluck(f, dur, vel):
    """Plucked string: harmonics decay faster the higher they sit."""
    t = t_axis(dur)
    sig = np.zeros_like(t)
    for k in range(1, 18):
        if f * k > 15_000:
            break
        a = (1 / k ** 1.3) * (1 if k % 5 else 0.3)  # plucked a fifth along the string
        sig += a * np.exp(-t * (1.1 + 0.9 * k ** 1.25)) * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k))
    return fade(sig * vel)


def paper(vel):
    """A short dry tick of paper: band-passed noise, 25 ms."""
    t = t_axis(0.025)
    sos = butter(2, [2500, 7000], btype="band", fs=SR, output="sos")
    return fade(sosfilt(sos, RNG.standard_normal(t.size)) * np.exp(-t / 0.006) * vel * 0.6, 0.5, 8)


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
    n = int(0.05 * SR)
    x[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    return x


# ---- the three directions ---------------------------------------------------

def direction_a():
    """Steps: three rising fifths on glass, each a lighter shade."""
    track = np.zeros((int(2.6 * SR), 2))
    for n, at, s, p in zip(("E5", "B5", "F#6"), (0.0, 0.18, 0.36), STRENGTH, (-0.25, 0.0, 0.25)):
        place(track, glass(hz(n), 2.6 - at, s), at, p)
    return mix(track, 0.35, 2.0, 6000)


def direction_b():
    """Spectrum: the three notes rise, then hold together while the colour opens."""
    track = np.zeros((int(2.9 * SR), 2))
    for n, at, s, p in zip(("F#4", "B4", "C#5"), (0.0, 0.14, 0.34), STRENGTH, (-0.3, 0.3, 0.0)):
        place(track, spectrum(hz(n), 2.9 - at, s, open_at=0.4 - at, open_time=1.1), at, p)
    place(track, sine(hz("B2"), 2.5, 0.35, attack=0.2), 0.34)
    return mix(track, 0.3, 2.4, 5000)


def direction_c():
    """Ink and paper: a plucked fall and a settling step, each with a paper tick."""
    track = np.zeros((int(2.4 * SR), 2))
    for n, at, s in zip(("C#5", "G#4", "A4"), (0.0, 0.2, 0.4), STRENGTH):
        place(track, pluck(hz(n), 2.4 - at, s), at)
        place(track, paper(s), at, 0.15)
    place(track, sine(hz("A2"), 1.9, 0.3, attack=0.03), 0.4)
    return mix(track, 0.22, 1.6, 4000)


DIRECTIONS = {"a-steps": direction_a, "b-spectrum": direction_b, "c-ink": direction_c}


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
