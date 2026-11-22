"""Shades sonic logo: the Spectrum versions, synthesised from code.

Every sound is rebuilt exactly from this file: no samples, no generated audio.
The motif is three notes at the mark's three strengths (100 / 75 / 50 %).

    python3 -m venv .venv && .venv/bin/pip install numpy scipy pyloudnorm
    .venv/bin/python render.py            # writes directions/*.wav|m4a|mp3 and audit.json

Needs ffmpeg with libmp3lame on PATH.
"""

import json
import subprocess
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy.ndimage import maximum_filter1d, uniform_filter1d
from scipy.io import wavfile
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

def release(t, at, length):
    """0 before `at`, rising to 1 over `length`: the outro's progress."""
    return np.clip((t - at) / length, 0, 1)


def warm(f, dur, vel, attack=0.012, decay=2.2, cut=(1.6, 6.6), open_at=0.0, open_time=1.0,
         detunes=(-0.0025, 0.0, 0.0025), end=None, rel=1.2):
    """The Spectrum voice, general form: a warm saw-like tone whose filter opens, dark blue to warm orange.

    f is a frequency in Hz or an array per sample (for a glide). cut is the filter's start and end,
    in multiples of the note. From `end` the outro runs for `rel` seconds: the tone dims to silence
    and its colour closes back from orange to blue.
    """
    t = t_axis(dur)
    f = np.broadcast_to(np.asarray(f, float), t.shape)
    r = release(t, end if end is not None else dur, rel)
    env = (1 - np.exp(-t / attack)) * np.exp(-t / decay) * 0.5 * (1 + np.cos(np.pi * r))
    opening = np.clip((t - open_at) / open_time, 0, 1) ** 1.5 * (1 - 0.8 * r)
    cutoff = f * (cut[0] + (cut[1] - cut[0]) * opening)
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


def sine(f, dur, vel, attack=0.05, decay=1.2, end=None, rel=1.2):
    t = t_axis(dur)
    r = release(t, end if end is not None else dur, rel)
    env = (1 - np.exp(-t / attack)) * np.exp(-t / decay) * 0.5 * (1 + np.cos(np.pi * r))
    return fade(np.sin(2 * np.pi * f * t) * env * vel)


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
    n = int(0.1 * SR)  # safety only: every version already ends in silence
    x[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
    return x


# ---- the versions -----------------------------------------------------------
# Round 1 kept only B; struck glass (A) and plucked string (C) were rejected by the Owner.
# Round 2: five new versions of B. Notes stay in B major's colour: F#, B, C#.

NOTES_B = ("F#4", "B4", "C#5")
WIDE = (-0.006, -0.003, 0.0, 0.003, 0.006)
TAIL = 0.6  # after the outro, the room rings out to silence


def shape(notes, times, pans, end, rel=1.2, sub_at=None, wet=(0.32, 2.4, 5000), **voice):
    """Every version has the same three parts.

    Start: the three notes enter at the mark's strengths.
    Bloom: the colour opens, dark blue to warm orange.
    Outro: from `end`, the colour closes back to blue and the sound dims over `rel` seconds,
    while home (a soft low B) settles under it; then the room rings out to silence.
    """
    dur = end + rel + TAIL
    track = np.zeros((int(dur * SR), 2))
    for n, at, s, p in zip(notes, times, STRENGTH, pans):
        kw = dict(voice, open_at=voice.get("open_at", 0.4) - at)
        place(track, warm(hz(n), dur - at, s, end=end - at, rel=rel, **kw), at, p)
    sub_at = times[-1] if sub_at is None else sub_at
    place(track, sine(hz("B2"), dur - sub_at, 0.35, attack=0.25, decay=4.0, end=end - sub_at, rel=rel), sub_at)
    land = end - 0.15  # home settles in as the outro starts
    place(track, warm(hz("B3"), dur - land, 0.22, attack=0.18, decay=4.0, cut=(1.2, 1.2),
                      end=0.35, rel=rel, detunes=WIDE), land)
    return mix(track, *wet)


def spectrum_b():
    """Round 1 B: short, short, long, the colour opens, then closes and settles home."""
    return shape(NOTES_B, (0.0, 0.14, 0.34), (-0.3, 0.3, 0.0), end=1.9, open_time=1.1, cut=(1.6, 6.6))


def wide():
    """B with a fuller voice: five detuned strings, a slower bloom."""
    return shape(NOTES_B, (0.0, 0.14, 0.34), (-0.35, 0.35, 0.0), end=2.0, rel=1.3, wet=(0.35, 2.8, 5000),
                 attack=0.03, decay=2.6, cut=(1.3, 8.0), open_at=0.35, open_time=1.3, detunes=WIDE)


def arc():
    """Up a fifth, then a step down to rest: F#, C#, B. Ends at home."""
    return shape(("F#4", "C#5", "B4"), (0.0, 0.16, 0.38), (-0.3, 0.3, 0.0), end=1.9,
                 attack=0.02, decay=2.4, cut=(1.5, 7.0), open_at=0.42, open_time=1.2, detunes=WIDE)


def bloom():
    """No attack at all: three notes swell in and open as a single chord."""
    return shape(("B3", "F#4", "C#5"), (0.0, 0.22, 0.44), (0.0, -0.35, 0.35), end=2.2, rel=1.2,
                 sub_at=0.0, wet=(0.4, 3.0, 4500), attack=0.16, decay=2.8, cut=(1.3, 9.0),
                 open_at=0.5, open_time=1.5, detunes=WIDE)


def stroke():
    """One voice glides F#, B, C# like a single stroke; each note it passes stays behind, fading like the bars."""
    times, end, rel = (0.0, 0.18, 0.4), 2.0, 1.2
    track = shape(NOTES_B, times, (-0.4, 0.4, 0.0), end=end, rel=rel,
                  attack=0.08, decay=2.2, cut=(1.2, 5.0), open_at=0.45, open_time=1.2)
    dur = track.shape[0] / SR
    dry = np.zeros_like(track)
    place(dry, warm(glide(list(zip(times, NOTES_B)), dur), dur, 0.7, attack=0.015, decay=2.4,
                    cut=(1.5, 7.5), open_at=0.45, open_time=1.2, detunes=WIDE, end=end, rel=rel), 0.0)
    return track + mix(dry, 0.32, 2.6, 5000)


def cinema():
    """For the TV open: a slow low swell first, then the notes; the colour opens further and longer."""
    track = shape(NOTES_B, (0.25, 0.42, 0.66), (-0.35, 0.35, 0.0), end=2.4, rel=1.3, sub_at=0.0,
                  wet=(0.45, 3.4, 4500), attack=0.025, decay=3.0, cut=(1.2, 10.0), open_at=0.7,
                  open_time=1.6, detunes=WIDE)
    dur = track.shape[0] / SR
    low = np.zeros_like(track)
    place(low, sine(hz("B1"), dur, 0.45, attack=0.5, decay=5.0, end=2.4, rel=1.3), 0.0)
    return track + mix(low, 0.3, 3.0, 3000)


# ---- the ensemble (Csound) ----------------------------------------------------
# Round 3: the same Start, Bloom and Outro, played by synthesised instruments in orchestra.orc:
# bowed strings, a soft horn, flute, electric piano, the analog pad, a sine floor.

ORC = Path(__file__).parent / "orchestra.orc"
STRINGS, HORN, FLUTE, KEYS, PAD, FLOOR = 1, 2, 3, 4, 5, 6


def csound(notes, dur, room=(0.55, 0.88, 7000)):
    """Render a list of notes through the orchestra. A note is
    (instrument, start, length, note name, amplitude, pan, outro start, outro length, open at, open time, attack);
    outro and opening times are absolute here and made relative to each note."""
    lines = []
    for ins, at, length, n, amp, pan, end, rel, op, opt, att in notes:
        f = hz(n[0]) * 2 ** (n[1] / 1200) if isinstance(n, tuple) else hz(n)  # (note, cents) detunes
        lines.append(f"i {ins} {at:.4f} {length:.4f} {f:.4f} {amp} {pan} "
                     f"{end - at:.4f} {rel} {op - at:.4f} {opt} {att}")
    lines.append(f"i 99 0 {dur + 0.05} {room[0]} {room[1]} {room[2]}")
    with tempfile.TemporaryDirectory() as tmp:
        sco, wav = Path(tmp) / "s.sco", Path(tmp) / "o.wav"
        sco.write_text("\n".join(lines) + "\ne\n")
        subprocess.run(["csound", "-d", "-m0", "--nodisplays", "-f", "-W", "-o", str(wav), str(ORC), str(sco)],
                       check=True, capture_output=True)
        _, x = wavfile.read(wav)
    x = x[: int(dur * SR)].astype(float)
    return np.pad(x, ((0, int(dur * SR) - x.shape[0]), (0, 0)))


def section(ins, n, at, amp, pan, end, rel, op, opt, att, dur, players=3):
    """A section: several players on one note, slightly apart in pitch, time and place."""
    out = []
    for i in range(players):
        cents = (i - (players - 1) / 2) * 5
        out.append((ins, at + 0.012 * i, dur - at, (n, cents), amp / players ** 0.5,
                    min(1, max(0, pan + (i - 1) * 0.12)), end, rel, op, opt, att))
    return out


def ensemble(parts, times=(0.0, 0.14, 0.34), notes=NOTES_B, end=1.9, rel=1.2, tail=0.7,
             open_at=0.4, open_time=1.2, room=(0.55, 0.88, 7000)):
    """Start, Bloom, Outro, played by several instruments.

    parts: (instrument, octave shift, level, attack, players). Every part plays the three notes
    at the mark's strengths. Home (a low B floor and a B3 that settles in at the outro) is added
    to every version.
    """
    dur = end + rel + tail
    score = []
    for ins, octave, level, att, players in parts:
        for n, at, s, pan in zip(notes, times, STRENGTH, (0.3, 0.7, 0.5)):
            name = n[:-1] + str(int(n[-1]) + octave)
            score += section(ins, name, at, level * s, pan, end, rel, open_at, open_time, att, dur, players)
    score.append((FLOOR, times[-1], dur - times[-1], "B2", 0.3, 0.5, end, rel, open_at, open_time, 0.25))
    land = end - 0.15
    score += section(STRINGS, "B3", land, 0.28, 0.5, end + 0.25, rel, open_at, open_time, 0.2, dur, 3)
    return csound(score, dur, room)


def strings():
    """A string section holds the three notes and brightens as the bow presses in."""
    return ensemble([(STRINGS, 0, 0.5, 0.12, 3), (STRINGS, -1, 0.3, 0.2, 3)])


def horns():
    """Strings with a soft horn doubling them: the most cinematic."""
    return ensemble([(STRINGS, 0, 0.45, 0.12, 3), (HORN, 0, 0.22, 0.15, 2)], end=2.0, rel=1.3,
                    room=(0.6, 0.9, 6500))


def keys():
    """An electric piano strikes the three notes; the analog pad holds them and opens."""
    return ensemble([(KEYS, 0, 0.5, 0.004, 1), (PAD, 0, 0.3, 0.06, 1), (PAD, -1, 0.18, 0.1, 1)])


def air():
    """A flute plays the three notes over held strings."""
    return ensemble([(FLUTE, 0, 0.45, 0.05, 1), (STRINGS, -1, 0.3, 0.2, 3)])


def score_open():
    """For the TV open: everything together, a low swell first, longer bloom and outro."""
    return ensemble([(PAD, 0, 0.25, 0.06, 1), (STRINGS, 0, 0.4, 0.12, 3), (HORN, 0, 0.18, 0.15, 2),
                     (KEYS, 1, 0.2, 0.004, 1)], times=(0.25, 0.42, 0.66), end=2.6, rel=1.4, tail=0.8,
                    open_at=0.7, open_time=1.6, room=(0.6, 0.9, 6500))


ENSEMBLE = {"e1-strings": strings, "e2-horns": horns, "e3-keys": keys, "e4-air": air, "e5-score": score_open}

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
        "last_500ms_peak_db": round(20 * np.log10(np.abs(x[-int(0.5 * SR):]).max() + 1e-12), 1),
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
    import sys
    todo = {**DIRECTIONS, **ENSEMBLE}
    if len(sys.argv) > 1:
        todo = {k: v for k, v in todo.items() if any(a in k for a in sys.argv[1:])}
    old = json.loads((OUT / "audit.json").read_text()) if (OUT / "audit.json").exists() else {}
    report.update({k: v for k, v in old.items() if not any(k.startswith(f"shades-logo-{n}-") for n in todo)})
    for name, build in todo.items():
        x = master(build())
        stem = write(name, x)
        report[stem.name] = audit(x)
        assert report[stem.name]["true_peak_dbtp"] <= -1.0, stem.name
        assert abs(report[stem.name]["lufs"] - TARGET_LUFS) < 0.5, stem.name
    (OUT / "audit.json").write_text(json.dumps(dict(sorted(report.items())), indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if any(k.startswith(f"shades-logo-{n}-") for n in todo)}, indent=2))
